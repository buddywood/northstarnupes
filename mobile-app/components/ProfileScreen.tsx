import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
import { useAuth } from '../lib/auth';
import ScreenHeader from './ScreenHeader';

interface ProfileScreenProps {
  onBack: () => void;
  initialMode?: 'login' | 'register';
}

export default function ProfileScreen({
  onBack,
  initialMode = 'login',
}: ProfileScreenProps) {
  const { isGuest, user, login, logout } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLogin, setIsLogin] = React.useState(initialMode === 'login');
  const [name, setName] = React.useState('');

  const handleLogin = async () => {
    // TODO: Implement actual login logic
    console.log('Login:', email, password);
    // For now, just show a placeholder
    alert('Login functionality coming soon');
  };

  const handleRegister = async () => {
    // TODO: Implement actual registration logic
    console.log('Register:', name, email, password);
    // For now, just show a placeholder
    alert('Registration functionality coming soon');
  };

  if (!isGuest && user) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Profile"
          onBack={onBack}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : user.email?.[0].toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{user.name || user.email}</Text>
            {user.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>My Orders</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Saved Items</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuItemText}>Settings</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={logout}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isLogin ? 'Login' : 'Sign Up'}
        onBack={onBack}
      />
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/stacked-logo.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Sign in to access your account'
              : 'Join the brotherhood marketplace'}
          </Text>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.midnightNavy + '60'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.midnightNavy + '60'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.midnightNavy + '60'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={isLogin ? handleLogin : handleRegister}
          >
            <Text style={styles.primaryButtonText}>
            {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 0,
    backgroundColor: COLORS.cream,
    marginTop: -64,
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  formContainer: {
    width: '100%',
    paddingTop: 16,
  },
  logo: {
    width: 300,
    height: 300,
    marginTop: 0,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  primaryButton: {
    backgroundColor: COLORS.crimson,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    padding: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.crimson,
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 18,
    color: COLORS.crimson,
    fontWeight: 'bold',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: COLORS.crimson,
  },
});

