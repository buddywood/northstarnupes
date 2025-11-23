import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';

type Screen = 'home' | 'shop' | 'events' | 'steward-marketplace' | 'profile';

interface BottomTabBarProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export default function BottomTabBar({
  currentScreen,
  onScreenChange,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { 
      id: 'home' as Screen, 
      label: 'Home', 
      imageSource: require('../assets/icon.png'),
      iconName: null,
      isCenter: false
    },
    { 
      id: 'events' as Screen, 
      label: 'Events', 
      iconName: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
      activeIconName: 'calendar' as keyof typeof Ionicons.glyphMap,
      isCenter: false
    },
    { 
      id: 'shop' as Screen, 
      label: 'Shop', 
      iconName: 'bag-outline' as keyof typeof Ionicons.glyphMap,
      activeIconName: 'bag' as keyof typeof Ionicons.glyphMap,
      isCenter: true
    },
    { 
      id: 'steward-marketplace' as Screen, 
      label: 'Steward', 
      iconName: 'diamond-outline' as keyof typeof Ionicons.glyphMap,
      activeIconName: 'diamond' as keyof typeof Ionicons.glyphMap,
      isCenter: false
    },
    { 
      id: 'profile' as Screen, 
      label: 'Profile', 
      iconName: 'person-outline' as keyof typeof Ionicons.glyphMap,
      activeIconName: 'person' as keyof typeof Ionicons.glyphMap,
      isCenter: false
    },
  ];

  return (
    <View 
      style={[styles.container, { paddingBottom: insets.bottom }]}
      pointerEvents="box-none"
    >
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.id;
        const isCenter = tab.isCenter;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isCenter && styles.centerTab]}
            onPress={() => onScreenChange(tab.id)}
            activeOpacity={0.7}
          >
            {isCenter ? (
              <View style={styles.centerTabWrapper}>
                <View style={[
                  styles.centerTabIconContainer,
                  isActive && styles.centerTabIconContainerActive
                ]}>
                  {tab.iconName ? (
                    <Ionicons
                      name={isActive && tab.activeIconName ? tab.activeIconName : tab.iconName}
                      size={28}
                      color={COLORS.white}
                      style={styles.icon}
                    />
                  ) : null}
                </View>
                <Text style={[styles.label, styles.centerLabel]}>
                  {tab.label}
                </Text>
              </View>
            ) : (
              <>
                {tab.imageSource ? (
                  <Image
                    source={tab.imageSource}
                    style={[
                      styles.iconImage,
                      isActive && styles.iconImageActive,
                    ]}
                    resizeMode="contain"
                  />
                ) : tab.iconName ? (
                  <Ionicons
                    name={isActive && tab.activeIconName ? tab.activeIconName : tab.iconName}
                    size={24}
                    color={isActive ? COLORS.crimson : COLORS.midnightNavy}
                    style={[styles.icon, { opacity: isActive ? 1 : 0.6 }]}
                  />
                ) : null}
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {tab.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    minHeight: 60,
  },
  centerTab: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerTabIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  centerTabIconContainerActive: {
    shadowOpacity: 0.5,
    elevation: 16,
  },
  icon: {
    marginBottom: 4,
  },
  iconImage: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconImageActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    fontWeight: '500',
  },
  centerLabel: {
    color: COLORS.midnightNavy,
    opacity: 0.8,
    fontWeight: '600',
    marginTop: 0,
  },
  labelActive: {
    color: COLORS.crimson,
    opacity: 1,
    fontWeight: '600',
  },
});

