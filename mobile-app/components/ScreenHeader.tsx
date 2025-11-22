import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
  };
  showSearch?: boolean;
  onSearchPress?: () => void;
  showUser?: boolean;
  onUserPress?: () => void;
}

export default function ScreenHeader({
  title,
  onBack,
  rightAction,
  showSearch = false,
  onSearchPress,
  showUser = true,
  onUserPress,
}: ScreenHeaderProps) {
  const { isGuest, user } = useAuth();

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      {/* Left Section - Back Button */}
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center Section - Title */}
      <View style={styles.centerSection}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right Section - Actions */}
      <View style={styles.rightSection}>
        {showSearch && onSearchPress && (
          <TouchableOpacity
            onPress={onSearchPress}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.midnightNavy}
            />
          </TouchableOpacity>
        )}
        
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            {rightAction.icon ? (
              <Ionicons
                name={rightAction.icon}
                size={20}
                color={COLORS.midnightNavy}
              />
            ) : (
              <Text style={styles.actionText}>{rightAction.label}</Text>
            )}
          </TouchableOpacity>
        )}

        {showUser && !isGuest && onUserPress && (
          <TouchableOpacity
            onPress={onUserPress}
            style={styles.userAvatar}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    minHeight: 56,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.frostGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.midnightNavy,
    fontWeight: '600',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    textAlign: 'center',
  },
  rightSection: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.frostGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
  },
  userAvatar: {
    width: 40,
    height: 40,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

