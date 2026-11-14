import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';
import {
  Badge,
  Celebration,
  InstagramUsageSummary,
  PersistedAppState,
  UserSettings,
  View as ViewType,
} from './src/constants/types';
import { getBadges } from './src/constants/data';
import {
  buildUsageDisplayState,
  calculateBrainrotIndex,
  calculateEarnedXpForDate,
  calculateLimitProgress,
  calculateTotalXp,
  claimDailyChestState,
  clampDailyLimitMinutes,
  clearLocalHistoryState,
  completeFocusBreakState,
  createInitialPersistedState,
  formatMinutesAsHoursAndMinutes,
  getDailyChestForDate,
  getEffectiveDailyLimitMinutes,
  getLocalDateKey,
  getMissionsForDate,
  toggleMissionState,
} from './src/utils/domainLogic';
import { loadPersistedState, savePersistedState } from './src/utils/storage';
import {
  openAndroidUsageAccessSettings,
  queryInstagramUsageSummary,
} from './src/utils/usageStats';
import TodayScreen from './src/screens/TodayScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BrainrotCardScreen from './src/screens/BrainrotCardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BreakModal from './src/components/BreakModal';
import CelebrationOverlay from './src/components/CelebrationOverlay';
import UsagePermissionModal from './src/components/UsagePermissionModal';
import Icon from './src/components/Icon';

type TabItem = {
  key: ViewType;
  icon: string;
  label: string;
};

const tabs: TabItem[] = [
  { key: 'Today', icon: 'bar-chart-2', label: 'Today' },
  { key: 'Missions', icon: 'award', label: 'Missions' },
  { key: 'Badges', icon: 'award', label: 'Badges' },
  { key: 'Leaderboard', icon: 'users', label: 'Board' },
  { key: 'Card', icon: 'cpu', label: 'Card' },
  { key: 'Settings', icon: 'settings', label: 'Settings' },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('Today');
  const [appState, setAppState] = useState<PersistedAppState>(() =>
    createInitialPersistedState()
  );
  const [hydrated, setHydrated] = useState(false);
  const [usageSummary, setUsageSummary] = useState<InstagramUsageSummary | null>(
    null
  );
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const updateAndPersist = useCallback(
    (updater: (prev: PersistedAppState) => PersistedAppState) => {
      setAppState((prev) => {
        const next = updater(prev);
        void savePersistedState(next);
        return next;
      });
    },
    []
  );

  const syncUsageStats = useCallback(
    async (showFeedbackToast = false) => {
      const summary = await queryInstagramUsageSummary(7);
      setUsageSummary(summary);
      updateAndPersist((prev) => ({
        ...prev,
        cachedUsageSummary:
          prev.consentStatus === 'accepted' && prev.trackingEnabled
            ? summary
            : prev.cachedUsageSummary,
      }));
      if (showFeedbackToast) {
        if (!summary.permissionGranted) {
          setToast('Usage Access permission is not granted yet.');
        } else if (summary.status === 'ok' && summary.todayForegroundMs !== null) {
          const mins = Math.round(summary.todayForegroundMs / 60000);
          setToast(
            `Synced: ${formatMinutesAsHoursAndMinutes(mins).compact} estimated Instagram foreground time today.`
          );
        } else {
          setToast(summary.statusReason || 'Usage status refreshed.');
        }
      }
    },
    [updateAndPersist]
  );

  // Hydrate persisted state and query initial UsageStats
  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadPersistedState();
      if (!mounted) return;
      setAppState(loaded);
      if (loaded.cachedUsageSummary) {
        setUsageSummary(loaded.cachedUsageSummary);
      }
      setHydrated(true);

      const liveSummary = await queryInstagramUsageSummary(7);
      if (!mounted) return;
      setUsageSummary(liveSummary);

      // Prompt consent modal on initial launch if still pending
      if (loaded.consentStatus === 'pending') {
        setPermissionModalOpen(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Re-query UsageStats automatically when returning from Android system Usage Access settings
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextStatus: AppStateStatus) => {
        if (nextStatus === 'active' && hydrated) {
          void syncUsageStats(false);
        }
      }
    );
    return () => sub.remove();
  }, [hydrated, syncUsageStats]);

  // Toast animation
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (toast === '') return;
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setToast(''));
    }, 2600);

    return () => clearTimeout(timer);
  }, [toast, toastOpacity, toastTranslateY]);

  const dateKey = getLocalDateKey();
  const missions = getMissionsForDate(appState, dateKey);
  const completedMissions = missions.filter((m) => m.done).length;
  const dailyChest = getDailyChestForDate(appState);
  const totalXp = calculateTotalXp(appState);
  const earnedTodayXp = calculateEarnedXpForDate(appState, dateKey);
  const badges = getBadges(
    missions,
    appState.completedFocusBreaks,
    appState.unlockedBadges
  );

  const effectiveLimitMinutes = getEffectiveDailyLimitMinutes(
    appState.dailyLimitMinutes,
    appState.settings.weekendBreathingRoom
  );

  const usageDisplay = buildUsageDisplayState(
    usageSummary,
    appState.consentStatus,
    appState.trackingEnabled
  );

  const limitProgress = calculateLimitProgress(
    usageSummary?.todayForegroundMs ?? null,
    effectiveLimitMinutes,
    usageDisplay.hasVerifiedEstimate
  );

  const brainrotIndex = calculateBrainrotIndex(
    usageSummary?.todayForegroundMs ?? null,
    effectiveLimitMinutes,
    usageDisplay.hasVerifiedEstimate,
    completedMissions,
    appState.completedFocusBreaks
  );

  function handleToggleMission(index: number) {
    const result = toggleMissionState(appStateRef.current, index, dateKey);
    updateAndPersist(() => result.nextState);
    if (result.celebration) {
      setCelebration(result.celebration);
    }
    if (result.toastMessage) {
      setToast(result.toastMessage);
    }
  }

  function handleClaimDailyChest() {
    const result = claimDailyChestState(appStateRef.current);
    updateAndPersist(() => result.nextState);
    if (result.celebration) {
      setCelebration(result.celebration);
    }
    if (result.toastMessage) {
      setToast(result.toastMessage);
    }
  }

  function handleCompleteFocusBreak(sessionId: string) {
    setBreakOpen(false);
    const result = completeFocusBreakState(
      appStateRef.current,
      sessionId,
      dateKey
    );
    updateAndPersist(() => result.nextState);
    if (result.celebration) {
      setCelebration(result.celebration);
    }
    if (result.toastMessage) {
      setToast(result.toastMessage);
    }
  }

  function handleBadgePress(badge: Badge) {
    if (!badge.unlocked) {
      setToast(`Keep going: ${badge.requirement} to unlock ${badge.name}.`);
      return;
    }
    setCelebration({
      title: badge.name,
      detail: badge.description,
      reward: 'TROPHY CABINET HIGHLIGHT',
      iconName: badge.iconName,
      kind: 'badge',
    });
  }

  function handleUsageAction() {
    if (usageDisplay.actionKind === 'consent') {
      setPermissionModalOpen(true);
      return;
    }
    if (usageDisplay.actionKind === 'enable_tracking') {
      updateAndPersist((prev) => ({
        ...prev,
        trackingEnabled: true,
      }));
      void syncUsageStats(true);
      return;
    }
    if (usageDisplay.actionKind === 'permission') {
      setPermissionModalOpen(true);
      return;
    }
    void syncUsageStats(true);
  }

  async function handleAcceptAndOpenSettings() {
    const nowIso = new Date().toISOString();
    updateAndPersist((prev) => ({
      ...prev,
      consentStatus: 'accepted',
      consentUpdatedAt: nowIso,
      trackingEnabled: true,
    }));
    setPermissionModalOpen(false);
    const opened = await openAndroidUsageAccessSettings();
    if (!opened) {
      setToast('Open Android Settings > Apps > Special app access > Usage access.');
    } else {
      setToast('Enable Usage Access for ROT, then return to the app.');
    }
  }

  function handleAcceptWithoutSettings() {
    const nowIso = new Date().toISOString();
    updateAndPersist((prev) => ({
      ...prev,
      consentStatus: 'accepted',
      consentUpdatedAt: nowIso,
      trackingEnabled: true,
    }));
    setPermissionModalOpen(false);
    void syncUsageStats(true);
  }

  function handleDeclineOrLater() {
    const nowIso = new Date().toISOString();
    updateAndPersist((prev) => ({
      ...prev,
      consentStatus: prev.consentStatus === 'accepted' ? 'accepted' : 'declined',
      consentUpdatedAt: nowIso,
      trackingEnabled: false,
    }));
    setPermissionModalOpen(false);
    setToast('Continuing without Instagram tracking. Missions & breaks still work.');
  }

  function handleChangeDailyLimit(minutes: number) {
    const clamped = clampDailyLimitMinutes(minutes);
    updateAndPersist((prev) => {
      // Also complete "Set a scroll limit" mission if not yet done today
      const currentMissions = getMissionsForDate(prev, dateKey);
      const limitIdx = currentMissions.findIndex(
        (m) => m.id === 'set-scroll-limit'
      );
      let next = {
        ...prev,
        dailyLimitMinutes: clamped,
      };
      if (limitIdx >= 0 && !currentMissions[limitIdx].done) {
        next = toggleMissionState(next, limitIdx, dateKey, true).nextState;
      }
      return next;
    });
    setToast(
      `Daily limit updated to ${formatMinutesAsHoursAndMinutes(clamped).compact}.`
    );
  }

  function handleToggleSetting(key: keyof UserSettings) {
    updateAndPersist((prev) => {
      const nextVal = !prev.settings[key];
      const nextSettings = {
        ...prev.settings,
        [key]: nextVal,
      };
      return {
        ...prev,
        settings: nextSettings,
      };
    });
    setToast('Preference saved locally.');
  }

  function handleClearLocalHistory() {
    updateAndPersist((prev) => clearLocalHistoryState(prev, dateKey));
    setToast('Local usage cache and mission history cleared.');
  }

  function renderScreen() {
    switch (activeView) {
      case 'Today':
        return (
          <TodayScreen
            completedMissions={completedMissions}
            earnedXp={earnedTodayXp}
            missions={missions}
            onMissionClick={handleToggleMission}
            onBreak={() => setBreakOpen(true)}
            onViewMissions={() => setActiveView('Missions')}
            onOpenSettings={() => setActiveView('Settings')}
            chest={dailyChest}
            onClaimChest={handleClaimDailyChest}
            usageSummary={usageSummary}
            usageDisplay={usageDisplay}
            limitProgress={limitProgress}
            brainrotIndex={brainrotIndex}
            effectiveLimitMinutes={effectiveLimitMinutes}
            showGentleNudge={appState.settings.dailyGentleNudge}
            onUsageAction={handleUsageAction}
            onRefreshUsage={() => void syncUsageStats(true)}
          />
        );
      case 'Missions':
        return (
          <MissionsScreen
            missions={missions}
            onMissionClick={handleToggleMission}
            earnedXp={earnedTodayXp}
          />
        );
      case 'Badges':
        return (
          <BadgesScreen
            badges={badges}
            onBadgePress={handleBadgePress}
          />
        );
      case 'Leaderboard':
        return (
          <LeaderboardScreen
            totalXp={totalXp}
            earnedTodayXp={earnedTodayXp}
            onToast={setToast}
          />
        );
      case 'Card':
        return (
          <BrainrotCardScreen
            totalXp={totalXp}
            archetypeTitle={brainrotIndex.archetypeTitle}
            archetypeDesc={brainrotIndex.archetypeDesc}
            privateMode={appState.settings.privateMode}
            onToast={setToast}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen
            consentStatus={appState.consentStatus}
            trackingEnabled={appState.trackingEnabled}
            dailyLimitMinutes={appState.dailyLimitMinutes}
            settings={appState.settings}
            usageSummary={usageSummary}
            onToggleTracking={(nextEnabled) => {
              updateAndPersist((prev) => ({
                ...prev,
                trackingEnabled: nextEnabled,
              }));
              setToast(
                nextEnabled
                  ? 'Instagram usage tracking resumed.'
                  : 'Instagram usage tracking paused.'
              );
              if (nextEnabled) {
                void syncUsageStats(false);
              }
            }}
            onOpenUsageSetup={() => setPermissionModalOpen(true)}
            onOpenSystemUsageSettings={async () => {
              const opened = await openAndroidUsageAccessSettings();
              if (!opened) {
                setToast(
                  'Open Android Settings > Apps > Special app access > Usage access.'
                );
              }
            }}
            onChangeDailyLimit={handleChangeDailyLimit}
            onToggleSetting={handleToggleSetting}
            onClearLocalHistory={handleClearLocalHistory}
            onRefreshUsage={() => void syncUsageStats(true)}
          />
        );
    }
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMark}>
            <Icon name="brain" size={16} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.brandName}>ROT.</Text>
            <Text style={styles.brandCaption}>The Brainrot Club</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setToast(
                limitProgress.nudgeMessage ||
                  'You are all caught up. Your brain approves.'
              )
            }
          >
            <Feather name="bell" size={17} color={COLORS.purple} />
          </TouchableOpacity>
          <View style={styles.xpPill}>
            <Feather name="zap" size={13} color={COLORS.pink} />
            <Text style={styles.xpText}>
              <Text style={styles.xpBold}>{totalXp}</Text> XP
            </Text>
          </View>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeView === tab.key;
          const pendingMissions = missions.length - completedMissions;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveView(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Feather
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? COLORS.white : '#8d7e9c'}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.key === 'Missions' && pendingMissions > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {pendingMissions}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Usage Access & Consent Modal */}
      <UsagePermissionModal
        visible={permissionModalOpen}
        consentStatus={appState.consentStatus}
        permissionGranted={Boolean(usageSummary?.permissionGranted)}
        instagramInstalled={Boolean(usageSummary?.instagramInstalled)}
        onAcceptAndOpenSettings={handleAcceptAndOpenSettings}
        onAcceptWithoutSettings={handleAcceptWithoutSettings}
        onDeclineOrLater={handleDeclineOrLater}
        onClose={() => setPermissionModalOpen(false)}
      />

      {/* Break Modal */}
      <BreakModal
        visible={breakOpen}
        completedBreaksCount={appState.completedFocusBreaks}
        onClose={() => setBreakOpen(false)}
        onCompleteBreak={handleCompleteFocusBreak}
      />

      {/* Celebration Overlay */}
      {celebration && (
        <CelebrationOverlay
          celebration={celebration}
          onClose={() => setCelebration(null)}
        />
      )}

      {/* Toast */}
      {toast !== '' && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Feather name="zap" size={14} color={COLORS.white} />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,251,241,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#eee2d4',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOpacity: 0.4,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
    transform: [{ rotate: '-4deg' }],
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  brandCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.pink,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#553074',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 30,
    backgroundColor: COLORS.palePink,
  },
  xpText: {
    fontSize: 11,
    color: COLORS.pink,
  },
  xpBold: {
    fontWeight: '800',
  },

  // Screen container
  screenContainer: {
    flex: 1,
  },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,251,241,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#eee2d4',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.purple,
    shadowColor: '#e3bde0',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8d7e9c',
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: '22%' as any,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f9dfe9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.pink,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.pink,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 30,
    backgroundColor: COLORS.purple,
    shadowColor: '#2a1648',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
});
