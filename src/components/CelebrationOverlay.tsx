import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Celebration } from '../constants/types';
import Icon from './Icon';

type Props = {
  celebration: Celebration;
  onClose: () => void;
};

export default function CelebrationOverlay({ celebration, onClose }: Props) {
  const bgColor =
    celebration.kind === 'badge'
      ? COLORS.yellow
      : celebration.kind === 'chest'
      ? COLORS.chestGold
      : COLORS.pink;

  const iconColor =
    celebration.kind === 'badge'
      ? COLORS.purple
      : celebration.kind === 'chest'
      ? COLORS.chestBrown
      : COLORS.white;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        {/* Confetti dots */}
        {Array.from({ length: 12 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.confetti,
              {
                left: `${8 + ((i * 19) % 84)}%` as any,
                top: `${12 + ((i * 13) % 28)}%` as any,
                backgroundColor: ['#f32c87', '#ffd640', '#7fcaa1', '#9b7bd2', '#f69c57'][i % 5],
                transform: [{ rotate: `${(i * 47) % 360}deg` }],
              },
            ]}
          />
        ))}

        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <View style={[styles.iconOrb, { backgroundColor: bgColor }]}>
            <Icon name={celebration.iconName} size={36} color={iconColor} />
          </View>

          <Text style={styles.eyebrow}>{celebration.reward}</Text>
          <Text style={styles.title}>{celebration.title}</Text>
          <Text style={styles.detail}>{celebration.detail}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Keep the good energy</Text>
            <Icon name="sparkles" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41,16,76,0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 14,
    borderRadius: 3,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 28,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    shadowColor: '#dca8cf',
    shadowOpacity: 0.6,
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
  iconOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.purple,
    marginBottom: 16,
    shadowColor: COLORS.yellow,
    shadowOpacity: 0.4,
    shadowOffset: { width: 4, height: 5 },
    elevation: 5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.purple,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 19,
    maxWidth: 260,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    shadowColor: '#bf256b',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
