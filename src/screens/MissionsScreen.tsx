import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import {
  Mission,
  WeeklyQuestId,
  WeeklyQuestState,
  XpLedgerEntry,
} from '../constants/types';
import MissionRow from '../components/MissionRow';
import Icon from '../components/Icon';
import { calculatePlayerLevel } from '../utils/domainLogic';

type Props = {
  missions: Mission[];
  onMissionClick: (index: number) => void;
  earnedXp: number;
  totalXp: number;
  weeklyQuestState: WeeklyQuestState;
  onClaimWeeklyQuest: (questId: WeeklyQuestId) => void;
  xpLedger: XpLedgerEntry[];
  ledgerConsistent: boolean;
  scrollToLedgerRequestId?: number;
};

export default function MissionsScreen({
  missions,
  onMissionClick,
  earnedXp,
  totalXp,
  weeklyQuestState,
  onClaimWeeklyQuest,
  xpLedger,
  ledgerConsistent,
  scrollToLedgerRequestId = 0,
}: Props) {
  const completedCount = missions.filter((m) => m.done).length;
  const grassUnlocked = completedCount >= 2;
  const playerLevel = calculatePlayerLevel(totalXp);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const ledgerYRef = useRef<number | null>(null);
  const pendingScrollRef = useRef(false);

  useEffect(() => {
    if (scrollToLedgerRequestId <= 0) return;
    if (ledgerYRef.current !== null) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, ledgerYRef.current - 10),
        animated: true,
      });
      pendingScrollRef.current = false;
    } else {
      pendingScrollRef.current = true;
    }
  }, [scrollToLedgerRequestId]);

  return (
    <ScrollView
      ref={scrollViewRef}
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
        No guilt. No leaderboard pressure. Just a few ways to get back to yourself.
      </Text>

      {/* XP Badge */}
      <View style={styles.xpBadge}>
        <Icon name="trophy" size={18} color={COLORS.yellow} />
        <Text style={styles.xpValue}>{earnedXp} XP</Text>
        <Text style={styles.xpLabel}>earned today · {totalXp} total XP</Text>
      </View>

      {/* Quest Hero */}
      <View style={styles.heroCard}>
        <View style={styles.questOrb}>
          <Icon name="sparkles" size={32} color={COLORS.white} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>
            LEVEL {String(playerLevel.level).padStart(2, '0')} · {playerLevel.title.toUpperCase()}
          </Text>
          <Text style={styles.heroTitle}>Build your offline superpower.</Text>
          <Text style={styles.heroSub}>
            Finish two missions today to unlock the Grass Toucher brain badge.
          </Text>
        </View>
        <View style={styles.questProgress}>
          <Text style={styles.questCount}>
            {completedCount}/{missions.length}
          </Text>
          <Text style={styles.questLabel}>missions</Text>
        </View>
      </View>

      {/* Mission list */}
      <View style={styles.missionList}>
        {missions.map((mission, index) => (
          <MissionRow
            key={mission.id}
            mission={mission}
            onPress={() => onMissionClick(index)}
          />
        ))}

        {/* Milestone badge status */}
        <View
          style={[
            styles.lockedMission,
            grassUnlocked && styles.unlockedMilestone,
          ]}
        >
          <View
            style={[
              styles.lockIcon,
              grassUnlocked && { backgroundColor: COLORS.paleGreen },
            ]}
          >
            <Icon
              name={grassUnlocked ? 'check' : 'lock'}
              size={16}
              color={grassUnlocked ? COLORS.green : COLORS.muted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>
              {grassUnlocked
                ? 'Unlocked: The Grass Toucher'
                : 'Unlock: The Grass Toucher'}
            </Text>
            <Text style={styles.lockSub}>
              {grassUnlocked
                ? 'You completed 2+ missions today. Check the Badges tab!'
                : 'Complete 2 missions to reveal your next badge'}
            </Text>
          </View>
          <Text
            style={[
              styles.lockLabel,
              grassUnlocked && { color: COLORS.green },
            ]}
          >
            {grassUnlocked ? 'UNLOCKED' : 'LOCKED'}
          </Text>
        </View>
      </View>

      {/* Weekly Quests Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>WEEKLY CHALLENGES</Text>
          <Text style={styles.sectionTitle}>Weekly quests</Text>
        </View>
        <View style={styles.weekKeyPill}>
          <Icon name="calendar" size={11} color={COLORS.purple} />
          <Text style={styles.weekKeyText}>
            {weeklyQuestState.weekKey.replace('week-', 'Week of ')}
          </Text>
        </View>
      </View>

      <View style={styles.weeklyList}>
        {weeklyQuestState.quests.map((quest) => {
          const pct = Math.min(
            100,
            Math.round((quest.progress / Math.max(1, quest.target)) * 100)
          );
          return (
            <View key={quest.id} style={styles.weeklyCard}>
              <View style={styles.weeklyTopRow}>
                <View style={styles.weeklyIconWrap}>
                  <Icon name={quest.iconName} size={16} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weeklyTitle}>{quest.title}</Text>
                  <Text style={styles.weeklyDetail}>{quest.detail}</Text>
                </View>
                {quest.claimed ? (
                  <View style={styles.claimedPill}>
                    <Icon name="check" size={12} color="#2d9364" />
                    <Text style={styles.claimedPillText}>CLAIMED</Text>
                  </View>
                ) : quest.completed ? (
                  <TouchableOpacity
                    style={styles.claimQuestBtn}
                    onPress={() => onClaimWeeklyQuest(quest.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.claimQuestBtnText}>
                      Claim +{quest.rewardXp} XP
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.weeklyReward}>+{quest.rewardXp} XP</Text>
                )}
              </View>
              <View style={styles.weeklyProgressRow}>
                <View style={styles.weeklyTrack}>
                  <View
                    style={[
                      styles.weeklyFill,
                      { width: `${pct}%` as any },
                      quest.completed && { backgroundColor: COLORS.green },
                    ]}
                  />
                </View>
                <Text style={styles.weeklyCountText}>
                  {quest.progress}/{quest.target}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* XP Ledger Section */}
      <View
        style={styles.sectionHeader}
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          ledgerYRef.current = y;
          if (pendingScrollRef.current) {
            pendingScrollRef.current = false;
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 10),
              animated: true,
            });
          }
        }}
      >
        <View>
          <Text style={styles.eyebrow}>TRANSACTION HISTORY</Text>
          <Text style={styles.sectionTitle}>Brain Bank XP Ledger</Text>
        </View>
        <View
          style={[
            styles.ledgerBadge,
            !ledgerConsistent && { backgroundColor: '#fff1d8' },
          ]}
        >
          <Icon
            name="shield-check"
            size={11}
            color={ledgerConsistent ? '#2d9364' : COLORS.orange}
          />
          <Text
            style={[
              styles.ledgerBadgeText,
              !ledgerConsistent && { color: COLORS.orange },
            ]}
          >
            {ledgerConsistent ? `Verified · ${totalXp} XP` : `${totalXp} XP`}
          </Text>
        </View>
      </View>

      <View style={styles.ledgerCard}>
        {xpLedger.slice(0, 10).map((entry, idx) => (
          <View
            key={entry.id}
            style={[
              styles.ledgerRow,
              idx === Math.min(xpLedger.length, 10) - 1 && {
                borderBottomWidth: 0,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.ledgerTitle}>{entry.title}</Text>
              <Text style={styles.ledgerMeta}>
                {entry.category.replace('_', ' ').toUpperCase()} · {entry.dateKey}
              </Text>
            </View>
            <Text style={styles.ledgerAmount}>+{entry.amount} XP</Text>
          </View>
        ))}
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
  unlockedMilestone: {
    borderStyle: 'solid',
    borderColor: '#b9e4cb',
    backgroundColor: '#f7fdf9',
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

  // Weekly Quests
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  weekKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#f1eaf9',
  },
  weekKeyText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  weeklyList: {
    gap: 11,
  },
  weeklyCard: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    gap: 10,
  },
  weeklyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  weeklyDetail: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  weeklyReward: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.pink,
  },
  claimQuestBtn: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: COLORS.pink,
  },
  claimQuestBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#e4f8ee',
  },
  claimedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2d9364',
  },
  weeklyProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weeklyTrack: {
    flex: 1,
    height: 7,
    borderRadius: 7,
    backgroundColor: '#f1eaf9',
    overflow: 'hidden',
  },
  weeklyFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: COLORS.purple,
  },
  weeklyCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },

  // XP Ledger
  ledgerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#e4f8ee',
  },
  ledgerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2d9364',
  },
  ledgerCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2ebf4',
    gap: 10,
  },
  ledgerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  ledgerMeta: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
  },
});
