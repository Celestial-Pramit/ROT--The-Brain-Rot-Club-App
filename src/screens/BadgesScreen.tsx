import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { Badge } from '../constants/types';
import Icon from '../components/Icon';

const badgeColorMap: Record<string, { bg: string; iconColor: string; accent: string }> = {
  pink: { bg: '#ffdbea', iconColor: '#f32c87', accent: '#ffe2ee' },
  green: { bg: '#dff5e7', iconColor: '#3ba875', accent: '#dff5e7' },
  yellow: { bg: '#fff2ce', iconColor: '#dd9e21', accent: '#fff2ce' },
  blue: { bg: '#e1eafa', iconColor: '#4f78c8', accent: '#e1eafa' },
  purple: { bg: '#e6dbf8', iconColor: '#572b92', accent: '#e6dbf8' },
  orange: { bg: '#ffead6', iconColor: '#d97a28', accent: '#ffead6' },
};

type Props = {
  badges: Badge[];
};

export default function BadgesScreen({ badges }: Props) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.eyebrow}>THE ROT. TROPHY CABINET</Text>
      <Text style={styles.heading}>
        Collect your little wins<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        Special badges for choosing your brain, one mission at a time.
      </Text>

      {/* Badge counter */}
      <View style={styles.counterBadge}>
        <Icon name="trophy" size={18} color={COLORS.yellow} />
        <Text style={styles.counterValue}>
          {unlockedCount}/{badges.length}
        </Text>
        <Text style={styles.counterLabel}>badges unlocked</Text>
      </View>

      {/* Progress card */}
      <View style={styles.progressCard}>
        <View style={styles.progressIcon}>
          <Icon name="trophy" size={22} color={COLORS.purple} />
        </View>
        <View style={styles.progressCopy}>
          <Text style={styles.progressEyebrow}>YOUR COLLECTION</Text>
          <Text style={styles.progressTitle}>Every reset deserves a trophy.</Text>
          <Text style={styles.progressSub}>
            Complete today's missions to reveal the next shiny thing.
          </Text>
        </View>
        <View style={styles.meter}>
          <View style={styles.meterHeader}>
            <Text style={styles.meterValue}>
              {Math.round((unlockedCount / badges.length) * 100)}%
            </Text>
            <Text style={styles.meterLabel}>collected</Text>
          </View>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { width: `${(unlockedCount / badges.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Badge section heading */}
      <View style={styles.badgeSectionHead}>
        <Text style={styles.eyebrow}>YOUR BADGES</Text>
        <Text style={styles.badgeHint}>Tap a badge to celebrate it</Text>
      </View>

      {/* Badge grid (2 columns) */}
      <View style={styles.badgeGrid}>
        {badges.map((badge) => {
          const colorScheme = badgeColorMap[badge.color] || badgeColorMap.purple;
          return (
            <View
              key={badge.name}
              style={[
                styles.badgeCard,
                badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked,
              ]}
            >
              {/* Ribbon */}
              <View
                style={[
                  styles.ribbon,
                  { backgroundColor: badge.unlocked ? '#ffe2ee' : '#eee8f7' },
                ]}
              >
                <Icon
                  name={badge.unlocked ? 'trophy' : 'lock'}
                  size={11}
                  color={badge.unlocked ? '#c52a70' : '#a79aad'}
                />
                <Text
                  style={[
                    styles.ribbonText,
                    { color: badge.unlocked ? '#c52a70' : '#a79aad' },
                  ]}
                >
                  {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </Text>
              </View>

              {/* Orb */}
              <View
                style={[
                  styles.trophyOrb,
                  badge.unlocked && {
                    borderColor: colorScheme.iconColor,
                    shadowColor: 'rgba(87,43,146,0.12)',
                    shadowOpacity: 1,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 3,
                  },
                ]}
              >
                <Icon
                  name={badge.iconName}
                  size={28}
                  color={badge.unlocked ? colorScheme.iconColor : '#a99db4'}
                />
              </View>

              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>
                {badge.unlocked ? badge.description : badge.requirement}
              </Text>
              <Text style={styles.badgeFoot}>
                {badge.unlocked ? 'ROT. CLUB MEMBER' : 'KEEP GOING'}
              </Text>
            </View>
          );
        })}
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
  counterBadge: {
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
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.purple,
  },
  counterLabel: { fontSize: 10, color: COLORS.muted },
  progressCard: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.xl,
    padding: 22,
    marginBottom: 22,
    shadowColor: '#e6bbdb',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  progressIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-7deg' }],
    shadowColor: '#3c1b69',
    shadowOpacity: 0.5,
    shadowOffset: { width: 4, height: 4 },
    elevation: 4,
    marginBottom: 14,
  },
  progressCopy: { marginBottom: 14 },
  progressEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#f7d755',
  },
  progressTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  progressSub: { fontSize: 12, color: '#d8cde9', marginTop: 4 },
  meter: {},
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.yellow,
  },
  meterLabel: { fontSize: 10, color: '#d8cde9' },
  meterTrack: {
    height: 8,
    borderRadius: 10,
    backgroundColor: '#3c216c',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
  },
  badgeSectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeHint: { fontSize: 11, color: COLORS.muted },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47.5%' as any,
    minHeight: 210,
    padding: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    shadowColor: '#eaddec',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeUnlocked: {},
  badgeLocked: { opacity: 0.6 },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  ribbonText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  trophyOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eee8f2',
    borderWidth: 3,
    borderColor: '#d8cede',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    transform: [{ rotate: '-7deg' }],
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  badgeDesc: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
    minHeight: 28,
  },
  badgeFoot: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#b4a8bb',
    marginTop: 8,
  },
});
