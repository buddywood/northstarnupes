import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { forgotPassword } from "../lib/cognito";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";
import PasswordField from "./ui/PasswordField";
import FormCard from "./ui/FormCard";
import SectionHeader from "./ui/SectionHeader";
import Checkbox from "./ui/Checkbox";
import MenuItem from "./ui/MenuItem";

const REMEMBERED_EMAIL_KEY = "@1kappa:remembered_email";
const REMEMBER_ME_KEY = "@1kappa:remember_me";

interface ProfileScreenProps {
  onBack: () => void;
  initialMode?: "login" | "register";
  onMyEventsPress?: () => void;
}

export default function ProfileScreen({
  onBack,
  initialMode = "login",
  onMyEventsPress,
}: ProfileScreenProps) {
  const { isGuest, user, login, logout } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLogin, setIsLogin] = React.useState(initialMode === "login");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [cognitoSub, setCognitoSub] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] =
    React.useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = React.useState<
    string | null
  >(null);

  // Load remembered email on mount
  React.useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const rememberedEmail = await AsyncStorage.getItem(
          REMEMBERED_EMAIL_KEY
        );
        const rememberMePreference = await AsyncStorage.getItem(
          REMEMBER_ME_KEY
        );

        if (rememberedEmail && rememberMePreference === "true") {
          setEmail(rememberedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error loading remembered email:", error);
      }
    };

    loadRememberedEmail();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);

      // Save or clear remembered email and enable auto-login based on rememberMe preference
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, "true");
        // Store remember me flag in auth context storage too
        await AsyncStorage.setItem("@1kappa:remember_me", "true");
      } else {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem("@1kappa:remember_me");
      }

      // Login successful - auth context will update, component will re-render showing profile
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { signUp } = await import("../lib/cognito");
      const result = await signUp(email, password);
      setCognitoSub(result.userSub);
      setNeedsVerification(true);
      setError(null);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === "UsernameExistsException") {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
        setIsLogin(true);
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { confirmSignUp } = await import("../lib/cognito");
      await confirmSignUp(email, verificationCode, cognitoSub || undefined);
      setNeedsVerification(false);
      setError(null);
      // After verification, user can now log in
      setIsLogin(true);
      alert("Email verified! Please sign in with your credentials.");
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.code === "CodeMismatchException") {
        setError(
          "Invalid verification code. Please check your email and try again."
        );
      } else if (err.code === "ExpiredCodeException") {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError(err.message || "Failed to verify email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isGuest && user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={onBack} />
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
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : user.email?.[0].toUpperCase() || "U"}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{user.name || user.email}</Text>
            {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>

          <View style={styles.menuSection}>
            {user?.is_promoter && onMyEventsPress && (
              <MenuItem label="My Events" onPress={onMyEventsPress} />
            )}
            <MenuItem label="My Orders" onPress={() => {}} />
            <MenuItem label="Saved Items" onPress={() => {}} />
            <MenuItem label="Settings" onPress={() => {}} />
            <MenuItem label="Log Out" onPress={logout} variant="logout" />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={isLogin ? "Login" : "Sign Up"} onBack={onBack} />
      <SectionHeader
        title={isLogin ? "Welcome Back" : "Create Account"}
        subtitle={
          isLogin
            ? "Sign in to access your account"
            : "Join the brotherhood marketplace"
        }
        logoSource={require("../assets/icon.png")}
      />
      <View style={styles.headerDivider} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <FormCard style={styles.formCard}>
          <View style={styles.formContainer}>
            {!isLogin && (
              <TextField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            )}

            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword(!showPassword)}
              autoCapitalize="none"
            />

            {isLogin && (
              <View style={styles.rememberMeRow}>
                <Checkbox
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  label="Remember me"
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!email) {
                      setForgotPasswordMessage(
                        "Please enter your email address first"
                      );
                      return;
                    }
                    setForgotPasswordLoading(true);
                    setForgotPasswordMessage(null);
                    try {
                      await forgotPassword(email);
                      setForgotPasswordMessage(
                        "Password reset code sent! Check your email."
                      );
                    } catch (err: any) {
                      setForgotPasswordMessage(
                        err.message ||
                          "Failed to send reset code. Please try again."
                      );
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading || !email}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isLogin && forgotPasswordMessage && (
              <View style={styles.forgotPasswordMessageContainer}>
                <Text style={styles.forgotPasswordMessageText}>
                  {forgotPasswordMessage}
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {needsVerification ? (
              <>
                <TextField
                  label="Verification Code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter code from email"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <PrimaryButton
                  title="Verify Email"
                  onPress={handleVerifyEmail}
                  loading={loading}
                  loadingText="Verifying..."
                  style={styles.buttonSpacing}
                />
              </>
            ) : (
              <PrimaryButton
                title={isLogin ? "Sign In" : "Create Account"}
                onPress={isLogin ? handleLogin : handleRegister}
                loading={loading}
                loadingText={isLogin ? "Signing In..." : "Creating Account..."}
                style={styles.buttonSpacing}
              />
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.6}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </FormCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 80,
  },
  formCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
  },
  formContainer: {
    width: "100%",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  headerDivider: {
    height: 1,
    width: "100%",
    backgroundColor: COLORS.frostGray + "60",
    marginBottom: 16,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 14,
    width: "100%",
  },
  buttonSpacing: {
    marginTop: 20,
    marginBottom: 28,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#0D0D0F",
    fontWeight: "500",
    opacity: 0.85,
  },
  forgotPasswordMessageContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.auroraGold + "20",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.auroraGold,
  },
  forgotPasswordMessageText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    textAlign: "center",
  },
  switchButton: {
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  switchButtonText: {
    color: COLORS.crimson,
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
  profileSection: {
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
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
    overflow: "hidden",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
});
