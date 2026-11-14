import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { DailyChest } from '../constants/types';
import Icon from './Icon';

type Props = {
  chest: DailyChest;
  onClaim: () => void;
};

export default function DailyChestCard({ chest, onClaim }: Props) {
  return (
    <View style={[styles.container, chest.claimed && styles.claimed]}>
      {/* Chest visual */}
      <View style={styles.visual}>
        <View style={styles.lid} />
        <View style={styles.body}>
          <Icon name="gift" size={22} color="#9c5c23" />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>DAILY REWARD</Text>
        <Text style={styles.heading}>
          {chest.claimed
            ? 'Come back tomorrow for another surprise.'
            : 'A little something for showing up.'}
        </Text>
        <Text style={styles.subtitle}>
          {chest.claimed
            ? `Today's reward: ${chest.item}`
            : 'Open your daily chest for bonus XP and a tiny cosmetic.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, chest.claimed && styles.buttonClaimed]}
        onPress={onClaim}
        disabled={chest.claimed}
        activeOpacity={0.8}
      >
        <Icon
          name={chest.claimed ? 'check' : 'gift'}
          size={14}
          color={chest.claimed ? '#5c9877' : COLORS.purple}
        />
        <Text style={[styles.buttonText, chest.claimed && styles.buttonTextClaimed]}>
          {chest.claimed ? 'Claimed today' : 'Open chest'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0d9a6',
    borderRadius: RADIUS.xl,
    backgroundColor: '#fff4d8',
    shadowColor: '#f3dfb8',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginTop: 16,
  },
  claimed: {
    backgroundColor: '#f7f2f3',
    borderColor: '#e8dfe5',
    opacity: 0.85,
  },
  visual: {
    width: 52,
    height: 48,
    position: 'relative',
  },
  lid: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 52,
    height: 16,
    backgroundColor: COLORS.chestYellow,
    borderWidth: 3,
    borderColor: COLORS.chestBrown,
    borderRadius: 8,
    transform: [{ rotate: '-5deg' }],
    zIndex: 1,
  },
  body: {
    position: 'absolute',
    left: 4,
    bottom: 0,
    width: 44,
    height: 30,
    backgroundColor: COLORS.chestGold,
    borderWidth: 3,
    borderColor: COLORS.chestBrown,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 150,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.pink,
    fontWeight: '700',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    shadowColor: '#dfa82f',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  buttonClaimed: {
    backgroundColor: '#dff4e6',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  buttonTextClaimed: {
    color: '#5c9877',
  },
});
