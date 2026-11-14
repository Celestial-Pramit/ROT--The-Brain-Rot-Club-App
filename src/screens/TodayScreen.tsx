import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { DailyChest, InstagramUsageSummary, Mission } from '../constants/types';
import {
  BrainrotIndexSummary,
  formatMinutesAsHoursAndMinutes,
  formatReadableDateHeader,
  getGreetingForHour,
  LimitProgressSummary,
  MAX_DISPLAY_NAME_LENGTH,
  UsageDisplayState,
} from '../utils/domainLogic';
import MissionRow from '../components/MissionRow';
import DailyChestCard from '../components/DailyChestCard';
import Icon from '../components/Icon';

type Props = {
  displayName: string;
  customDisplayName: string | null;
  deviceDefaultName: string | null;
  onSaveDisplayName: (rawName: string | null) => void;
  completedMissions: number;
  earnedXp: number;
  missions: Mission[];
  onMissionClick: (index: number) => void;
  onBreak: () => void;
  onViewMissions: () => void;
  onOpenSettings: () => void;
  chest: DailyChest;
  onClaimChest: () => void;
  usageSummary: InstagramUsageSummary | null;
  usageDisplay: UsageDisplayState;
  limitProgress: LimitProgressSummary;
  brainrotIndex: BrainrotIndexSummary;
  effectiveLimitMinutes: number;
  showGentleNudge: boolean;
  onUsageAction: () => void;
  onRefreshUsage: () => void;
};

export default function TodayScreen({
  displayName,
  customDisplayName,
  deviceDefaultName,
  onSaveDisplayName,
  earnedXp,
  missions,
  onMissionClick,
  onBreak,
  onViewMissions,
  onOpenSettings,
  chest,
  onClaimChest,
  usageSummary,
  usageDisplay,
  limitProgress,
  brainrotIndex,
  effectiveLimitMinutes,
  showGentleNudge,
  onUsageAction,
  onRefreshUsage,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(customDisplayName ?? displayName);

  useEffect(() => {
    if (!editingName) {
      setDraftName(customDisplayName ?? displayName);
    }
  }, [customDisplayName, displayName, editingName]);

  const dateHeader = formatReadableDateHeader();
  const greeting = getGreetingForHour();

  const breakdown = usageSummary?.dailyBreakdown ?? [];
  const hasRealBreakdown =
    (usageDisplay.hasVerifiedEstimate || usageDisplay.isShowingCachedFallback) &&
    breakdown.length > 0;
  const maxChartMinutes = Math.max(120, effectiveLimitMinutes);
  const topAxisLabel = formatMinutesAsHoursAndMinutes(maxChartMinutes).compact;
  const midAxisLabel = formatMinutesAsHoursAndMinutes(Math.round(maxChartMinutes / 2)).compact;

  const chartDays = hasRealBreakdown
    ? breakdown.slice(-7).map((pt, idx, arr) => {
        const mins = Math.round(pt.foregroundMs / 60000);
        const pct =
          mins === 0
            ? 8
            : Math.max(12, Math.min(100, Math.round((mins / maxChartMinutes) * 100)));
        return {
          key: `${pt.date}-${idx}`,
          heightPct: pct,
          label: pt.dayLabel || 'D',
          isToday: idx === arr.length - 1,
          isOver: mins > effectiveLimitMinutes,
          minutes: mins,
        };
      })
    : ['W', 'T', 'F', 'S', 'S', 'M', 'T'].map((d, i) => ({
        key: `placeholder-${i}`,
        heightPct: 12,
        label: d,
        isToday: i === 6,
        isOver: false,
        minutes: null,
      }));

  const showNumericEstimate =
    (usageDisplay.hasVerifiedEstimate || usageDisplay.isShowingCachedFallback) &&
    usageDisplay.hours !== null &&
    usageDisplay.minutes !== null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <Text style={styles.eyebrow}>{dateHeader}</Text>
        <View style={styles.greetingRow}>
          <Text style={styles.heading}>
            {greeting}, {displayName}
            <Text style={styles.dot}>.</Text>
          </Text>
          <TouchableOpacity
            style={styles.editNameChip}
            onPress={() => {
              setDraftName(customDisplayName ?? displayName);
              setEditingName((prev) => !prev);
            }}
            activeOpacity={0.75}
            accessibilityLabel="Edit display name"
          >
            <Icon name="edit" size={12} color={COLORS.purple} />
            <Text style={styles.editNameChipText}>
              {editingName ? 'Close' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {editingName && (
          <View style={styles.nameEditorCard}>
            <Text style={styles.nameEditorTitle}>Display name</Text>
            <Text style={styles.nameEditorHint}>
              Saved on this device only (max {MAX_DISPLAY_NAME_LENGTH} characters). Leave blank or reset to use device name ({deviceDefaultName || 'ROT User'}).
            </Text>
            <View style={styles.nameInputRow}>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={setDraftName}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                placeholder={deviceDefaultName || 'ROT User'}
                placeholderTextColor="#a395b2"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => {
                  onSaveDisplayName(draftName);
                  setEditingName(false);
                }}
              />
              {draftName.length > 0 && (
                <TouchableOpacity
                  style={styles.nameClearBtn}
                  onPress={() => setDraftName('')}
                  activeOpacity={0.75}
                  accessibilityLabel="Clear display name input"
                >
                  <Icon name="x" size={13} color={COLORS.muted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.nameSaveBtn}
                onPress={() => {
                  onSaveDisplayName(draftName);
                  setEditingName(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.nameSaveBtnText}>Save</Text>
              </TouchableOpacity>
              {customDisplayName && (
                <TouchableOpacity
                  style={styles.nameResetBtn}
                  onPress={() => {
                    onSaveDisplayName(null);
                    setEditingName(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nameResetBtnText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <Text style={styles.subtitle}>
          Your scroll has a personality. Today, it is choosing balance.
        </Text>
      </View>

      {/* Mood Badge */}
      <View style={styles.moodBadge}>
        <View style={styles.moodFace}>
          <Text style={styles.moodEmoji}>{brainrotIndex.moodEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.moodLabel}>Brain mood</Text>
          <Text style={styles.moodValue}>{brainrotIndex.moodValue}</Text>
        </View>
      </View>

      {/* Usage Card */}
      <View style={styles.usageCard}>
        <View style={styles.usageTop}>
          <Text style={styles.eyebrowLight}>TODAY'S ESTIMATE</Text>
          <TouchableOpacity
            style={styles.statusDot}
            onPress={onRefreshUsage}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.greenDot,
                { backgroundColor: usageDisplay.badgeDotColor },
              ]}
            />
            <Text style={styles.statusText}>{usageDisplay.freshnessText}</Text>
            <Icon name="refresh" size={11} color="#d9c9ed" />
          </TouchableOpacity>
        </View>

        <View style={styles.usageMain}>
          <View style={styles.usageCopyCol}>
            {showNumericEstimate ? (
              <Text style={styles.usageNumber}>
                {usageDisplay.hours}
                <Text style={styles.usageUnit}>h</Text>{' '}
                {String(usageDisplay.minutes ?? 0).padStart(2, '0')}
                <Text style={styles.usageUnit}>m</Text>
              </Text>
            ) : (
              <Text style={styles.usageStatusHeadline}>
                {usageDisplay.headlineText}
              </Text>
            )}
            <Text style={styles.usageLabel}>{usageDisplay.subtitleText}</Text>

            {usageDisplay.staleOrIncompleteWarning && (
              <View style={styles.warningPill}>
                <Icon name="alert-circle" size={11} color={COLORS.yellow} />
                <Text style={styles.warningPillText}>
                  {usageDisplay.staleOrIncompleteWarning}
                </Text>
              </View>
            )}

            {usageDisplay.hasVerifiedEstimate && (
              <View style={styles.sourcePill}>
                <Icon name="info" size={10} color="#f7d755" />
                <Text style={styles.sourcePillText}>
                  Android UsageStats ·{' '}
                  {usageSummary?.todaySessionCount
                    ? `${usageSummary.todaySessionCount} intervals today`
                    : 'App-level foreground time'}
                </Text>
              </View>
            )}
          </View>

          {/* Brain mascot */}
          <View style={styles.mascot}>
            <View style={styles.eyeLeft} />
            <View style={styles.eyeRight} />
            <View style={styles.mouth} />
          </View>
        </View>

        {!usageDisplay.hasVerifiedEstimate && usageDisplay.actionLabel && (
          <TouchableOpacity
            style={styles.usageActionBtn}
            onPress={onUsageAction}
            activeOpacity={0.85}
          >
            <Icon
              name={
                usageDisplay.actionKind === 'permission' ||
                usageDisplay.actionKind === 'consent'
                  ? 'shield-check'
                  : 'refresh'
              }
              size={14}
              color={COLORS.purple}
            />
            <Text style={styles.usageActionBtnText}>{usageDisplay.actionLabel}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${limitProgress.progressPercent}%` as any,
                backgroundColor: limitProgress.isOverLimit
                  ? COLORS.pink
                  : COLORS.yellow,
              },
            ]}
          />
        </View>

        <View style={styles.usageFooter}>
          <TouchableOpacity onPress={onOpenSettings} activeOpacity={0.7}>
            <Text style={styles.footerText}>
              Daily limit{' '}
              <Text style={styles.footerBold}>{limitProgress.limitFormatted}</Text>{' '}
              (edit)
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.footerRemaining,
              limitProgress.isOverLimit && { color: '#ffb5d5' },
            ]}
          >
            {limitProgress.remainingFormatted}
          </Text>
        </View>
      </View>

      {/* Gentle Nudge Banner when near/over limit */}
      {showGentleNudge && limitProgress.nudgeMessage && (
        <View style={styles.nudgeBanner}>
          <View style={styles.nudgeIcon}>
            <Icon name="bell" size={15} color={COLORS.purple} />
          </View>
          <Text style={styles.nudgeText}>{limitProgress.nudgeMessage}</Text>
        </View>
      )}

      {/* Brainrot Index */}
      <View style={styles.indexCard}>
        <View style={styles.indexTop}>
          <Text style={styles.eyebrow}>BRAINROT INDEX</Text>
          <View style={styles.trendBadge}>
            <Icon name="bar-chart" size={14} color={COLORS.green} />
            <Text style={styles.trendText}>{brainrotIndex.trendText}</Text>
          </View>
        </View>
        <Text style={styles.indexScore}>
          {brainrotIndex.score !== null ? brainrotIndex.score : '—'}
          <Text style={styles.indexMax}>/100</Text>
        </Text>
        <Text style={styles.indexLabel}>{brainrotIndex.label}</Text>
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
          <MissionRow
            key={mission.id}
            mission={mission}
            onPress={() => onMissionClick(index)}
          />
        ))}
      </View>

      {/* Habit Chart */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.sectionTitle}>Healthy habits (7-day window)</Text>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>{topAxisLabel}</Text>
          <Text style={styles.chartLabel}>{midAxisLabel}</Text>
          <Text style={styles.chartLabel}>0</Text>
        </View>
        <View style={styles.chartBars}>
          {chartDays.map((item) => (
            <View key={item.key} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: `${item.heightPct}%` as any },
                  item.isOver ? styles.barPink : null,
                  item.isToday ? styles.barToday : null,
                ]}
              />
              <Text style={[styles.barLabel, item.isToday && styles.barLabelToday]}>
                {item.label}
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
          <Text style={styles.calloutBold}>
            {usageDisplay.hasVerifiedEstimate && limitProgress.remainingMinutes !== null
              ? limitProgress.isOverLimit
                ? 'Time for a gentle reset'
                : `${limitProgress.remainingFormatted} inside today's target`
              : 'Honest local-first tracking'}
          </Text>
          <Text style={styles.calloutSub}>
            {usageDisplay.hasVerifiedEstimate
              ? `Compared against your ${limitProgress.limitFormatted} daily target`
              : 'Enable Usage Access to populate your 7-day Instagram foreground trend'}
          </Text>
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
            Your estimates stay on this device. ROT never asks for your Instagram login
            and never claims exact Reel counts.
          </Text>
        </View>
      </View>

      {/* Earned Note */}
      <View style={styles.earnedNote}>
        <Icon name="sparkles" size={14} color={COLORS.pink} />
        <Text style={styles.earnedText}>
          {earnedXp > 0
            ? `You have earned ${earnedXp} XP from healthy actions today.`
            : 'Complete a mission or focus break to grow your brain bank.'}
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  heading: {
    flex: 1,
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
    lineHeight: 34,
  },
  dot: { color: COLORS.pink },
  editNameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#f1eaf9',
    borderWidth: 1,
    borderColor: '#e4d6f4',
  },
  editNameChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
  },
  nameEditorCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
  },
  nameEditorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  nameEditorHint: {
    fontSize: 10,
    color: COLORS.muted,
    lineHeight: 15,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  nameInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dfd3eb',
    backgroundColor: '#faf6fe',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  nameClearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1eaf9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSaveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
  },
  nameSaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  nameResetBtn: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: '#ffe8f2',
  },
  nameResetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.pink,
  },
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
    marginBottom: 14,
    zIndex: 1,
    gap: 10,
  },
  usageCopyCol: {
    flex: 1,
  },
  usageNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -2.5,
  },
  usageStatusHeadline: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.yellow,
    letterSpacing: -1,
  },
  usageUnit: { fontSize: 22, color: '#cbbce4', letterSpacing: -0.5 },
  usageLabel: {
    fontSize: 12,
    color: '#d6cbea',
    marginTop: 4,
    lineHeight: 17,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(41,16,76,0.48)',
  },
  warningPillText: {
    flex: 1,
    fontSize: 10,
    color: '#ffe89c',
    fontWeight: '600',
    lineHeight: 14,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(41,16,76,0.38)',
    alignSelf: 'flex-start',
  },
  sourcePillText: {
    fontSize: 10,
    color: '#e5daf5',
    fontWeight: '600',
  },
  usageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    marginBottom: 14,
  },
  usageActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  mascot: {
    width: 86,
    height: 74,
    borderRadius: 37,
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
    top: 30,
    left: 17,
    width: 15,
    height: 10,
    borderTopWidth: 3,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 8,
  },
  eyeRight: {
    position: 'absolute',
    top: 30,
    right: 17,
    width: 15,
    height: 10,
    borderTopWidth: 3,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 8,
  },
  mouth: {
    position: 'absolute',
    bottom: 15,
    left: 29,
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

  // Gentle Nudge
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: '#fff0f7',
    borderWidth: 1,
    borderColor: '#f8cde1',
    marginBottom: 14,
  },
  nudgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffe0ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.ink,
    lineHeight: 16,
    fontWeight: '600',
  },

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
  indexLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 18, lineHeight: 17 },
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
    minHeight: 8,
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
