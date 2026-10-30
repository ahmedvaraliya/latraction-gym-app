import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

const { width } = Dimensions.get('window');

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Popup State
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (title, msg) => {
    setPopupTitle(title);
    setPopupMsg(msg);
    setPopupVisible(true);
  };

  const handleAdminLogin = () => {
    if (!email || !password) {
      showAlert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    // Hardcoded single admin credentials (Aap yahan apni marzi ki email/password set kar sakte hain)
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === 'ahmedvaraliya38@gmail.com' && password === 'ahmed4t1m22@') {
        navigation.replace('OwnerDashboard');
      } else {
        showAlert('Access Denied', 'Invalid admin email or password.');
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />

      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>🛡️</Text>
        </View>

        <Text style={styles.title}>ADMIN PORTAL</Text>
        <Text style={styles.subtitle}>Authorized Owner Access Only</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ADMIN EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@latraction.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAdminLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>LOGIN AS ADMIN</Text>
          )}
        </TouchableOpacity>

        {/* Back to Member Login */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')} 
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>
            Are you a member? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Member Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => setPopupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    width: width,
    height: 300,
    backgroundColor: COLORS.primaryGlow,
    borderRadius: 150,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222228',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF3B3040',
  },
  logoBadgeText: { fontSize: 26 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
});