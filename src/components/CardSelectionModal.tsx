import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import { CardExportFormat, CardType } from '../constants/types';
import {
  ArchetypeCardData,
  ArchetypeCardPoster,
  WeeklyAchievementPoster,
  WeeklyCardData,
} from './ShareableCards';
import Icon from './Icon';

type Props = {
  visible: boolean;
  selectedCardType: CardType;
  selectedFormat: CardExportFormat;
  privateMode: boolean;
  showStatsOnPrivateCard: boolean;
  busyAction: 'save' | 'share' | null;
  archetypeData: ArchetypeCardData;
  weeklyData: WeeklyCardData;
  onSelectCardType: (cardType: CardType) => void;
  onSelectFormat: (format: CardExportFormat) => void;
  onTogglePrivateStats: () => void;
  onSaveCard: () => void;
  onShareCard: () => void;
  onClose: () => void;
};

export default function CardSelectionModal({
  visible,
  selectedCardType,
  selectedFormat,
  privateMode,
  showStatsOnPrivateCard,
  busyAction,
  archetypeData,
  weeklyData,
  onSelectCardType,
  onSelectFormat,
  onTogglePrivateStats,
  onSaveCard,
  onShareCard,
  onClose,
}: Props) {
  // 0 = Archetype Card centered, 1 = Weekly Achievement Card centered
  const focusAnim = useRef(
    new Animated.Value(selectedCardType === 'archetype' ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: selectedCardType === 'archetype' ? 0 : 1,
      stiffness: 180,
      damping: 22,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [selectedCardType, focusAnim]);

  const leftPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (g.dx > 24) {
            onSelectCardType('archetype');
          } else if (g.dx < -24) {
            onSelectCardType('weekly');
          }
        },
      }),
    [onSelectCardType]
  );

  const rightPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -24) {
            onSelectCardType('weekly');
          } else if (g.dx > 24) {
            onSelectCardType('archetype');
          }
        },
      }),
    [onSelectCardType]
  );

  const stagePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (g.dx > 28) {
            onSelectCardType('archetype');
          } else if (g.dx < -28) {
            onSelectCardType('weekly');
          }
        },
      }),
    [onSelectCardType]
  );

  const isStoryFormat = selectedFormat === 'story';
  const cardOffsetX = isStoryFormat ? 68 : 76;
  const cardOffsetY = isStoryFormat ? 10 : 14;
  const miniScale = isStoryFormat ? 0.37 : 0.48;

  // Left card (Archetype): centered when focusAnim=0, tilted left (-6deg) & tucked left when focusAnim=1
  const leftTranslateX = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -cardOffsetX],
  });
  const leftTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cardOffsetY],
  });
  const leftScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });
  const leftRotate = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-6deg'],
  });
  const leftOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.84],
  });

  // Right card (Weekly): tilted right (+6deg) & tucked right when focusAnim=0, centered when focusAnim=1
  const rightTranslateX = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardOffsetX, 0],
  });
  const rightTranslateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardOffsetY, 0],
  });
  const rightScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  const rightRotate = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['6deg', '0deg'],
  });
  const rightOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.84, 1],
  });

  const isArchetypeSelected = selectedCardType === 'archetype';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close card selector"
          >
            <Icon name="x" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <Text style={styles.eyebrow}>CHOOSE YOUR COLLECTOR CARD</Text>
          <Text style={styles.title}>
            {isArchetypeSelected ? 'Archetype Card' : 'Weekly Achievement Card'}
          </Text>
          <Text style={styles.hint}>
            Swipe either card toward center or tap to switch
          </Text>

          {/* Overlapping Dual-Card Swipe Stage */}
          <View
            style={[
              styles.cardStage,
              { height: isStoryFormat ? 258 : 240 },
            ]}
            {...stagePanResponder.panHandlers}
          >
            {/* Left Card: Archetype */}
            <Animated.View
              {...leftPanResponder.panHandlers}
              style={[
                styles.floatingCardSlot,
                {
                  zIndex: isArchetypeSelected ? 10 : 2,
                  elevation: isArchetypeSelected ? 10 : 2,
                  opacity: leftOpacity,
                  transform: [
                    { translateX: leftTranslateX },
                    { translateY: leftTranslateY },
                    { rotate: leftRotate },
                    { scale: leftScale },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => onSelectCardType('archetype')}
                style={[
                  styles.miniCardFrame,
                  isArchetypeSelected && styles.miniCardFrameActive,
                ]}
              >
                <ArchetypeCardPoster
                  data={archetypeData}
                  format={selectedFormat}
                  scale={miniScale}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Right Card: Weekly Achievement */}
            <Animated.View
              {...rightPanResponder.panHandlers}
              style={[
                styles.floatingCardSlot,
                {
                  zIndex: !isArchetypeSelected ? 10 : 2,
                  elevation: !isArchetypeSelected ? 10 : 2,
                  opacity: rightOpacity,
                  transform: [
                    { translateX: rightTranslateX },
                    { translateY: rightTranslateY },
                    { rotate: rightRotate },
                    { scale: rightScale },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => onSelectCardType('weekly')}
                style={[
                  styles.miniCardFrame,
                  !isArchetypeSelected && styles.miniCardFrameActive,
                ]}
              >
                <WeeklyAchievementPoster
                  data={weeklyData}
                  format={selectedFormat}
                  scale={miniScale}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Output Resolution Format */}
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[
                styles.formatChip,
                selectedFormat === 'feed' && styles.formatChipActive,
              ]}
              onPress={() => onSelectFormat('feed')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.formatChipText,
                  selectedFormat === 'feed' && styles.formatChipTextActive,
                ]}
              >
                Feed 4:5 (1080×1350)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.formatChip,
                selectedFormat === 'story' && styles.formatChipActive,
              ]}
              onPress={() => onSelectFormat('story')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.formatChipText,
                  selectedFormat === 'story' && styles.formatChipTextActive,
                ]}
              >
                Story 9:16 (1080×1920)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Private Mode Option */}
          {privateMode && (
            <TouchableOpacity
              style={styles.privateOptionRow}
              onPress={onTogglePrivateStats}
              activeOpacity={0.8}
            >
              <Icon
                name={showStatsOnPrivateCard ? 'check-square' : 'square'}
                size={15}
                color={COLORS.purple}
              />
              <Text style={styles.privateOptionText}>
                Private mode: Include XP & streak stats on card
              </Text>
            </TouchableOpacity>
          )}

          {/* Save & Share Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={onSaveCard}
              disabled={busyAction !== null}
              activeOpacity={0.8}
            >
              {busyAction === 'save' ? (
                <ActivityIndicator size="small" color={COLORS.purple} />
              ) : (
                <Icon name="download" size={14} color={COLORS.purple} />
              )}
              <Text style={styles.saveActionText}>Save PNG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareActionBtn}
              onPress={onShareCard}
              disabled={busyAction !== null}
              activeOpacity={0.8}
            >
              {busyAction === 'share' ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Icon name="share" size={14} color={COLORS.white} />
              )}
              <Text style={styles.shareActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,10,54,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    borderWidth: 2,
    borderColor: COLORS.darkPurple,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#29104c',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eee7fa',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.pink,
    marginTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  hint: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  cardStage: {
    width: '100%',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  floatingCardSlot: {
    position: 'absolute',
  },
  miniCardFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cbbce0',
    backgroundColor: COLORS.cream,
    shadowColor: '#29104c',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  miniCardFrameActive: {
    borderColor: COLORS.pink,
    borderWidth: 2.5,
  },
  formatRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  formatChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#dfd3eb',
  },
  formatChipActive: {
    backgroundColor: '#ffe4ef',
    borderColor: COLORS.pink,
  },
  formatChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },
  formatChipTextActive: {
    color: COLORS.pink,
  },
  privateOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1eaf9',
    marginBottom: 12,
  },
  privateOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  saveActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eee7fa',
    borderWidth: 1.5,
    borderColor: COLORS.purple,
  },
  saveActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.pink,
    shadowColor: '#bf256b',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
