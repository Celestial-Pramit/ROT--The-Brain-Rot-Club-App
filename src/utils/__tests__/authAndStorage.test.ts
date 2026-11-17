import { assert, describe, it } from '../testHarness';
import {
  createChunkedSecureStorage,
  sanitizeSecureStoreKey,
  SecureStoreBackend,
  splitIntoUtf8Chunks,
} from '../secureStorageCore';
import {
  CloudProfile,
  isDisallowedServerKey,
  mapAuthError,
  performGoogleSignIn,
  performSessionRestore,
  performSignOut,
  resolveCloudAccountIdentity,
  validateClientEnv,
} from '../authHelpers';
import {
  calculateTotalXp,
  createInitialPersistedState,
  DEFAULT_BASE_XP,
} from '../domainLogic';

function createMemorySecureStoreBackend(): {
  backend: SecureStoreBackend;
  store: Map<string, string>;
} {
  const store = new Map<string, string>();
  const backend: SecureStoreBackend = {
    async getItemAsync(key: string) {
      return store.get(key) ?? null;
    },
    async setItemAsync(key: string, value: string) {
      for (const ch of key) {
        if (!/[A-Za-z0-9._-]/.test(ch)) {
          throw new Error(`Invalid SecureStore key: ${key}`);
        }
      }
      store.set(key, value);
    },
    async deleteItemAsync(key: string) {
      store.delete(key);
    },
  };
  return { backend, store };
}

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeFakeJwtWithRole(role: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({ role, iss: 'supabase' }));
  return `${header}.${payload}.signature`;
}

describe('ROT Stage 3 — Encrypted Storage, Env Validation & Google Auth (Simulated Unit Tests)', () => {
  it('Sanitizes SecureStore keys and chunks large UTF-8 JWT sessions under 1800 bytes without losing surrogate pairs', async () => {
    assert.equal(sanitizeSecureStoreKey('sb:wlz/auth-token'), 'sb_wlz_auth-token');

    const { backend, store } = createMemorySecureStoreBackend();
    const adapter = createChunkedSecureStorage(backend, 1800);

    // Build a realistic large Supabase session JSON (> 4 KB) with emoji in metadata
    const hugeSessionJson = JSON.stringify({
      access_token: 'a'.repeat(1600),
      refresh_token: 'r'.repeat(800),
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: null,
        user_metadata: { full_name: 'Ayla 🧠✨ '.repeat(120) },
      },
    });

    const chunks = splitIntoUtf8Chunks(hugeSessionJson, 1800);
    const encoder = new TextEncoder();
    assert.ok(chunks.length >= 3, 'Expected large session to split into >= 3 chunks');
    for (const chunk of chunks) {
      assert.ok(
        encoder.encode(chunk).length <= 1800,
        'Each chunk must stay within 1800 UTF-8 bytes'
      );
    }

    await adapter.setItem('sb-wlz-auth-token', hugeSessionJson);
    assert.equal(await adapter.getItem('sb-wlz-auth-token'), hugeSessionJson);
    assert.equal(store.get('sb-wlz-auth-token.__chunks'), String(chunks.length));

    // Corrupting a chunk must return null instead of partial JSON
    const savedChunk1 = store.get('sb-wlz-auth-token.__chunk_1')!;
    store.delete('sb-wlz-auth-token.__chunk_1');
    assert.equal(await adapter.getItem('sb-wlz-auth-token'), null);
    store.set('sb-wlz-auth-token.__chunk_1', savedChunk1);

    // Overwriting with a small value must clean up all stale chunk keys
    await adapter.setItem('sb-wlz-auth-token', '{"small":true}');
    assert.equal(await adapter.getItem('sb-wlz-auth-token'), '{"small":true}');
    assert.equal(store.has('sb-wlz-auth-token.__chunks'), false);
    assert.equal(store.has('sb-wlz-auth-token.__chunk_0'), false);

    // Remove deletes remaining entry cleanly
    await adapter.removeItem('sb-wlz-auth-token');
    assert.equal(await adapter.getItem('sb-wlz-auth-token'), null);
    assert.equal(store.size, 0);
  });

  it('Validates client env vars and blocks accidental service_role or secret keys', () => {
    const anonJwt = makeFakeJwtWithRole('anon');
    const serviceRoleJwt = makeFakeJwtWithRole('service_role');

    assert.equal(isDisallowedServerKey(anonJwt), false);
    assert.equal(isDisallowedServerKey(serviceRoleJwt), true);
    assert.equal(isDisallowedServerKey('sb_secret_12345'), true);

    const missingEnv = validateClientEnv({});
    assert.equal(missingEnv.configured, false);

    const httpEnv = validateClientEnv({
      supabaseUrl: 'http://wlzkooowbanponzaxsvj.supabase.co',
      supabaseAnonKey: anonJwt,
    });
    assert.equal(httpEnv.configured, false);

    const serviceRoleEnv = validateClientEnv({
      supabaseUrl: 'https://wlzkooowbanponzaxsvj.supabase.co',
      supabaseAnonKey: serviceRoleJwt,
    });
    assert.equal(serviceRoleEnv.configured, false);

    const validEnv = validateClientEnv({
      supabaseUrl: 'https://wlzkooowbanponzaxsvj.supabase.co',
      supabaseAnonKey: anonJwt,
      googleWebClientId: '123456-abc.apps.googleusercontent.com',
    });
    assert.equal(validEnv.configured, true);
    if (validEnv.configured) {
      assert.equal(validEnv.googleConfigured, true);
      assert.equal(
        validEnv.googleWebClientId,
        '123456-abc.apps.googleusercontent.com'
      );
    }
  });

  it('Handles missing/null email gracefully when resolving CloudAccountIdentity', () => {
    const profile: CloudProfile = {
      id: 'user-1',
      display_name: 'Club Balance',
      avatar_url: 'https://example.com/avatar.png',
      share_squad_status: false,
      status_band: 'hidden',
      timezone: 'UTC',
      cloud_xp: 0,
      created_at: '2026-11-18T00:00:00Z',
      updated_at: '2026-11-18T00:00:00Z',
    };

    const hiddenEmailIdentity = resolveCloudAccountIdentity(
      {
        id: 'user-1',
        email: null,
        user_metadata: { full_name: 'Ignored Meta Name' },
      },
      profile
    );
    assert.equal(hiddenEmailIdentity.email, null);
    assert.equal(hiddenEmailIdentity.hasEmail, false);
    assert.equal(hiddenEmailIdentity.emailLabel, 'Email hidden by Google');
    assert.equal(hiddenEmailIdentity.displayName, 'Club Balance');
    assert.equal(hiddenEmailIdentity.cloudXp, 0);

    // Fallback when profile is not yet loaded and email is undefined
    const fallbackIdentity = resolveCloudAccountIdentity(
      {
        id: 'user-2',
        email: undefined,
        user_metadata: { avatar_url: 'http://insecure.example.com/a.png' },
      },
      null
    );
    assert.equal(fallbackIdentity.displayName, 'ROT Club Member');
    assert.equal(fallbackIdentity.avatarUrl, null);
    assert.equal(fallbackIdentity.emailLabel, 'Email hidden by Google');
  });

  it('Simulates Google Sign-In + Supabase signInWithIdToken success, cancellation, network failure, and invalid token', async () => {
    const profile: CloudProfile = {
      id: 'auth-user-123',
      display_name: 'Ayla',
      avatar_url: null,
      share_squad_status: false,
      status_band: 'hidden',
      timezone: 'UTC',
      cloud_xp: 0,
      created_at: '2026-11-18T00:00:00Z',
      updated_at: '2026-11-18T00:00:00Z',
    };

    // 1. Success flow
    const successRes = await performGoogleSignIn({
      isConfigured: () => true,
      hasPlayServices: async () => true,
      signInWithGoogleNative: async () => ({
        cancelled: false,
        idToken: 'mock-google-id-token',
      }),
      signInWithSupabaseIdToken: async (idToken) => {
        assert.equal(idToken, 'mock-google-id-token');
        return {
          session: {
            access_token: 'mock-access',
            user: { id: 'auth-user-123', email: null },
          },
          error: null,
        };
      },
      fetchProfile: async () => profile,
    });
    assert.equal(successRes.ok, true);
    if (successRes.ok) {
      assert.equal(successRes.profile?.cloud_xp, 0);
    }

    // 2. Guest XP remains strictly separate at DEFAULT_BASE_XP (284)
    const guestState = createInitialPersistedState('2026-11-18');
    assert.equal(calculateTotalXp(guestState), DEFAULT_BASE_XP);
    assert.equal(DEFAULT_BASE_XP, 284);

    // 3. Cancellation flow
    const cancelRes = await performGoogleSignIn({
      isConfigured: () => true,
      hasPlayServices: async () => true,
      signInWithGoogleNative: async () => ({ cancelled: true }),
      signInWithSupabaseIdToken: async () => {
        throw new Error('Should not call Supabase on cancel');
      },
      fetchProfile: async () => null,
    });
    assert.equal(cancelRes.ok, false);
    if (!cancelRes.ok) {
      assert.equal(cancelRes.error.code, 'cancelled');
      assert.equal(cancelRes.error.cancelled, true);
    }

    // 4. Invalid token / nonce error from Supabase
    const invalidTokenRes = await performGoogleSignIn({
      isConfigured: () => true,
      hasPlayServices: async () => true,
      signInWithGoogleNative: async () => ({
        cancelled: false,
        idToken: 'bad-token',
      }),
      signInWithSupabaseIdToken: async () => ({
        session: null,
        error: new Error('Invalid id_token: passed nonce mismatch'),
      }),
      fetchProfile: async () => null,
    });
    assert.equal(invalidTokenRes.ok, false);
    if (!invalidTokenRes.ok) {
      assert.equal(invalidTokenRes.error.code, 'invalid_token');
    }

    // 5. Network failure error mapping
    const netErr = mapAuthError(new Error('Network request failed'));
    assert.equal(netErr.code, 'network_error');

    // 6. Missing idToken error
    const missingTokenRes = await performGoogleSignIn({
      isConfigured: () => true,
      hasPlayServices: async () => true,
      signInWithGoogleNative: async () => ({
        cancelled: false,
        idToken: null,
      }),
      signInWithSupabaseIdToken: async () => ({ session: null, error: null }),
      fetchProfile: async () => null,
    });
    assert.equal(missingTokenRes.ok, false);
    if (!missingTokenRes.ok) {
      assert.equal(missingTokenRes.error.code, 'missing_id_token');
    }
  });

  it('Simulates session restoration across restarts and clean logout preserving guest XP', async () => {
    const restored = await performSessionRestore({
      isConfigured: () => true,
      getSession: async () => ({
        session: {
          access_token: 'restored-jwt',
          user: { id: 'u1', email: 'member@example.com' },
        },
        error: null,
      }),
      fetchProfile: async () => null,
    });
    assert.equal(restored.status, 'authenticated');

    const emptyRestore = await performSessionRestore({
      isConfigured: () => true,
      getSession: async () => ({ session: null, error: null }),
      fetchProfile: async () => null,
    });
    assert.equal(emptyRestore.status, 'guest');

    const unconfiguredRestore = await performSessionRestore({
      isConfigured: () => false,
      getSession: async () => ({ session: null, error: null }),
      fetchProfile: async () => null,
    });
    assert.equal(unconfiguredRestore.status, 'unconfigured');

    // Sign out succeeds even if Google native signOut rejects
    let supabaseSignedOut = false;
    const signOutRes = await performSignOut({
      signOutSupabase: async () => {
        supabaseSignedOut = true;
        return { error: null };
      },
      signOutGoogleNative: async () => {
        throw new Error('Native signOut not initialized');
      },
    });
    assert.equal(supabaseSignedOut, true);
    assert.equal(signOutRes.ok, true);
  });
});
