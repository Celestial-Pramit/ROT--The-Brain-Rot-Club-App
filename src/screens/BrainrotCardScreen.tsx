import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  onToast: (message: string) => void;
};

export default function BrainrotCardScreen({ onToast }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.eyebrow}>YOUR UNOFFICIAL TITLE</Text>
      <Text style={styles.heading}>
        Meet your brainrot card<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        A lovingly unserious snapshot of your scrolling era.
      </Text>

      <TouchableOpacity
        style={styles.shareBtn}
        onPress={() => onToast('Card copied to your imaginary story.')}
        activeOpacity={0.8}
      >
        <Icon name="sparkles" size={14} color={COLORS.white} />
        <Text style={styles.shareBtnText}>Share card</Text>
      </TouchableOpacity>

      {/* Identity Card */}
      <View style={styles.identityCard}>
        <Text style={styles.cardStamp}>ROT. BRAINROT CLUB</Text>

        {/* Brain mascot (large) */}
        <View style={styles.largeMascot}>
          <View style={styles.eyeLeft} />
          <View style={styles.eyeRight} />
          <View style={styles.mouth} />
        </View>

        <Text style={styles.eyebrow}>CURRENT ARCHETYPE</Text>
        <Text style={styles.archetypeTitle}>Night Owl</Text>
        <Text style={styles.archetypeDesc}>
          "One more Reel"{'\n'}is your bedtime story.
        </Text>
        <View style={styles.divider} />
        <Text style={styles.cardFoot}>MEMBER SINCE 2026 · RANK 04</Text>
      </View>

      {/* Evolution Path */}
      <View style={styles.detailPanel}>
        <Text style={styles.eyebrow}>EVOLUTION PATH</Text>
        <Text style={styles.detailTitle}>From newbie to night owl</Text>
        <View style={styles.evolution}>
          <View style={[styles.evoNode, styles.evoNodeActive]}>
            <Text style={styles.evoEmoji}>◡</Text>
            <Text style={styles.evoLabel}>Newbie</Text>
          </View>
          <View style={[styles.evoLine, styles.evoLineActive]} />
          <View style={[styles.evoNode, styles.evoNodeActive]}>
            <Text style={styles.evoEmoji}>◠</Text>
            <Text style={styles.evoLabel}>Cooked</Text>
          </View>
          <View style={styles.evoLine} />
          <View style={styles.evoNode}>
            <Text style={[styles.evoEmoji, { color: '#b0a2bd' }]}>★</Text>
            <Text style={styles.evoLabel}>Doctor Doom</Text>
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
    lineHeight: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 20,
    shadowColor: '#bf256b',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  // Identity Card
  identityCard: {
    borderWidth: 2,
    borderColor: COLORS.purple,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.white,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#f2bddc',
    shadowOpacity: 0.5,
    shadowOffset: { width: 6, height: 6 },
    elevation: 6,
  },
  cardStamp: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.pink,
  },
  largeMascot: {
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.pink,
    borderWidth: 4,
    borderColor: COLORS.darkPurple,
    marginVertical: 24,
    position: 'relative',
    transform: [{ rotate: '-4deg' }],
    shadowColor: '#f8b8cf',
    shadowOpacity: 0.5,
    shadowOffset: { width: 6, height: 6 },
    elevation: 5,
  },
  eyeLeft: {
    position: 'absolute',
    top: 44,
    left: 28,
    width: 20,
    height: 12,
    borderTopWidth: 4,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 10,
  },
  eyeRight: {
    position: 'absolute',
    top: 44,
    right: 28,
    width: 20,
    height: 12,
    borderTopWidth: 4,
    borderTopColor: COLORS.darkPurple,
    borderRadius: 10,
  },
  mouth: {
    position: 'absolute',
    bottom: 24,
    left: 50,
    width: 22,
    height: 10,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.darkPurple,
    borderRadius: 10,
  },
  archetypeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.7,
    marginTop: 8,
  },
  archetypeDesc: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 18,
  },
  cardFoot: {
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 0.6,
  },

  // Detail panels
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

  // Quote
  quotePanel: {
    backgroundColor: '#fff0f6',
    borderWidth: 1,
    borderColor: '#ffd3e6',
    borderRadius: RADIUS.xl,
    padding: 22,
    marginTop: 16,
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
