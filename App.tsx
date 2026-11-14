import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS } from './src/constants/theme';
import { View as ViewType, Mission, DailyChest, Celebration } from './src/constants/types';
import { initialMissions, dailyItems, getBadges } from './src/constants/data';
import TodayScreen from './src/screens/TodayScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BrainrotCardScreen from './src/screens/BrainrotCardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BreakModal from './src/components/BreakModal';
import CelebrationOverlay from './src/components/CelebrationOverlay';
import Icon from './src/components/Icon';

type TabItem = {
  key: ViewType;
  icon: string;
  label: string;
};

const tabs: TabItem[] = [
  { key: 'Today', icon: 'bar-chart-2', label: 'Today' },
  { key: 'Missions', icon: 'award', label: 'Missions' },
  { key: 'Badges', icon: 'award', label: 'Badges' },
  { key: 'Leaderboard', icon: 'users', label: 'Board' },
  { key: 'Card', icon: 'cpu', label: 'Card' },
  { key: 'Settings', icon: 'settings', label: 'Settings' },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('Today');
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [breakOpen, setBreakOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [bonusXp, setBonusXp] = useState(0);
  const [dailyChest, setDailyChest] = useState<DailyChest>({
    claimed: false,
    item: dailyItems[new Date().getDate() % dailyItems.length],
  });

  // Toast animation
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (toast === '') return;
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setToast(''));
    }, 2400);

    return () => clearTimeout(timer);
  }, [toast]);

  const completedMissions = missions.filter((m) => m.done).length;
  const earnedXp = missions
    .filter((m) => m.done)
    .reduce((total, m) => total + m.reward, 0);
  const badges = getBadges(missions);

  function toggleMission(index: number) {
    const nextMissions = missions.map((m, i) =>
      i === index ? { ...m, done: !m.done } : m
    );
    setMissions(nextMissions);
    const mission = missions[index];
    if (mission.done) {
      setToast('Mission reopened. No shame, just another chance.');
      return;
    }
    const nextBadges = getBadges(nextMissions);
    const newlyUnlocked = nextBadges.find(
      (b, bi) => b.unlocked && !badges[bi].unlocked
    );
    setCelebration(
      newlyUnlocked
        ? {
            title: newlyUnlocked.name,
            detail: newlyUnlocked.description,
            reward: 'SPECIAL BADGE UNLOCKED',
            iconName: newlyUnlocked.iconName,
            kind: 'badge',
          }
        : {
            title: 'Mission complete',
            detail: mission.title,
            reward: `+${mission.reward} XP`,
            iconName: 'check',
            kind: 'mission',
          }
    );
    setToast(
      newlyUnlocked
        ? `${newlyUnlocked.name} unlocked.`
        : `+${mission.reward} XP added to your healthy brain bank.`
    );
  }

  function claimDailyChest() {
    if (dailyChest.claimed) return;
    setDailyChest((c) => ({ ...c, claimed: true }));
    setBonusXp((c) => c + 50);
    setCelebration({
      title: 'Daily chest opened',
      detail: dailyChest.item,
      reward: '+50 XP · ITEM FOUND',
      iconName: 'gift',
      kind: 'chest',
    });
  }

  function renderScreen() {
    switch (activeView) {
      case 'Today':
        return (
          <TodayScreen
            completedMissions={completedMissions}
            earnedXp={earnedXp + bonusXp}
            missions={missions}
            onMissionClick={toggleMission}
            onBreak={() => setBreakOpen(true)}
            onViewMissions={() => setActiveView('Missions')}
            chest={dailyChest}
            onClaimChest={claimDailyChest}
          />
        );
      case 'Missions':
        return (
          <MissionsScreen
            missions={missions}
            onMissionClick={toggleMission}
            earnedXp={earnedXp}
          />
        );
      case 'Badges':
        return <BadgesScreen badges={badges} />;
      case 'Leaderboard':
        return <LeaderboardScreen onToast={setToast} />;
      case 'Card':
        return <BrainrotCardScreen onToast={setToast} />;
      case 'Settings':
        return <SettingsScreen onToast={setToast} />;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.brandMark}>
            <Icon name="brain" size={16} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.brandName}>ROT.</Text>
            <Text style={styles.brandCaption}>The Brainrot Club</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setToast('You are all caught up. Your brain approves.')}
          >
            <Feather name="bell" size={17} color={COLORS.purple} />
          </TouchableOpacity>
          <View style={styles.xpPill}>
            <Feather name="zap" size={13} color={COLORS.pink} />
            <Text style={styles.xpText}>
              <Text style={styles.xpBold}>{284 + earnedXp + bonusXp}</Text> XP
            </Text>
          </View>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeView === tab.key;
          const pendingMissions = missions.length - completedMissions;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveView(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Feather
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? COLORS.white : '#8d7e9c'}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.key === 'Missions' && pendingMissions > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {pendingMissions}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Break Modal */}
      <BreakModal visible={breakOpen} onClose={() => setBreakOpen(false)} />

      {/* Celebration Overlay */}
      {celebration && (
        <CelebrationOverlay
          celebration={celebration}
          onClose={() => setCelebration(null)}
        />
      )}

      {/* Toast */}
      {toast !== '' && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Feather name="zap" size={14} color={COLORS.white} />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,251,241,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#eee2d4',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOpacity: 0.4,
    shadowOffset: { width: 3, height: 3 },
    elevation: 3,
    transform: [{ rotate: '-4deg' }],
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  brandCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.pink,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#553074',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 30,
    backgroundColor: COLORS.palePink,
  },
  xpText: {
    fontSize: 11,
    color: COLORS.pink,
  },
  xpBold: {
    fontWeight: '800',
  },

  // Screen container
  screenContainer: {
    flex: 1,
  },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,251,241,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#eee2d4',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.purple,
    shadowColor: '#e3bde0',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8d7e9c',
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: '22%' as any,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f9dfe9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.pink,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.pink,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 30,
    backgroundColor: COLORS.purple,
    shadowColor: '#2a1648',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
});
