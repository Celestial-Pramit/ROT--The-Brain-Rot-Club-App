import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export type MascotArchetypeVariant =
  | 'Grass Toucher'
  | 'Offline Legend'
  | 'Soft Launcher'
  | 'Night Owl'
  | 'Scroll Explorer';

export function resolveMascotVariant(
  archetypeTitle: string,
  totalXp: number,
  badgesUnlockedCount = 0
): MascotArchetypeVariant {
  if (archetypeTitle === 'Scroll Explorer') return 'Scroll Explorer';
  if (archetypeTitle === 'Night Owl') return 'Night Owl';
  if (archetypeTitle === 'Soft Launcher') return 'Soft Launcher';
  if (totalXp >= 700 && badgesUnlockedCount >= 5) return 'Offline Legend';
  return 'Grass Toucher';
}

type Props = {
  variant: MascotArchetypeVariant;
  scale?: number;
};

export default function RotMascot({ variant, scale = 1 }: Props) {
  const s = scale;
  const w = 128 * s;
  const h = 110 * s;
  const borderW = Math.max(2, 3.5 * s);

  return (
    <View style={[styles.wrap, { width: w + 28 * s, height: h + 28 * s }]}>
      {/* Variant Top Accessory */}
      {variant === 'Offline Legend' && (
        <View
          style={[
            styles.crown,
            {
              top: 2 * s,
              paddingHorizontal: 8 * s,
              paddingVertical: 2 * s,
              borderRadius: 8 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={[styles.crownText, { fontSize: 13 * s }]}>♛</Text>
        </View>
      )}

      {variant === 'Grass Toucher' && (
        <View
          style={[
            styles.sproutBadge,
            {
              top: 4 * s,
              right: 12 * s,
              width: 28 * s,
              height: 28 * s,
              borderRadius: 14 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={{ fontSize: 13 * s }}>🌿</Text>
        </View>
      )}

      {variant === 'Night Owl' && (
        <View
          style={[
            styles.moonBadge,
            {
              top: 4 * s,
              right: 12 * s,
              width: 28 * s,
              height: 28 * s,
              borderRadius: 14 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={{ fontSize: 13 * s }}>🌙</Text>
        </View>
      )}

      {variant === 'Soft Launcher' && (
        <View
          style={[
            styles.sparkBadge,
            {
              top: 4 * s,
              right: 12 * s,
              width: 28 * s,
              height: 28 * s,
              borderRadius: 14 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={[styles.sparkText, { fontSize: 13 * s }]}>✦</Text>
        </View>
      )}

      {variant === 'Scroll Explorer' && (
        <View
          style={[
            styles.dizzyBadge,
            {
              top: 4 * s,
              right: 12 * s,
              width: 28 * s,
              height: 28 * s,
              borderRadius: 14 * s,
              borderWidth: Math.max(1.5, 2 * s),
            },
          ]}
        >
          <Text style={[styles.dizzyBadgeText, { fontSize: 13 * s }]}>⚡</Text>
        </View>
      )}

      {/* Main Pink Brain Body */}
      <View
        style={[
          styles.body,
          {
            width: w,
            height: h,
            borderRadius: h / 2,
            borderWidth: borderW,
            shadowOffset: { width: 5 * s, height: 5 * s },
          },
        ]}
      >
        {/* Subtle brain squiggle crease */}
        <View
          style={[
            styles.crease,
            {
              top: 12 * s,
              width: 26 * s,
              height: 10 * s,
              borderBottomWidth: Math.max(1.5, 2.5 * s),
              borderRadius: 12 * s,
            },
          ]}
        />

        {/* Rosy cheeks */}
        <View
          style={[
            styles.cheek,
            {
              left: 16 * s,
              top: 56 * s,
              width: 16 * s,
              height: 9 * s,
              borderRadius: 8 * s,
            },
          ]}
        />
        <View
          style={[
            styles.cheek,
            {
              right: 16 * s,
              top: 56 * s,
              width: 16 * s,
              height: 9 * s,
              borderRadius: 8 * s,
            },
          ]}
        />

        {/* Eyes */}
        {variant === 'Offline Legend' ? (
          <View style={[styles.eyesRow, { top: 36 * s, gap: 26 * s }]}>
            <Text style={[styles.starEye, { fontSize: 22 * s }]}>★</Text>
            <Text style={[styles.starEye, { fontSize: 22 * s }]}>★</Text>
          </View>
        ) : variant === 'Scroll Explorer' ? (
          <View style={[styles.eyesRow, { top: 38 * s, gap: 26 * s }]}>
            <Text style={[styles.symbolEye, { fontSize: 18 * s }]}>@</Text>
            <Text style={[styles.symbolEye, { fontSize: 18 * s }]}>@</Text>
          </View>
        ) : variant === 'Night Owl' ? (
          <View style={[styles.eyesRow, { top: 43 * s, gap: 28 * s }]}>
            <View
              style={[
                styles.sleepyEye,
                {
                  width: 20 * s,
                  height: 10 * s,
                  borderBottomWidth: Math.max(2, 3.5 * s),
                  borderRadius: 10 * s,
                },
              ]}
            />
            <View
              style={[
                styles.sleepyEye,
                {
                  width: 20 * s,
                  height: 10 * s,
                  borderBottomWidth: Math.max(2, 3.5 * s),
                  borderRadius: 10 * s,
                },
              ]}
            />
          </View>
        ) : variant === 'Soft Launcher' ? (
          <View style={[styles.eyesRow, { top: 40 * s, gap: 28 * s }]}>
            <View
              style={[
                styles.dotEye,
                { width: 12 * s, height: 12 * s, borderRadius: 6 * s },
              ]}
            />
            <View
              style={[
                styles.archEye,
                {
                  width: 19 * s,
                  height: 11 * s,
                  borderTopWidth: Math.max(2, 3.5 * s),
                  borderRadius: 10 * s,
                },
              ]}
            />
          </View>
        ) : (
          <View style={[styles.eyesRow, { top: 41 * s, gap: 28 * s }]}>
            <View
              style={[
                styles.archEye,
                {
                  width: 20 * s,
                  height: 11 * s,
                  borderTopWidth: Math.max(2, 3.5 * s),
                  borderRadius: 10 * s,
                },
              ]}
            />
            <View
              style={[
                styles.archEye,
                {
                  width: 20 * s,
                  height: 11 * s,
                  borderTopWidth: Math.max(2, 3.5 * s),
                  borderRadius: 10 * s,
                },
              ]}
            />
          </View>
        )}

        {/* Mouth */}
        {variant === 'Scroll Explorer' ? (
          <Text
            style={[
              styles.wavyMouth,
              { bottom: 18 * s, fontSize: 18 * s },
            ]}
          >
            ≈
          </Text>
        ) : variant === 'Soft Launcher' ? (
          <View
            style={[
              styles.curiousMouth,
              {
                bottom: 22 * s,
                width: 14 * s,
                height: 10 * s,
                borderRadius: 7 * s,
                borderWidth: Math.max(1.5, 2.5 * s),
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.smileMouth,
              {
                bottom: 22 * s,
                width: 34 * s,
                height: 16 * s,
                borderBottomWidth: Math.max(2, 3.5 * s),
                borderRadius: 16 * s,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  body: {
    backgroundColor: COLORS.pink,
    borderColor: COLORS.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-4deg' }],
    shadowColor: '#e2a3c4',
    shadowOpacity: 0.65,
    elevation: 5,
    position: 'relative',
  },
  crease: {
    position: 'absolute',
    borderBottomColor: '#cb1c6e',
  },
  cheek: {
    position: 'absolute',
    backgroundColor: '#ff7db6',
    opacity: 0.75,
  },
  eyesRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  archEye: {
    borderTopColor: COLORS.darkPurple,
  },
  sleepyEye: {
    borderBottomColor: COLORS.darkPurple,
  },
  dotEye: {
    backgroundColor: COLORS.darkPurple,
  },
  starEye: {
    color: COLORS.yellow,
    fontWeight: '900',
    textShadowColor: COLORS.darkPurple,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  symbolEye: {
    color: COLORS.darkPurple,
    fontWeight: '900',
  },
  smileMouth: {
    position: 'absolute',
    borderBottomColor: COLORS.darkPurple,
  },
  curiousMouth: {
    position: 'absolute',
    borderColor: COLORS.darkPurple,
    backgroundColor: '#ff8cc2',
  },
  wavyMouth: {
    position: 'absolute',
    color: COLORS.darkPurple,
    fontWeight: '900',
  },
  crown: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.darkPurple,
    transform: [{ rotate: '-6deg' }],
  },
  crownText: {
    color: COLORS.darkPurple,
    fontWeight: '900',
  },
  sproutBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#dff6e9',
    borderColor: COLORS.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '8deg' }],
  },
  moonBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: COLORS.purple,
    borderColor: COLORS.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '10deg' }],
  },
  sparkBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '10deg' }],
  },
  sparkText: {
    color: COLORS.darkPurple,
    fontWeight: '900',
  },
  dizzyBadge: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#fff0d8',
    borderColor: COLORS.darkPurple,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '8deg' }],
  },
  dizzyBadgeText: {
    color: COLORS.orange,
    fontWeight: '900',
  },
});
