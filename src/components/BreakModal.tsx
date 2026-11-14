import React, { useState, useEffect } from 'react';
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
  onClose: () => void;
};

export default function BreakModal({ visible, onClose }: Props) {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  useEffect(() => {
    if (!visible) {
      setRunning(false);
      setSecondsLeft(10 * 60);
    }
  }, [visible]);

  useEffect(() => {
    if (!running || secondsLeft === 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, secondsLeft]);

  const formatted = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

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

          <Text style={styles.eyebrow}>FOCUS SESSION</Text>
          <Text style={styles.title}>{'A tiny break\nfor a big brain.'}</Text>
          <Text style={styles.subtitle}>
            Put your phone down, look away from the screen, and let your thoughts catch up.
          </Text>

          <Text style={styles.timer}>{formatted}</Text>

          <View style={styles.track}>
            <View
              style={[styles.trackFill, { width: `${(secondsLeft / 600) * 100}%` }]}
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
    padding: 32,
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
    marginBottom: 16,
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
    marginTop: 10,
    lineHeight: 19,
    maxWidth: 260,
  },
  timer: {
    fontSize: 50,
    fontWeight: '700',
    color: COLORS.purple,
    letterSpacing: -2,
    marginTop: 22,
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
    marginTop: 24,
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
});
