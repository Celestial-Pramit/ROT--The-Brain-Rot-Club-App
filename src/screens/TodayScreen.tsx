import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Mission, DailyChest } from '../constants/types';
import MissionRow from '../components/MissionRow';
import DailyChestCard from '../components/DailyChestCard';
import Icon from '../components/Icon';

type Props = {
  completedMissions: number;
  earnedXp: number;
  missions: Mission[];
  onMissionClick: (index: number) => void;
  onBreak: () => void;
  onViewMissions: () => void;
  chest: DailyChest;
  onClaimChest: () => void;
};

export default function TodayScreen({
  completedMissions,
  earnedXp,
  missions,
  onMissionClick,
  onBreak,
  onViewMissions,
  chest,
  onClaimChest,
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <Text style={styles.eyebrow}>TUESDAY, NOVEMBER 11</Text>
        <Text style={styles.heading}>
          Good morning, Rafi<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Your scroll has a personality. Today, it is choosing balance.
        </Text>
      </View>

      {/* Mood Badge */}
      <View style={styles.moodBadge}>
        <View style={styles.moodFace}>
          <Text style={styles.moodEmoji}>◡</Text>
        </View>
        <View>
          <Text style={styles.moodLabel}>Brain mood</Text>
          <Text style={styles.moodValue}>Chill but curious</Text>
        </View>
      </View>

      {/* Usage Card */}
      <View style={styles.usageCard}>
        <View style={styles.usageTop}>
          <Text style={styles.eyebrowLight}>TODAY'S ESTIMATE</Text>
          <View style={styles.statusDot}>
            <View style={styles.greenDot} />
            <Text style={styles.statusText}>Fresh 12 min ago</Text>
          </View>
        </View>
        <View style={styles.usageMain}>
          <View>
            <Text style={styles.usageNumber}>
              1<Text style={styles.usageUnit}>h</Text> 24
              <Text style={styles.usageUnit}>m</Text>
            </Text>
            <Text style={styles.usageLabel}>on Instagram Reels</Text>
          </View>
          {/* Brain mascot */}
          <View style={styles.mascot}>
            <View style={styles.eyeLeft} />
            <View style={styles.eyeRight} />
            <View style={styles.mouth} />
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '70%' }]} />
        </View>
        <View style={styles.usageFooter}>
          <Text style={styles.footerText}>
            Daily limit <Text style={styles.footerBold}>2h 00m</Text>
          </Text>
          <Text style={styles.footerRemaining}>36 min left</Text>
        </View>
      </View>

      {/* Brainrot Index */}
      <View style={styles.indexCard}>
        <View style={styles.indexTop}>
          <Text style={styles.eyebrow}>BRAINROT INDEX</Text>
          <View style={styles.trendBadge}>
            <Icon name="bar-chart" size={14} color={COLORS.green} />
            <Text style={styles.trendText}>-12%</Text>
          </View>
        </View>
        <Text style={styles.indexScore}>
          68<Text style={styles.indexMax}>/100</Text>
        </Text>
        <Text style={styles.indexLabel}>Your brain is in the green-ish zone.</Text>
        <View style={styles.scaleRow}>
          {['#dfd2f0', '#c1a5ea', '#ffd640', '#f58ab6', '#f32c87'].map((color, i) => (
            <View key={i} style={[styles.scaleBar, { backgroundColor: color }]} />
          ))}
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleText}>More scroll</Text>
          <Text style={styles.scaleText}>More soul</Text>
        </View>
      </View>

      {/* Daily Chest */}
      <DailyChestCard chest={chest} onClaim={onClaimChest} />

      {/* Today's Missions */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>A LITTLE GOES A LONG WAY</Text>
          <Text style={styles.sectionTitle}>Today's missions</Text>
        </View>
        <TouchableOpacity onPress={onViewMissions} style={styles.viewAll}>
          <Text style={styles.viewAllText}>View all</Text>
          <Icon name="chevron-right" size={14} color={COLORS.purple} />
        </TouchableOpacity>
      </View>
      <View style={styles.missionList}>
        {missions.map((mission, index) => (
          <MissionRow key={mission.title} mission={mission} onPress={() => onMissionClick(index)} />
        ))}
      </View>

      {/* Habit Chart */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.sectionTitle}>Healthy habits</Text>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>2h</Text>
          <Text style={styles.chartLabel}>1h</Text>
          <Text style={styles.chartLabel}>0</Text>
        </View>
        <View style={styles.chartBars}>
          {[42, 66, 51, 78, 60, 38, 70].map((h, i) => (
            <View key={i} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: `${h}%` as any },
                  i === 1 || i === 3 ? styles.barPink : null,
                  i === 6 ? styles.barToday : null,
                ]}
              />
              <Text style={[styles.barLabel, i === 6 && styles.barLabelToday]}>
                {['W', 'T', 'F', 'S', 'S', 'M', 'T'][i]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Callout */}
      <View style={styles.callout}>
        <View style={styles.calloutIcon}>
          <Icon name="leaf" size={16} color="#49a878" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.calloutBold}>You've saved 43 min</Text>
          <Text style={styles.calloutSub}>compared with last Tuesday</Text>
        </View>
        <Text style={styles.sparkle}>✦</Text>
      </View>

      {/* Focus Break */}
      <TouchableOpacity style={styles.breakCard} onPress={onBreak} activeOpacity={0.7}>
        <View style={styles.breakIcon}>
          <Icon name="clock" size={18} color={COLORS.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.breakTitle}>Take a focus break</Text>
          <Text style={styles.breakSub}>10 minutes offline · +30 XP</Text>
        </View>
        <Icon name="chevron-right" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      {/* Privacy Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Icon name="shield-check" size={18} color="#43a879" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerBold}>Private by default.</Text>
          <Text style={styles.bannerSub}>
            Your estimates stay yours. ROT never asks for your Instagram login.
          </Text>
        </View>
      </View>

      {/* Earned Note */}
      <View style={styles.earnedNote}>
        <Icon name="sparkles" size={14} color={COLORS.pink} />
        <Text style={styles.earnedText}>
          {earnedXp > 0
            ? `You have earned ${earnedXp} XP from missions today.`
            : 'Complete a mission to grow your brain bank.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },
  welcomeRow: { marginBottom: 14 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  eyebrowLight: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#f7d755',
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
    marginTop: 8,
    lineHeight: 36,
  },
  dot: { color: COLORS.pink },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    shadowColor: '#eadceb',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  moodFace: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8dcfb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.purple,
  },
  moodLabel: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  moodValue: { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  // Usage Card
  usageCard: {
    padding: 22,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.purple,
    marginBottom: 14,
    shadowColor: 'rgba(81,44,138,0.13)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  usageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7ae7a7' },
  statusText: { fontSize: 10, color: '#d9c9ed' },
  usageMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
    zIndex: 1,
  },
  usageNumber: {
    fontSize: 50,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -3,
  },
  usageUnit: { fontSize: 22, color: '#cbbce4', letterSpacing: -0.5 },
  usageLabel: { fontSize: 13, color: '#d6cbea', marginTop: 4 },
  mascot: {
    width: 90,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.pink,
    borderWidth: 3,
    borderColor: COLORS.darkPurple,
    position: 'relative',
    transform: [{ rotate: '7deg' }],
    shadowColor: '#f56da9',
    shadowOpacity: 0.5,
    shadowOffset: { width: 4, height: 5 },
    elevation: 4,
  },
  eyeLeft: {
    position: 'absolute',
    top: 32,
    left: 18,
    width: 15,
    height: 10,
    borderTopWidth: 3,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 8,
  },
  eyeRight: {
    position: 'absolute',
    top: 32,
    right: 18,
    width: 15,
    height: 10,
    borderTopWidth: 3,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 8,
  },
  mouth: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    width: 18,
    height: 9,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.darkPurple,
    borderRadius: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#3d216d',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
  },
  usageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    zIndex: 1,
  },
  footerText: { fontSize: 11, color: '#cdbfe1' },
  footerBold: { color: COLORS.white, fontWeight: '700' },
  footerRemaining: { fontSize: 11, color: '#f7d755', fontWeight: '700' },

  // Index Card
  indexCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    padding: 22,
    borderWidth: 1,
    borderColor: '#eee1ef',
    marginBottom: 2,
    shadowColor: 'rgba(81,44,138,0.06)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  indexTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 11, color: COLORS.green, fontWeight: '700' },
  indexScore: {
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.purple,
    letterSpacing: -3,
    marginTop: 16,
  },
  indexMax: { fontSize: 22, color: COLORS.muted, letterSpacing: -0.5 },
  indexLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 18 },
  scaleRow: { flexDirection: 'row', gap: 4 },
  scaleBar: { flex: 1, height: 9, borderRadius: 4 },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scaleText: { fontSize: 10, color: COLORS.muted },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAllText: { fontSize: 11, fontWeight: '700', color: COLORS.purple },
  missionList: { gap: 10 },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    marginTop: 4,
  },
  chartLabels: {
    justifyContent: 'space-between',
    height: 90,
    paddingRight: 8,
  },
  chartLabel: { fontSize: 9, color: '#b3a7bc' },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#e9e0ed',
    height: 100,
  },
  barWrap: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 16,
    minHeight: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#dac9ee',
  },
  barPink: { backgroundColor: '#f7b7cf' },
  barToday: {
    backgroundColor: COLORS.pink,
    shadowColor: '#fce4ee',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
  },
  barLabel: { fontSize: 9, color: '#aca0b7' },
  barLabelToday: { color: COLORS.pink, fontWeight: '700' },

  // Callout
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#f1edfb',
    borderRadius: RADIUS.md,
  },
  calloutIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#d9f2e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutBold: { fontSize: 11, fontWeight: '700', color: COLORS.ink },
  calloutSub: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  sparkle: { color: COLORS.pink, fontSize: 14, position: 'absolute', right: 12, top: 10 },

  // Break
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  breakIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e9dcfb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakTitle: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  breakSub: { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    marginTop: 30,
    paddingVertical: 16,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#e2f6e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBold: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  bannerSub: { fontSize: 11, color: COLORS.muted, marginTop: 2, lineHeight: 16 },

  // Earned
  earnedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    justifyContent: 'center',
  },
  earnedText: { fontSize: 11, color: COLORS.muted },
});
