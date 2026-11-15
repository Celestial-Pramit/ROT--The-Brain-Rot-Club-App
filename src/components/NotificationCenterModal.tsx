import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import {
  NotificationInboxItem,
  NotificationStatusSnapshot,
} from '../constants/types';
import { getLocalDateKey } from '../utils/domainLogic';
import Icon from './Icon';

type Props = {
  visible: boolean;
  items: NotificationInboxItem[];
  highlightedUnreadIds: string[];
  notificationStatus: NotificationStatusSnapshot;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
};

function formatNotificationTime(item: NotificationInboxItem): string {
  const todayKey = getLocalDateKey();
  const dateObj = new Date(item.createdAtMs);
  const timeText = Number.isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayLabel = item.dateKey === todayKey ? 'Today' : item.dateKey || 'Recent';
  return timeText ? `${dayLabel} · ${timeText}` : dayLabel;
}

function getCategoryLabel(item: NotificationInboxItem): string {
  if (item.notificationId === 1999) return 'TEST NUDGE';
  if (item.notificationId === 1006) return 'ACHIEVEMENT';
  if (item.channelId === 'rot_scheduled_reminders') return 'REMINDER';
  return 'GENTLE NUDGE';
}

export default function NotificationCenterModal({
  visible,
  items,
  highlightedUnreadIds,
  notificationStatus,
  onClearAll,
  onOpenSettings,
  onClose,
}: Props) {
  const highlightedSet = new Set(highlightedUnreadIds);
  const hasPermissionIssue = notificationStatus.statusCode !== 'allowed';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>NOTIFICATION CENTER</Text>
              <Text style={styles.title}>Your ROT updates</Text>
            </View>
            {items.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={onClearAll}
                activeOpacity={0.75}
                accessibilityLabel="Clear notification history"
              >
                <Text style={styles.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityLabel="Close notification center"
            >
              <Icon name="x" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {hasPermissionIssue && (
            <View style={styles.warningCard}>
              <Icon name="alert-circle" size={15} color={COLORS.orange} />
              <Text style={styles.warningText}>
                {notificationStatus.statusCode === 'permission_required'
                  ? 'Android notification permission is off.'
                  : notificationStatus.statusCode === 'channel_disabled'
                  ? 'A ROT notification channel is muted in Android settings.'
                  : 'ROT notifications are disabled in Android settings.'}
              </Text>
              <TouchableOpacity
                style={styles.settingsChip}
                onPress={() => {
                  onClose();
                  onOpenSettings();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.settingsChipText}>Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Icon name="bell" size={22} color={COLORS.purple} />
              </View>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySub}>
                Gentle scroll nudges, daily reminders, and achievement alerts delivered to this device will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item) => {
                const isJustRead = highlightedSet.has(item.id);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      isJustRead && styles.itemCardUnread,
                    ]}
                  >
                    <View style={styles.itemMetaRow}>
                      <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>
                          {getCategoryLabel(item)}
                        </Text>
                      </View>
                      {isJustRead && (
                        <View style={styles.newChip}>
                          <Text style={styles.newChipText}>NEW</Text>
                        </View>
                      )}
                      <Text style={styles.timeText}>
                        {formatNotificationTime(item)}
                      </Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody}>{item.body}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,10,54,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '82%',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.xxl,
    borderWidth: 2,
    borderColor: COLORS.darkPurple,
    padding: 20,
    shadowColor: '#29104c',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.pink,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#eee7fa',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fff4e5',
    borderWidth: 1,
    borderColor: '#ffd8a8',
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  settingsChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: COLORS.purple,
  },
  settingsChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  listScroll: {
    maxHeight: 400,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 13,
  },
  itemCardUnread: {
    borderColor: COLORS.pink,
    backgroundColor: '#fff7fb',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryChip: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: '#eee7fa',
  },
  categoryChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  newChip: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: COLORS.pink,
  },
  newChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  timeText: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  itemBody: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 3,
  },
});
