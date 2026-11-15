import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { ConsentStatus } from '../constants/types';
import Icon from './Icon';

type Props = {
  visible: boolean;
  consentStatus: ConsentStatus;
  permissionGranted: boolean;
  instagramInstalled: boolean;
  onAcceptAndOpenSettings: () => void;
  onAcceptWithoutSettings: () => void;
  onDeclineOrLater: () => void;
  onClose: () => void;
};

export default function UsagePermissionModal({
  visible,
  consentStatus,
  permissionGranted,
  instagramInstalled,
  onAcceptAndOpenSettings,
  onAcceptWithoutSettings,
  onDeclineOrLater,
  onClose,
}: Props) {
  const isAlreadyPermitted = permissionGranted;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.orb}>
              <Icon name="shield-check" size={28} color={COLORS.white} />
            </View>

            <Text style={styles.eyebrow}>TRANSPARENT USAGE SETUP</Text>
            <Text style={styles.title}>How ROT estimates your scroll time.</Text>
            <Text style={styles.subtitle}>
              ROT uses Android’s standard Usage Access API to read foreground time for
              Instagram (`com.instagram.android`).
            </Text>

            <View style={styles.bulletBox}>
              <View style={styles.bulletRow}>
                <Icon name="check" size={15} color={COLORS.green} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>What is read:</Text> Estimated total time
                  Instagram is open in the foreground on your device.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Icon name="lock" size={15} color={COLORS.purple} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>What is never collected:</Text> No Instagram
                  login, no messages, no screen recording, and no exact Reel counts.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Icon name="info" size={15} color={COLORS.pink} />
                <Text style={styles.bulletText}>
                  <Text style={styles.bold}>Honest estimates:</Text> Android UsageStats
                  tracks app-level foreground sessions. If access is off or OS records are
                  missing, ROT says so instead of showing 0m.
                </Text>
              </View>
            </View>

            <View style={styles.statusStrip}>
              <View style={styles.statusChip}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: permissionGranted ? COLORS.green : COLORS.orange },
                  ]}
                />
                <Text style={styles.statusChipText}>
                  Usage Access: {permissionGranted ? 'Granted' : 'Not granted yet'}
                </Text>
              </View>
              <View style={styles.statusChip}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: instagramInstalled ? COLORS.green : COLORS.orange },
                  ]}
                />
                <Text style={styles.statusChipText}>
                  Instagram: {instagramInstalled ? 'Installed' : 'Not detected'}
                </Text>
              </View>
            </View>

            {isAlreadyPermitted ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onAcceptWithoutSettings}
                activeOpacity={0.85}
              >
                <Icon name="check" size={16} color={COLORS.white} />
                <Text style={styles.primaryText}>Enable Instagram Estimate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onAcceptAndOpenSettings}
                activeOpacity={0.85}
              >
                <Icon name="external-link" size={15} color={COLORS.white} />
                <Text style={styles.primaryText}>
                  Agree & Open Android Usage Access
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onDeclineOrLater}
              activeOpacity={0.75}
            >
              <Text style={styles.secondaryText}>
                {consentStatus === 'accepted'
                  ? 'Keep paused for now'
                  : 'Continue without usage tracking'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41,16,76,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    maxHeight: '88%',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: 24,
    shadowColor: '#29104c',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 6,
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0e7f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  orb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.purple,
    borderWidth: 3,
    borderColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 6,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  bulletBox: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.ink,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.purple,
  },
  statusStrip: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    justifyContent: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#f0e9f7',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ink,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.pink,
    marginTop: 18,
    shadowColor: '#bf256b',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#eee8f7',
    marginTop: 8,
  },
  secondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
});
