import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import Icon from './Icon';

type Props = {
  visible: boolean;
  completedBreaksCount: number;
  onClose: () => void;
  onCompleteBreak: (sessionId: string, durationMinutes: number) => void;
};

const DURATION_OPTIONS = [
  { label: '1m Demo', seconds: 60 },
  { label: '5m', seconds: 5 * 60 },
  { label: '10m', seconds: 10 * 60 },
];

export default function BreakModal({
  visible,
  completedBreaksCount,
  onClose,
  onCompleteBreak,
}: Props) {
  const [totalSeconds, setTotalSeconds] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const sessionRef = useRef(`session-${Date.now()}`);

  useEffect(() => {
    if (visible) {
      sessionRef.current = `session-${Date.now()}`;
      setRunning(false);
      setSecondsLeft(totalSeconds);
    }
  }, [visible, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      onCompleteBreak(sessionRef.current, Math.max(1, Math.round(totalSeconds / 60)));
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, secondsLeft, totalSeconds, onCompleteBreak]);

  const formatted = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const progressPct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={styles.mascot}>
            <Icon name="brain" size={32} color={COLORS.white} />
          </View>

          <Text style={styles.eyebrow}>
            FOCUS SESSION · {completedBreaksCount} COMPLETED
          </Text>
          <Text style={styles.title}>{'A tiny break\nfor a big brain.'}</Text>
          <Text style={styles.subtitle}>
            Put your phone down, look away from the screen, and let your thoughts catch up.
          </Text>

          {/* Duration selector */}
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((opt) => {
              const active = totalSeconds === opt.seconds;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.durationChip, active && styles.durationChipActive]}
                  disabled={running}
                  onPress={() => {
                    setTotalSeconds(opt.seconds);
                    setSecondsLeft(opt.seconds);
                  }}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      active && styles.durationChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.timer}>{formatted}</Text>

          <View style={styles.track}>
            <View
              style={[styles.trackFill, { width: `${progressPct}%` }]}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setRunning((r) => !r)}
              activeOpacity={0.8}
            >
              <Icon
                name={running ? 'pause' : 'play'}
                size={16}
                color={COLORS.white}
              />
              <Text style={styles.primaryText}>
                {running ? 'Pause break' : 'Start break'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.completeNowBtn}
            onPress={() => {
              setRunning(false);
              onCompleteBreak(sessionRef.current, Math.max(1, Math.round(totalSeconds / 60)));
            }}
            activeOpacity={0.75}
          >
            <Icon name="check" size={14} color={COLORS.purple} />
            <Text style={styles.completeNowText}>
              Complete focus reset now (+30 XP)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41,16,76,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#dfa8d0',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
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
  },
  mascot: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.pink,
    borderWidth: 4,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: COLORS.yellow,
    shadowOpacity: 0.4,
    shadowOffset: { width: 4, height: 4 },
    elevation: 5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    maxWidth: 260,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  durationChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee8f7',
  },
  durationChipActive: {
    backgroundColor: COLORS.purple,
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  durationChipTextActive: {
    color: COLORS.white,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.purple,
    letterSpacing: -2,
    marginTop: 14,
    marginBottom: 10,
  },
  track: {
    width: '100%',
    height: 7,
    backgroundColor: '#eadff0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: COLORS.pink,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#eee8f7',
  },
  secondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    shadowColor: '#bf256b',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  completeNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1eaf9',
  },
  completeNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
});
