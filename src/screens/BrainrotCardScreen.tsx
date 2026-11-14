import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { COLORS, RADIUS, SCREEN_WIDTH } from '../constants/theme';
import {
  CardExportFormat,
  CardType,
  PlayerLevelInfo,
  WeeklyAchievementSummary,
} from '../constants/types';
import {
  formatCardExportFilename,
  getLocalDateKey,
} from '../utils/domainLogic';
import {
  prepareAndVerifyCardPng,
  saveCardPngToGallery,
  shareCardPngNative,
} from '../utils/usageStats';
import {
  ArchetypeCardData,
  ArchetypeCardPoster,
  WeeklyAchievementPoster,
  WeeklyCardData,
} from '../components/ShareableCards';
import CardSelectionModal from '../components/CardSelectionModal';
import Icon from '../components/Icon';

type Props = {
  displayName: string;
  totalXp: number;
  playerLevel: PlayerLevelInfo;
  currentStreak: number;
  brainrotScore: number | null;
  archetypeTitle: string;
  archetypeDesc: string;
  badgesUnlockedCount: number;
  weeklySummary: WeeklyAchievementSummary;
  privateMode: boolean;
  selectedCardType: CardType;
  selectedFormat: CardExportFormat;
  onSelectCardType: (cardType: CardType) => void;
  onSelectFormat: (format: CardExportFormat) => void;
  onEditName: () => void;
  onToast: (message: string) => void;
};

export default function BrainrotCardScreen({
  displayName,
  totalXp,
  playerLevel,
  currentStreak,
  brainrotScore,
  archetypeTitle,
  archetypeDesc,
  badgesUnlockedCount,
  weeklySummary,
  privateMode,
  selectedCardType,
  selectedFormat,
  onSelectCardType,
  onSelectFormat,
  onEditName,
  onToast,
}: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showStatsOnPrivateCard, setShowStatsOnPrivateCard] = useState(true);
  const [busyAction, setBusyAction] = useState<'save' | 'share' | null>(null);
  const exportStageRef = useRef<React.ComponentRef<typeof View>>(null);
  const cardCarouselRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const hasLaidOutCarousel = useRef(false);
  const wasSelectorOpenRef = useRef(false);

  const pageWidth = SCREEN_WIDTH - 40;
  const previewScale = Math.min(0.92, Math.max(0.74, (SCREEN_WIDTH - 48) / 360));
  const targetWidth = 1080;
  const targetHeight = selectedFormat === 'story' ? 1920 : 1350;

  useEffect(() => {
    const justClosed = wasSelectorOpenRef.current && !selectorOpen;
    wasSelectorOpenRef.current = selectorOpen;
    if (!hasLaidOutCarousel.current) return;
    // Keep background carousel frozen at its current position while popup is open
    if (selectorOpen) return;
    const targetX = selectedCardType === 'archetype' ? 0 : pageWidth;
    cardCarouselRef.current?.scrollTo({ x: targetX, animated: !justClosed });
  }, [selectedCardType, pageWidth, selectorOpen]);

  function handleCarouselLayout() {
    if (!hasLaidOutCarousel.current) {
      hasLaidOutCarousel.current = true;
      if (selectedCardType === 'weekly') {
        cardCarouselRef.current?.scrollTo({ x: pageWidth, animated: false });
      }
    }
  }

  function handleCarouselMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const nextType: CardType = offsetX >= pageWidth * 0.5 ? 'weekly' : 'archetype';
    if (nextType !== selectedCardType) {
      onSelectCardType(nextType);
    }
  }

  const archetypeData: ArchetypeCardData = {
    displayName,
    totalXp,
    playerLevel,
    currentStreak,
    brainrotScore,
    archetypeTitle,
    archetypeDesc,
    badgesUnlockedCount,
    privateMode,
    showStatsOnPrivateCard,
  };

  const weeklyData: WeeklyCardData = {
    displayName,
    weekly: weeklySummary,
    archetypeTitle,
    totalXp,
    privateMode,
    showStatsOnPrivateCard,
  };

  async function renderSelectedCardPng() {
    // Allow RN one tick to guarantee offscreen layout matches active cardType/format/options
    await new Promise((resolve) => setTimeout(resolve, 90));
    if (!exportStageRef.current) {
      throw new Error('Card capture surface is not ready.');
    }
    const rawUri = await captureRef(exportStageRef, {
      format: 'png',
      quality: 1,
      width: targetWidth,
      height: targetHeight,
      result: 'tmpfile',
    });

    const dateKey = getLocalDateKey();
    const filename = formatCardExportFilename(
      selectedCardType,
      displayName,
      dateKey,
      selectedFormat
    );
    const prepared = await prepareAndVerifyCardPng(
      rawUri,
      targetWidth,
      targetHeight,
      filename
    );

    const statsHash = `${totalXp}_${currentStreak}_${brainrotScore ?? 'p'}_${weeklySummary.weeklyXpEarned}_${weeklySummary.missionsCompletedThisWeek}_${showStatsOnPrivateCard ? '1' : '0'}_${privateMode ? 'priv' : 'pub'}`;
    const dedupKey = `${selectedCardType}_${selectedFormat}_${dateKey}_${statsHash}`;

    return { prepared, dedupKey };
  }

  async function handleSaveOnly() {
    if (busyAction !== null) return;
    setBusyAction('save');
    try {
      const { prepared, dedupKey } = await renderSelectedCardPng();
      const galleryRes = await saveCardPngToGallery(
        prepared.filePath,
        prepared.filename,
        dedupKey
      );
      const msg =
        galleryRes.status === 'already_saved'
          ? `Already saved in Gallery (${galleryRes.album}/${galleryRes.filename} · ${prepared.width}×${prepared.height}).`
          : `Saved to Gallery: ${galleryRes.album}/${galleryRes.filename} (${prepared.width}×${prepared.height} PNG).`;
      onToast(msg);
      setSelectorOpen(false);
    } catch (err: any) {
      const msg =
        err?.code === 'STORAGE_PERMISSION_DENIED'
          ? 'Storage permission was denied. Enable storage access to save to Gallery.'
          : err?.message || 'Could not save card PNG.';
      onToast(msg);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveAndShare() {
    if (busyAction !== null) return;
    setBusyAction('share');
    try {
      const { prepared, dedupKey } = await renderSelectedCardPng();
      const galleryRes = await saveCardPngToGallery(
        prepared.filePath,
        prepared.filename,
        dedupKey
      );
      const shareText =
        selectedCardType === 'archetype'
          ? `ROT. Brainrot Club — ${archetypeTitle} (${totalXp} XP)`
          : `ROT. Weekly Recap — ${weeklySummary.headline}`;

      const shareRes = await shareCardPngNative(
        prepared.filePath,
        prepared.filename,
        shareText,
        !privateMode
      );

      let msg = '';
      if (shareRes.status === 'no_app') {
        msg = `Saved to ${galleryRes.album}/${galleryRes.filename}. No compatible image-sharing app found.`;
      } else {
        msg = `Ready in ${galleryRes.album}/${galleryRes.filename} (${prepared.width}×${prepared.height} PNG) · Share sheet opened.`;
      }
      onToast(msg);
      setSelectorOpen(false);
    } catch (err: any) {
      const msg =
        err?.code === 'STORAGE_PERMISSION_DENIED'
          ? 'Storage permission was denied. Could not save or share card.'
          : err?.message || 'Unable to generate or share card PNG.';
      onToast(msg);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Offscreen High-Res Export Stage (720×900 / 720×1280 scaled to 1080×1350 / 1080×1920) */}
      <View
        pointerEvents="none"
        collapsable={false}
        style={styles.offscreenStageWrap}
      >
        <View ref={exportStageRef} collapsable={false}>
          {selectedCardType === 'archetype' ? (
            <ArchetypeCardPoster
              data={archetypeData}
              format={selectedFormat}
              scale={2}
            />
          ) : (
            <WeeklyAchievementPoster
              data={weeklyData}
              format={selectedFormat}
              scale={2}
            />
          )}
        </View>
      </View>

      <View
        style={{ flex: 1 }}
        pointerEvents={selectorOpen ? 'none' : 'auto'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!selectorOpen}
        >
          {/* Header */}
          <Text style={styles.eyebrow}>COLLECTIBLE ROT CARDS</Text>
          <Text style={styles.heading}>
            Meet your brainrot cards<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Swipe between your Archetype and Weekly Achievement cards, then tap Save or Share to export.
          </Text>

          {/* Top Action Row */}
          <View style={styles.topBtnRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => setSelectorOpen(true)}
              activeOpacity={0.85}
            >
              <Icon name="sparkles" size={14} color={COLORS.white} />
              <Text style={styles.shareBtnText}>Save or Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editIdentityBtn}
              onPress={onEditName}
              activeOpacity={0.8}
            >
              <Icon name="edit" size={12} color={COLORS.purple} />
              <Text style={styles.editIdentityBtnText}>{displayName}</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontally Swipeable Card Browser */}
          <ScrollView
            ref={cardCarouselRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            scrollEnabled={!selectorOpen}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onLayout={handleCarouselLayout}
            onMomentumScrollEnd={handleCarouselMomentumEnd}
            style={styles.carouselScroll}
          >
          <View style={[styles.previewPage, { width: pageWidth }]}>
            <View style={styles.previewFrame}>
              <ArchetypeCardPoster
                data={archetypeData}
                format={selectedFormat}
                scale={previewScale}
              />
            </View>
          </View>

          <View style={[styles.previewPage, { width: pageWidth }]}>
            <View style={styles.previewFrame}>
              <WeeklyAchievementPoster
                data={weeklyData}
                format={selectedFormat}
                scale={previewScale}
              />
            </View>
          </View>
        </ScrollView>

        {/* Subtle Non-Button Swipe Hint & Indicator Dots */}
        <View style={styles.swipeHintRow}>
          <View style={styles.dotIndicatorRow}>
            <View
              style={[
                styles.dotIndicator,
                selectedCardType === 'archetype' && styles.dotIndicatorActive,
              ]}
            />
            <View
              style={[
                styles.dotIndicator,
                selectedCardType === 'weekly' && styles.dotIndicatorActive,
              ]}
            />
          </View>
          <Text style={styles.swipeHintText}>
            {selectedCardType === 'archetype'
              ? 'Archetype Card · Swipe left for Weekly'
              : 'Weekly Achievement · Swipe right for Archetype'}
          </Text>
        </View>

        {/* Evolution Path */}
        <View style={styles.detailPanel}>
          <Text style={styles.eyebrow}>EVOLUTION PATH</Text>
          <Text style={styles.detailTitle}>From newbie to offline legend</Text>
          <View style={styles.evolution}>
            <View style={[styles.evoNode, styles.evoNodeActive]}>
              <Text style={styles.evoEmoji}>◡</Text>
              <Text style={styles.evoLabel}>Newbie</Text>
            </View>
            <View style={[styles.evoLine, styles.evoLineActive]} />
            <View style={[styles.evoNode, styles.evoNodeActive]}>
              <Text style={styles.evoEmoji}>◠</Text>
              <Text style={styles.evoLabel}>{archetypeTitle}</Text>
            </View>
            <View style={[styles.evoLine, totalXp >= 400 && styles.evoLineActive]} />
            <View style={[styles.evoNode, totalXp >= 400 && styles.evoNodeActive]}>
              <Text
                style={[
                  styles.evoEmoji,
                  { color: totalXp >= 400 ? COLORS.pink : '#b0a2bd' },
                ]}
              >
                ★
              </Text>
              <Text style={styles.evoLabel}>Offline Legend</Text>
            </View>
          </View>
        </View>

        {/* Quote Panel */}
        <View style={styles.quotePanel}>
          <Icon name="sparkles" size={16} color={COLORS.pink} />
          <Text style={styles.quoteText}>
            "Your brain is not broken. It just has excellent taste in tiny videos."
          </Text>
          <Text style={styles.quoteAuthor}>— ROT. daily wisdom</Text>
        </View>
        </ScrollView>
      </View>

      {/* Cute Dual Card Swipe Selection Popup */}
      <CardSelectionModal
        visible={selectorOpen}
        selectedCardType={selectedCardType}
        selectedFormat={selectedFormat}
        privateMode={privateMode}
        showStatsOnPrivateCard={showStatsOnPrivateCard}
        busyAction={busyAction}
        archetypeData={archetypeData}
        weeklyData={weeklyData}
        onSelectCardType={onSelectCardType}
        onSelectFormat={onSelectFormat}
        onTogglePrivateStats={() => setShowStatsOnPrivateCard((v) => !v)}
        onSaveCard={() => void handleSaveOnly()}
        onShareCard={() => void handleSaveAndShare()}
        onClose={() => setSelectorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreenStageWrap: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 1,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -1,
    marginTop: 8,
    lineHeight: 32,
  },
  dot: { color: COLORS.pink },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  topBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.pink,
    shadowColor: '#bf256b',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.white },
  editIdentityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#f1eaf9',
    borderWidth: 1,
    borderColor: '#e4d6f4',
  },
  editIdentityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  carouselScroll: {
    marginBottom: 10,
  },
  previewPage: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  previewFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.darkPurple,
    backgroundColor: COLORS.cream,
    shadowColor: '#29104c',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  swipeHintRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dotIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d9c9ed',
  },
  dotIndicatorActive: {
    width: 18,
    backgroundColor: COLORS.pink,
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  detailPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    padding: 22,
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 6,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  evolution: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evoNode: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#eee7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  evoNodeActive: {
    backgroundColor: '#ffdfea',
  },
  evoEmoji: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.pink,
  },
  evoLabel: {
    position: 'absolute',
    top: 60,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.ink,
    width: 80,
    textAlign: 'center',
  },
  evoLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e8dff0',
  },
  evoLineActive: {
    backgroundColor: COLORS.pink,
  },
  quotePanel: {
    backgroundColor: '#fff0f6',
    borderWidth: 1,
    borderColor: '#ffd3e6',
    borderRadius: RADIUS.xl,
    padding: 22,
    marginTop: 8,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    marginTop: 10,
  },
  quoteAuthor: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 10,
  },
});
