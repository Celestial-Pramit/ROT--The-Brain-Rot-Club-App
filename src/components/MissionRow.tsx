import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Mission } from '../constants/types';
import Icon from './Icon';

type Props = {
  mission: Mission;
  onPress: () => void;
};

export default function MissionRow({ mission, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, mission.done && styles.rowDone]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: mission.iconBg }]}>
        <Icon name={mission.iconName} size={18} color={mission.iconColor} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.detail}>{mission.detail}</Text>
      </View>
      {mission.done ? (
        <View style={styles.checkMark}>
          <Icon name="check" size={16} color={COLORS.green} />
        </View>
      ) : (
        <Text style={styles.reward}>+{mission.reward} XP</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#eee4f1',
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  rowDone: {
    backgroundColor: '#fcf8fd',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  detail: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },
  reward: {
    color: COLORS.pink,
    fontWeight: '700',
    fontSize: 11,
  },
  checkMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
