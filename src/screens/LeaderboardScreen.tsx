import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { LeaderboardTab } from '../constants/types';
import { rankings } from '../constants/data';
import Icon from '../components/Icon';

type Props = {
  displayName: string;
  userHandle: string;
  userInitials: string;
  totalXp: number;
  earnedTodayXp: number;
  onToast: (message: string) => void;
};

export default function LeaderboardScreen({
  displayName,
  userHandle,
  userInitials,
  totalXp,
  earnedTodayXp,
  onToast,
}: Props) {
  const [tab, setTab] = useState<LeaderboardTab>('Friends');
  const rows = rankings[tab]
    .map((r) =>
      r.current
        ? {
            ...r,
            name: displayName,
            handle: tab === 'Campus' ? r.handle : userHandle,
            initials: userInitials,
            xp: totalXp,
            change: `+${earnedTodayXp} XP`,
          }
        : r
    )
    .sort((a, b) => b.xp - a.xp);
  const currentRank = rows.findIndex((r) => r.current) + 1;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.eyebrow}>FRIENDLY COMPETITION</Text>
      <Text style={styles.heading}>
        Climb gently, together<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        A little XP, a lot of encouragement. No shame-based rankings here.
      </Text>

      {/* Rank summary */}
      <View style={styles.rankSummary}>
        <View style={styles.rankIcon}>
          <Icon name="trophy" size={17} color={COLORS.purple} />
        </View>
        <View>
          <Text style={styles.rankValue}>#{currentRank}</Text>
          <Text style={styles.rankLabel}>your spot today</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['Friends', 'Squad', 'Campus'] as LeaderboardTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* League Card */}
      <View style={styles.leagueCard}>
        <Text style={styles.leagueEyebrow}>CURRENT LEAGUE · WEEK 03</Text>
        <Text style={styles.leagueTitle}>Gold-ish league</Text>
        <Text style={styles.leagueSub}>
          Keep making healthy choices to stay in the sunny zone. The top three move up next
          Monday.
        </Text>

        <View style={styles.leagueRange}>
          <Text style={styles.rangeLabel}>{totalXp} XP</Text>
          <View style={styles.rangeTrack}>
            <View
              style={[
                styles.rangeFill,
                { width: `${Math.min(100, Math.round((totalXp / 450) * 100))}%` as any },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>450 XP</Text>
        </View>

        <View style={styles.tierBadge}>
          <View style={styles.tierIcon}>
            <Icon name="crown" size={26} color={COLORS.purple} />
          </View>
          <Text style={styles.tierName}>GOLD-ISH</Text>
          <Text style={styles.tierRank}>
            Rank {currentRank} of {rows.length}
          </Text>
        </View>
      </View>

      {/* League Rules */}
      <View style={styles.rulesCard}>
        <Text style={styles.eyebrow}>THE LEAGUE LADDER</Text>
        <Text style={styles.rulesTitle}>Where XP can take you</Text>
        <Text style={styles.rulesSub}>
          Earn XP from missions and breaks. League movement is a celebration, not a judgment.
        </Text>
        <View style={styles.tierSteps}>
          {[
            { num: '1', text: 'Fresh start', current: false },
            { num: '2', text: 'Gold-ish · you are here', current: true },
            { num: '3', text: 'Brainy platinum', current: false },
            { num: '4', text: 'Legendary offline', current: false },
          ].map((step) => (
            <View key={step.num} style={styles.tierStep}>
              <View
                style={[
                  styles.stepNum,
                  step.current && { backgroundColor: COLORS.pink },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumText,
                    step.current && { color: COLORS.white },
                  ]}
                >
                  {step.num}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  step.current && { color: COLORS.purple, fontWeight: '700' },
                ]}
              >
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rankings */}
      <View style={styles.rankingHeader}>
        <View>
          <Text style={styles.eyebrow}>{tab.toUpperCase()} RANKINGS</Text>
          <Text style={styles.rankingTitle}>Who is making space today?</Text>
        </View>
        <Text style={styles.rankingMeta}>
          Resets Monday · {rows.length} members
        </Text>
      </View>

      <View style={styles.rankingList}>
        {rows.map((row, index) => (
          <View
            key={`${tab}-${row.name}-${row.handle}`}
            style={[styles.rankingRow, row.current && styles.rankingRowCurrent]}
          >
            <Text
              style={[
                styles.rankNum,
                index === 0 && { color: '#d7981f' },
                index === 1 && { color: '#8c83a4' },
                index === 2 && { color: '#b9784e' },
              ]}
            >
              {index + 1}
            </Text>
            <View
              style={[
                styles.rankAvatar,
                index === 1 && { backgroundColor: '#ffe0ed' },
                index === 2 && { backgroundColor: '#fff0d1' },
              ]}
            >
              <Text
                style={[
                  styles.rankAvatarText,
                  index === 1 && { color: COLORS.pink },
                  index === 2 && { color: '#b8791b' },
                ]}
              >
                {row.initials}
              </Text>
            </View>
            <View style={styles.rankCopy}>
              <Text style={styles.rankName}>
                {row.name}
                {row.current && ' · That is you'}
              </Text>
              <Text style={styles.rankHandle}>{row.handle}</Text>
            </View>
            <View style={styles.rankXpWrap}>
              <Icon name="zap" size={12} color={COLORS.pink} />
              <Text style={styles.rankXp}>{row.xp}</Text>
              <Text style={styles.rankChange}>XP · {row.change}</Text>
            </View>
            <TouchableOpacity
              style={styles.rankAction}
              onPress={() =>
                onToast(
                  row.current
                    ? 'Keep going. Your future offline self is cheering.'
                    : `Sent ${row.name} a friendly high-five.`
                )
              }
            >
              <Text style={styles.rankActionText}>
                {row.current ? 'Streak' : 'High-five'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.lbFooter}>
        <Icon name="shield-check" size={14} color="#44a878" />
        <Text style={styles.lbFooterText}>
          Only XP is shown. Everyone gets to keep the rest of their day private.
        </Text>
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
  rankSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    alignSelf: 'flex-start',
    marginBottom: 18,
    shadowColor: '#eadceb',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rankIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankValue: { fontSize: 19, fontWeight: '700', color: COLORS.purple },
  rankLabel: { fontSize: 10, color: COLORS.muted, marginTop: 1 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: COLORS.paleLavender,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#e1d5eb',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  tabTextActive: { color: COLORS.purple },

  // League
  leagueCard: {
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.xl,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#e6bbdb',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  leagueEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#f7d755',
  },
  leagueTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  leagueSub: {
    fontSize: 12,
    color: '#d8cde9',
    marginTop: 6,
    lineHeight: 18,
  },
  leagueRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  rangeLabel: { fontSize: 10, color: '#d8cde9' },
  rangeTrack: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#3d216d',
    overflow: 'hidden',
  },
  rangeFill: {
    width: '64%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: COLORS.pink,
  },
  tierBadge: { alignItems: 'center', marginTop: 18 },
  tierIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.yellow,
    borderWidth: 3,
    borderColor: '#f8e9a1',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '8deg' }],
    shadowColor: '#35175e',
    shadowOpacity: 0.5,
    shadowOffset: { width: 4, height: 5 },
    elevation: 4,
  },
  tierName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.yellow,
    marginTop: 8,
  },
  tierRank: { fontSize: 9, color: '#d8cde9', marginTop: 2 },

  // Rules
  rulesCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  rulesSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  tierSteps: { gap: 8 },
  tierStep: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: { fontSize: 11, fontWeight: '700', color: COLORS.purple },
  stepText: { fontSize: 10, color: COLORS.muted },

  // Rankings
  rankingHeader: {
    marginBottom: 14,
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  rankingMeta: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  rankingList: { gap: 10 },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#eee4f1',
    shadowColor: '#eee5f0',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rankingRowCurrent: {
    borderWidth: 2,
    borderColor: COLORS.pink,
    backgroundColor: '#fff2f7',
    shadowColor: '#f5bed6',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
  },
  rankNum: {
    width: 20,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textAlign: 'center',
  },
  rankAvatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: '#e8dcfb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankAvatarText: { fontWeight: '700', color: COLORS.purple, fontSize: 13 },
  rankCopy: { flex: 1 },
  rankName: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  rankHandle: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  rankXpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rankXp: { fontSize: 12, fontWeight: '700', color: COLORS.pink },
  rankChange: { fontSize: 9, color: COLORS.muted },
  rankAction: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lavender,
  },
  rankActionText: { fontSize: 10, fontWeight: '700', color: COLORS.purple },

  // Footer
  lbFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  lbFooterText: { fontSize: 10, color: COLORS.muted, flex: 1 },
});
