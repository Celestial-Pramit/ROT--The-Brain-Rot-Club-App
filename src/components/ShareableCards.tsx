import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import {
  CardExportFormat,
  PlayerLevelInfo,
  WeeklyAchievementSummary,
} from '../constants/types';
import RotMascot, { resolveMascotVariant } from './RotMascot';

export type ArchetypeCardData = {
  displayName: string;
  totalXp: number;
  playerLevel: PlayerLevelInfo;
  currentStreak: number;
  brainrotScore: number | null;
  archetypeTitle: string;
  archetypeDesc: string;
  badgesUnlockedCount: number;
  privateMode: boolean;
  showStatsOnPrivateCard: boolean;
};

export type WeeklyCardData = {
  displayName: string;
  weekly: WeeklyAchievementSummary;
  archetypeTitle: string;
  totalXp: number;
  privateMode: boolean;
  showStatsOnPrivateCard: boolean;
};

export function ArchetypeCardPoster({
  data,
  format = 'feed',
  scale = 1,
}: {
  data: ArchetypeCardData;
  format?: CardExportFormat;
  scale?: number;
}) {
  const s = scale;
  const width = 360 * s;
  const height = (format === 'story' ? 640 : 450) * s;
  const isStory = format === 'story';
  const showStats = !data.privateMode || data.showStatsOnPrivateCard;
  const variant = resolveMascotVariant(
    data.archetypeTitle,
    data.totalXp,
    data.badgesUnlockedCount
  );

  return (
    <View
      style={[
        styles.canvas,
        {
          width,
          height,
          paddingHorizontal: 22 * s,
          paddingVertical: (isStory ? 44 : 22) * s,
          justifyContent: 'space-between',
        },
      ]}
    >
      {/* Decorative Lavender Grid Backdrop Accent */}
      <View
        style={[
          styles.bgCircleTopRight,
          {
            width: 150 * s,
            height: 150 * s,
            borderRadius: 75 * s,
            top: -36 * s,
            right: -36 * s,
          },
        ]}
      />
      <View
        style={[
          styles.bgCircleBottomLeft,
          {
            width: 130 * s,
            height: 130 * s,
            borderRadius: 65 * s,
            bottom: -30 * s,
            left: -34 * s,
          },
        ]}
      />

      {/* Top Edition Bar */}
      <View style={styles.topPosterHeader}>
        <View
          style={[
            styles.brandChip,
            {
              paddingVertical: 5 * s,
              paddingHorizontal: 10 * s,
              borderRadius: 10 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={[styles.brandChipText, { fontSize: 10 * s }]}>
            ROT. · COLLECTOR CARD
          </Text>
        </View>
        <View
          style={[
            styles.yellowSticker,
            {
              paddingVertical: 5 * s,
              paddingHorizontal: 10 * s,
              borderRadius: 10 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={[styles.yellowStickerText, { fontSize: 10 * s }]}>
            LVL {String(data.playerLevel.level).padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Main Framed Collector Card */}
      <View
        style={[
          styles.framedCard,
          {
            borderRadius: 22 * s,
            borderWidth: Math.max(2, 2.5 * s),
            paddingVertical: (isStory ? 26 : 16) * s,
            paddingHorizontal: 18 * s,
            shadowOffset: { width: 5 * s, height: 5 * s },
          },
        ]}
      >
        <View style={styles.cardTopMetaRow}>
          <Text style={[styles.stampText, { fontSize: 9.5 * s }]}>
            {data.displayName.toUpperCase()}
          </Text>
          <Text style={[styles.stampPink, { fontSize: 9.5 * s }]}>
            {data.privateMode ? 'PRIVATE EDITION' : '2026 SERIES'}
          </Text>
        </View>

        {/* Archetype Mascot */}
        <View style={{ marginVertical: (isStory ? 16 : 8) * s }}>
          <RotMascot variant={variant} scale={isStory ? s * 1.05 : s * 0.88} />
        </View>

        <Text style={[styles.archetypeEyebrow, { fontSize: 9 * s }]}>
          CURRENT ARCHETYPE
        </Text>
        <Text
          style={[
            styles.archetypeHeadline,
            {
              fontSize: (isStory ? 28 : 25) * s,
              lineHeight: (isStory ? 32 : 28) * s,
              marginTop: 3 * s,
            },
          ]}
          numberOfLines={2}
        >
          {data.archetypeTitle.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.archetypeQuote,
            {
              fontSize: 11 * s,
              lineHeight: 15 * s,
              marginTop: 5 * s,
            },
          ]}
        >
          {data.archetypeDesc.replace(/\n/g, ' ')}
        </Text>

        {/* Compact Privacy-Safe Stat Pills (no exact scroll minutes) */}
        {showStats ? (
          <View
            style={[
              styles.pillRow,
              { gap: 6 * s, marginTop: (isStory ? 18 : 12) * s },
            ]}
          >
            <View
              style={[
                styles.statPill,
                {
                  paddingVertical: 6 * s,
                  paddingHorizontal: 9 * s,
                  borderRadius: 10 * s,
                  borderWidth: Math.max(1, 1.5 * s),
                },
              ]}
            >
              <Text style={[styles.statPillValue, { fontSize: 11 * s }]}>
                {data.totalXp} XP
              </Text>
            </View>
            <View
              style={[
                styles.statPillPink,
                {
                  paddingVertical: 6 * s,
                  paddingHorizontal: 9 * s,
                  borderRadius: 10 * s,
                  borderWidth: Math.max(1, 1.5 * s),
                },
              ]}
            >
              <Text style={[styles.statPillPinkValue, { fontSize: 11 * s }]}>
                {data.currentStreak}D STREAK
              </Text>
            </View>
            <View
              style={[
                styles.statPillYellow,
                {
                  paddingVertical: 6 * s,
                  paddingHorizontal: 9 * s,
                  borderRadius: 10 * s,
                  borderWidth: Math.max(1, 1.5 * s),
                },
              ]}
            >
              <Text style={[styles.statPillYellowValue, { fontSize: 11 * s }]}>
                {data.brainrotScore !== null
                  ? `${data.brainrotScore}/100 INDEX`
                  : 'INDEX PENDING'}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.privateHiddenPill,
              {
                marginTop: 12 * s,
                paddingVertical: 7 * s,
                paddingHorizontal: 12 * s,
                borderRadius: 10 * s,
              },
            ]}
          >
            <Text style={[styles.privateHiddenText, { fontSize: 10 * s }]}>
              PRIVATE CARD · PERSONAL STATS HIDDEN
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Brand Footer Stamp */}
      <View style={styles.footerStamp}>
        <Text style={[styles.footerLeft, { fontSize: 9.5 * s }]}>
          ROT. THE BRAINROT CLUB
        </Text>
        <Text style={[styles.footerRight, { fontSize: 9.5 * s }]}>
          MORE SOUL · LESS SCROLL
        </Text>
      </View>
    </View>
  );
}

export function WeeklyAchievementPoster({
  data,
  format = 'feed',
  scale = 1,
}: {
  data: WeeklyCardData;
  format?: CardExportFormat;
  scale?: number;
}) {
  const s = scale;
  const width = 360 * s;
  const height = (format === 'story' ? 640 : 450) * s;
  const isStory = format === 'story';
  const showStats = !data.privateMode || data.showStatsOnPrivateCard;
  const variant = resolveMascotVariant(
    data.archetypeTitle,
    data.totalXp,
    data.weekly.unlockedBadgesCount
  );

  return (
    <View
      style={[
        styles.canvas,
        {
          width,
          height,
          paddingHorizontal: 22 * s,
          paddingVertical: (isStory ? 44 : 20) * s,
          justifyContent: 'space-between',
          backgroundColor: COLORS.cream,
        },
      ]}
    >
      {/* Decorative Lavender & Yellow Blocks */}
      <View
        style={[
          styles.bgCircleTopRight,
          {
            width: 140 * s,
            height: 140 * s,
            borderRadius: 70 * s,
            top: -30 * s,
            right: -30 * s,
            backgroundColor: '#ffe4ef',
          },
        ]}
      />

      {/* Top Purple Editorial Ribbon */}
      <View
        style={[
          styles.weeklyTopBanner,
          {
            paddingVertical: 8 * s,
            paddingHorizontal: 12 * s,
            borderRadius: 12 * s,
            borderWidth: Math.max(1.5, 2 * s),
          },
        ]}
      >
        <Text style={[styles.weeklyBannerLeft, { fontSize: 9.5 * s }]}>
          ROT. WEEKLY RECAP
        </Text>
        <Text style={[styles.weeklyBannerRight, { fontSize: 9 * s }]}>
          {data.weekly.weekLabel}
        </Text>
      </View>

      {/* Bold Headline */}
      <View style={{ marginTop: (isStory ? 10 : 4) * s }}>
        <Text style={[styles.weeklyNameTag, { fontSize: 10 * s }]}>
          {data.displayName.toUpperCase()} · {data.privateMode ? 'PRIVATE RECAP' : 'WEEKLY POSTER'}
        </Text>
        <Text
          style={[
            styles.weeklyHeadline,
            {
              fontSize: (isStory ? 29 : 24) * s,
              lineHeight: (isStory ? 33 : 27) * s,
              marginTop: 2 * s,
            },
          ]}
        >
          {data.weekly.headline}
        </Text>
      </View>

      {/* Dominant Hero Metric + Supporting Mascot */}
      <View
        style={[
          styles.weeklyHeroCard,
          {
            borderRadius: 18 * s,
            borderWidth: Math.max(2, 2.5 * s),
            paddingVertical: (isStory ? 18 : 12) * s,
            paddingHorizontal: 16 * s,
            shadowOffset: { width: 4 * s, height: 4 * s },
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.weeklyHeroEyebrow, { fontSize: 9 * s }]}>
            {showStats ? data.weekly.heroMetricLabel : 'PRIVATE WEEKLY CHECK-IN'}
          </Text>
          <Text
            style={[
              styles.weeklyHeroValue,
              {
                fontSize: (isStory ? 42 : 36) * s,
                lineHeight: (isStory ? 46 : 40) * s,
                marginTop: 2 * s,
              },
            ]}
          >
            {showStats ? data.weekly.heroMetricValue : 'PRIVATE'}
          </Text>
          <Text style={[styles.weeklyHeroSub, { fontSize: 10 * s, marginTop: 2 * s }]}>
            {showStats ? 'XP earned this week' : 'Progress kept local on device'}
          </Text>
        </View>
        <RotMascot variant={variant} scale={s * 0.62} />
      </View>

      {/* 2x2 Achievement Grid */}
      {showStats ? (
        <View style={[styles.weeklyGrid, { gap: 8 * s }]}>
          <View
            style={[
              styles.weeklyStatBox,
              {
                borderRadius: 14 * s,
                borderWidth: Math.max(1.5, 2 * s),
                paddingVertical: (isStory ? 12 : 8) * s,
                paddingHorizontal: 12 * s,
              },
            ]}
          >
            <Text style={[styles.weeklyStatNum, { fontSize: 18 * s }]}>
              {data.weekly.missionsCompletedThisWeek}
            </Text>
            <Text style={[styles.weeklyStatLbl, { fontSize: 9.5 * s }]}>
              MISSIONS DONE
            </Text>
          </View>

          <View
            style={[
              styles.weeklyStatBox,
              {
                borderRadius: 14 * s,
                borderWidth: Math.max(1.5, 2 * s),
                paddingVertical: (isStory ? 12 : 8) * s,
                paddingHorizontal: 12 * s,
              },
            ]}
          >
            <Text style={[styles.weeklyStatNum, { fontSize: 18 * s }]}>
              {data.weekly.weeklyQuestsCompleted}/{data.weekly.weeklyQuestsTotal}
            </Text>
            <Text style={[styles.weeklyStatLbl, { fontSize: 9.5 * s }]}>
              WEEKLY QUESTS
            </Text>
          </View>

          <View
            style={[
              styles.weeklyStatBox,
              {
                borderRadius: 14 * s,
                borderWidth: Math.max(1.5, 2 * s),
                paddingVertical: (isStory ? 12 : 8) * s,
                paddingHorizontal: 12 * s,
              },
            ]}
          >
            <Text style={[styles.weeklyStatNum, { fontSize: 18 * s }]}>
              {data.weekly.currentStreak}d
            </Text>
            <Text style={[styles.weeklyStatLbl, { fontSize: 9.5 * s }]}>
              ACTIVE STREAK
            </Text>
          </View>

          <View
            style={[
              styles.weeklyStatBox,
              {
                borderRadius: 14 * s,
                borderWidth: Math.max(1.5, 2 * s),
                paddingVertical: (isStory ? 12 : 8) * s,
                paddingHorizontal: 12 * s,
              },
            ]}
          >
            <Text style={[styles.weeklyStatNum, { fontSize: 18 * s }]}>
              {data.weekly.unlockedBadgesCount}/{data.weekly.totalBadgesCount}
            </Text>
            <Text style={[styles.weeklyStatLbl, { fontSize: 9.5 * s }]}>
              BADGES EARNED
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.privateHiddenPill,
            {
              paddingVertical: 14 * s,
              paddingHorizontal: 14 * s,
              borderRadius: 14 * s,
            },
          ]}
        >
          <Text style={[styles.privateHiddenText, { fontSize: 10.5 * s }]}>
            PRIVATE WEEKLY CARD · STATS HIDDEN BY USER
          </Text>
        </View>
      )}

      {/* Badges & Tagline Strip */}
      <View
        style={[
          styles.weeklyTaglineBox,
          {
            borderRadius: 12 * s,
            paddingVertical: (isStory ? 12 : 8) * s,
            paddingHorizontal: 12 * s,
          },
        ]}
      >
        {showStats && data.weekly.unlockedBadgeNames.length > 0 && (
          <Text style={[styles.badgeHighlightText, { fontSize: 9.5 * s }]} numberOfLines={1}>
            ★ {data.weekly.unlockedBadgeNames.slice(0, 3).join(' · ')}
          </Text>
        )}
        <Text
          style={[styles.weeklyTaglineText, { fontSize: 10 * s, lineHeight: 14 * s }]}
          numberOfLines={2}
        >
          {data.weekly.tagline}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footerStamp}>
        <Text style={[styles.footerLeft, { fontSize: 9.5 * s }]}>
          ROT. THE BRAINROT CLUB
        </Text>
        <Text style={[styles.footerRight, { fontSize: 9.5 * s }]}>
          WEEKLY ACHIEVEMENT
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: COLORS.cream,
    overflow: 'hidden',
    position: 'relative',
  },
  bgCircleTopRight: {
    position: 'absolute',
    backgroundColor: COLORS.lavender,
  },
  bgCircleBottomLeft: {
    position: 'absolute',
    backgroundColor: '#ffe4ef',
  },
  topPosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandChip: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.darkPurple,
  },
  brandChipText: {
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.6,
  },
  yellowSticker: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.darkPurple,
    transform: [{ rotate: '3deg' }],
  },
  yellowStickerText: {
    fontWeight: '900',
    color: COLORS.darkPurple,
    letterSpacing: 0.5,
  },
  framedCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.darkPurple,
    alignItems: 'center',
    shadowColor: COLORS.darkPurple,
    shadowOpacity: 0.18,
    elevation: 6,
  },
  cardTopMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stampText: {
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.7,
  },
  stampPink: {
    fontWeight: '800',
    color: COLORS.pink,
    letterSpacing: 0.7,
  },
  archetypeEyebrow: {
    fontWeight: '800',
    color: COLORS.pink,
    letterSpacing: 0.9,
  },
  archetypeHeadline: {
    fontWeight: '900',
    color: COLORS.darkPurple,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  archetypeQuote: {
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    backgroundColor: COLORS.lavender,
    borderColor: COLORS.purple,
  },
  statPillValue: {
    fontWeight: '800',
    color: COLORS.purple,
  },
  statPillPink: {
    backgroundColor: '#ffe4ef',
    borderColor: COLORS.pink,
  },
  statPillPinkValue: {
    fontWeight: '800',
    color: COLORS.pink,
  },
  statPillYellow: {
    backgroundColor: '#fff4cb',
    borderColor: '#d99e00',
  },
  statPillYellowValue: {
    fontWeight: '800',
    color: COLORS.darkPurple,
  },
  privateHiddenPill: {
    backgroundColor: COLORS.lavender,
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    alignItems: 'center',
  },
  privateHiddenText: {
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  footerStamp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontWeight: '800',
    color: COLORS.darkPurple,
    letterSpacing: 0.6,
  },
  footerRight: {
    fontWeight: '800',
    color: COLORS.pink,
    letterSpacing: 0.6,
  },

  // Weekly Card Specific
  weeklyTopBanner: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.darkPurple,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyBannerLeft: {
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.7,
  },
  weeklyBannerRight: {
    fontWeight: '800',
    color: COLORS.yellow,
    letterSpacing: 0.5,
  },
  weeklyNameTag: {
    fontWeight: '800',
    color: COLORS.pink,
    letterSpacing: 0.7,
  },
  weeklyHeadline: {
    fontWeight: '900',
    color: COLORS.darkPurple,
    letterSpacing: -0.7,
  },
  weeklyHeroCard: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.darkPurple,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.darkPurple,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  weeklyHeroEyebrow: {
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.7,
  },
  weeklyHeroValue: {
    fontWeight: '900',
    color: COLORS.darkPurple,
    letterSpacing: -1,
  },
  weeklyHeroSub: {
    fontWeight: '700',
    color: COLORS.darkPurple,
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weeklyStatBox: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.purple,
  },
  weeklyStatNum: {
    fontWeight: '900',
    color: COLORS.pink,
  },
  weeklyStatLbl: {
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  weeklyTaglineBox: {
    backgroundColor: COLORS.lavender,
  },
  badgeHighlightText: {
    fontWeight: '800',
    color: COLORS.purple,
    marginBottom: 2,
  },
  weeklyTaglineText: {
    fontWeight: '600',
    color: COLORS.ink,
  },
});
