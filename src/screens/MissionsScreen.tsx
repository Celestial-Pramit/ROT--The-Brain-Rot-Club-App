import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Mission } from '../constants/types';
import MissionRow from '../components/MissionRow';
import Icon from '../components/Icon';

type Props = {
  missions: Mission[];
  onMissionClick: (index: number) => void;
  earnedXp: number;
};

export default function MissionsScreen({ missions, onMissionClick, earnedXp }: Props) {
  const completedCount = missions.filter((m) => m.done).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.eyebrow}>THE DAILY DROP</Text>
      <Text style={styles.heading}>
        Small quests, real reset<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        No guilt. No leaderboard. Just a few ways to get back to yourself.
      </Text>

      {/* XP Badge */}
      <View style={styles.xpBadge}>
        <Icon name="trophy" size={18} color={COLORS.yellow} />
        <Text style={styles.xpValue}>{earnedXp} XP</Text>
        <Text style={styles.xpLabel}>earned today</Text>
      </View>

      {/* Quest Hero */}
      <View style={styles.heroCard}>
        <View style={styles.questOrb}>
          <Icon name="sparkles" size={32} color={COLORS.white} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>LEVEL 04 · SOFT LAUNCHER</Text>
          <Text style={styles.heroTitle}>Build your offline superpower.</Text>
          <Text style={styles.heroSub}>
            Finish two missions today to unlock a new brain badge.
          </Text>
        </View>
        <View style={styles.questProgress}>
          <Text style={styles.questCount}>{completedCount}/2</Text>
          <Text style={styles.questLabel}>missions</Text>
        </View>
      </View>

      {/* Mission list */}
      <View style={styles.missionList}>
        {missions.map((mission, index) => (
          <MissionRow
            key={mission.title}
            mission={mission}
            onPress={() => onMissionClick(index)}
          />
        ))}

        {/* Locked mission */}
        <View style={styles.lockedMission}>
          <View style={styles.lockIcon}>
            <Icon name="lock" size={16} color={COLORS.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>Unlock: The Grass Toucher</Text>
            <Text style={styles.lockSub}>
              Complete 2 missions to reveal your next badge
            </Text>
          </View>
          <Text style={styles.lockLabel}>LOCKED</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
    marginTop: 8,
    lineHeight: 34,
  },
  dot: { color: COLORS.pink },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    alignSelf: 'flex-start',
    marginBottom: 16,
    shadowColor: '#eadceb',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  xpValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.purple,
  },
  xpLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  heroCard: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.xl,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 22,
    shadowColor: '#e6bbdb',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  questOrb: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3c1b69',
    shadowOpacity: 0.5,
    shadowOffset: { width: 4, height: 4 },
    elevation: 4,
  },
  heroCopy: { flex: 1, minWidth: 150 },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#f7d755',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  heroSub: { fontSize: 12, color: '#d8cde9', marginTop: 4 },
  questProgress: { alignItems: 'center', paddingHorizontal: 12 },
  questCount: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.yellow,
  },
  questLabel: { fontSize: 10, color: '#d8cde9' },
  missionList: { gap: 11 },
  lockedMission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d8c8e4',
    borderRadius: RADIUS.md,
  },
  lockIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#f0e9f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  lockSub: { fontSize: 11, color: COLORS.muted, marginTop: 3 },
  lockLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.muted,
  },
});
