import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // Custom Popup State
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (title, msg) => {
    setPopupTitle(title);
    setPopupMsg(msg);
    setPopupVisible(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!phone || phone.length < 10) {
      showAlert('Invalid Input', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .single();

      setLoading(false);

      if (error || !data) {
        showAlert('Member Not Found', 'No active account found with this phone number. Please Sign Up first.');
      } else {
        navigation.replace('MemberDashboard', { memberData: data });
      }
    } catch (err) {
      setLoading(false);
      showAlert('Error', 'Network connection failed. Please try again.');
    }
  };

  if (appLoading) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.brandingTitle}>LATRACTION</Text>
        <Text style={styles.brandingSubtitle}>GYM MANAGEMENT</Text>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />

      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>🏋️‍♂️</Text>
        </View>

        <Text style={styles.title}>LATRACTION</Text>
        <Text style={styles.subtitle}>Enter registered mobile number to access gym dashboard</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>VERIFY & CONTINUE</Text>
          )}
        </TouchableOpacity>

        {/* Signup Link */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Signup')} 
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            New Member? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign Up here</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>Powered by Latraction Tech System</Text>

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
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandingTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  brandingSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    letterSpacing: 6,
    marginTop: 5,
  },
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
    alignItems: 'center',
    elevation: 8,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222228',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FF3B3040',
  },
  logoBadgeText: { fontSize: 28 },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    height: 54,
  },
  countryCode: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.fontLg,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSm,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    color: COLORS.textMuted,
    fontSize: SIZES.fontSm,
  },
});