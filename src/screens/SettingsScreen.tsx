import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  onToast: (message: string) => void;
};

function SettingRow({
  iconName,
  title,
  detail,
  initialChecked = false,
  onChange,
}: {
  iconName: string;
  title: string;
  detail: string;
  initialChecked?: boolean;
  onChange: () => void;
}) {
  const [enabled, setEnabled] = useState(initialChecked);
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon name={iconName} size={18} color={COLORS.purple} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDetail}>{detail}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggle, enabled && styles.toggleOn]}
        onPress={() => {
          setEnabled((v) => !v);
          onChange();
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} />
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen({ onToast }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.eyebrow}>CONTROL CENTER</Text>
      <Text style={styles.heading}>
        Your rules, your reset<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.subtitle}>
        ROT works around your life. Never the other way around.
      </Text>

      {/* Settings List */}
      <View style={styles.settingsList}>
        <SettingRow
          iconName="bell"
          title="Daily gentle nudge"
          detail="A reminder when you are nearing your limit"
          initialChecked
          onChange={() => onToast('Reminder preference saved.')}
        />
        <SettingRow
          iconName="shield-check"
          title="Private mode"
          detail="Keep your progress and profile visible only to you"
          initialChecked
          onChange={() => onToast('You are private by default.')}
        />
        <SettingRow
          iconName="clock"
          title="Weekend breathing room"
          detail="Give yourself a little more space on Saturdays and Sundays"
          onChange={() => onToast('Weekend breathing room enabled.')}
        />
      </View>

      {/* Note */}
      <View style={styles.note}>
        <Icon name="lock" size={18} color={COLORS.purple} />
        <View style={{ flex: 1 }}>
          <Text style={styles.noteTitle}>
            We do not need your Instagram password.
          </Text>
          <Text style={styles.noteDesc}>
            ROT uses estimated device signals, not your account, messages, or the
            content you watch.
          </Text>
        </View>
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
    marginBottom: 20,
    lineHeight: 20,
  },

  // Settings List
  settingsList: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8f0',
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  settingDetail: { fontSize: 11, color: COLORS.muted, marginTop: 3, lineHeight: 16 },

  // Toggle
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d9cedf',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: COLORS.pink,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  toggleKnobOn: {
    transform: [{ translateX: 18 }],
  },

  // Note
  note: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    padding: 18,
    backgroundColor: COLORS.lavender,
    borderRadius: RADIUS.lg,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  noteDesc: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 16,
  },
});
