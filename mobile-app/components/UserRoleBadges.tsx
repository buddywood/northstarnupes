import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

interface UserRoleBadgesProps {
  is_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Match web version colors
const roleColors: Record<string, string> = {
  MEMBER: '#F7F4E9', // cream
  SELLER: '#8A0C13', // crimson
  PROMOTER: '#475569', // slate-600
  STEWARD: '#C6A664', // aurora-gold
};


export default function UserRoleBadges({
  is_member,
  is_seller,
  is_promoter,
  is_steward,
  size = 'sm',
}: UserRoleBadgesProps) {
  const sizeStyles = {
    sm: { width: 20, height: 20, fontSize: 9 },
    md: { width: 24, height: 24, fontSize: 11 },
    lg: { width: 32, height: 32, fontSize: 14 },
  };

  const badgeSize = sizeStyles[size];
  const badges = [];

  if (is_member) {
    badges.push(
      <View 
        key="member" 
        style={[
          styles.badge, 
          badgeSize, 
          { 
            backgroundColor: roleColors.MEMBER,
            borderWidth: 1,
            borderColor: '#D1D5DB',
          }
        ]}
      />
    );
  }

  if (is_seller) {
    badges.push(
      <View key="seller" style={[styles.badge, badgeSize, { backgroundColor: roleColors.SELLER }]} />
    );
  }

  if (is_steward) {
    badges.push(
      <View key="steward" style={[styles.badge, badgeSize, { backgroundColor: roleColors.STEWARD }]} />
    );
  }

  if (is_promoter) {
    badges.push(
      <View key="promoter" style={[styles.badge, badgeSize, { backgroundColor: roleColors.PROMOTER }]} />
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {badges}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
});

