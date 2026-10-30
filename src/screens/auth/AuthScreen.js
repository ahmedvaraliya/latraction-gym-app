import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login & Signup
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planType, setPlanType] = useState('Monthly');
  const [loading, setLoading] = useState(false);

  // Secret 5-Tap Admin Access State
  const [tapCount, setTapCount] = useState(0);

  // Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (title, msg) => {
    setPopupTitle(title);
    setPopupMsg(msg);
    setPopupVisible(true);
  };

  const handleSecretAdminAccess = () => {
    setTapCount(prev => {
      const nextCount = prev + 1;
      if (nextCount >= 5) {
        // 5th tap opens Admin Login securely
        navigation.navigate('AdminLogin');
        return 0;
      }
      return nextCount;
    });
  };

  const handleAuthAction = async () => {
    if (!phone || phone.length < 10) {
      showAlert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!isLogin && !name.trim()) {
      showAlert('Missing Name', 'Please enter your full name for registration.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('phone', phone)
          .single();

        setLoading(false);

        if (error || !data) {
          showAlert('Not Found', 'No account found with this phone number. Please Sign Up first.');
        } else {
          navigation.replace('MemberDashboard', { memberData: data });
        }
      } else {
        // --- SIGNUP FLOW ---
        const { data: existingUser } = await supabase
          .from('members')
          .select('*')
          .eq('phone', phone)
          .single();

        if (existingUser) {
          setLoading(false);
          showAlert('Exists', 'This phone number is already registered. Please login.');
          setIsLogin(true);
          return;
        }

        const fee = planType === 'Monthly' ? 1500 : planType === 'Quarterly' ? 4000 : 12000;

        const { data: newMember, error: insertError } = await supabase
          .from('members')
          .insert([
            {
              name,
              phone,
              plan_type: planType,
              fee_amount: fee,
              status: 'active',
              joining_date: new Date().toISOString().split('T')[0],
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        setLoading(false);
        showAlert('SUCCESS ⚡', 'Welcome to Latraction! Account created successfully.');
        navigation.replace('MemberDashboard', { memberData: newMember });
      }
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topGlow} />

      <View style={styles.card}>
        {/* Brand Header with Secret 5-Tap on Logo/Title */}
        <TouchableOpacity onPress={handleSecretAdminAccess} activeOpacity={1}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.title}>LATRACTION</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>
          {isLogin ? 'Access your fitness portal & check-ins' : 'Start your transformation journey'}
        </Text>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, isLogin && styles.tabActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>LOGIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, !isLogin && styles.tabActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        {!isLogin && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={styles.phoneInputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="10-digit number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {!isLogin && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>MEMBERSHIP PLAN</Text>
            <View style={styles.planRow}>
              {['Monthly', 'Quarterly', 'Yearly'].map((plan) => (
                <TouchableOpacity
                  key={plan}
                  style={[styles.planChip, planType === plan && styles.planChipActive]}
                  onPress={() => setPlanType(plan)}
                >
                  <Text style={[styles.planChipText, planType === plan && styles.planChipTextActive]}>
                    {plan}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Submit Action Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuthAction}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'ENTER PORTAL' : 'CREATE ACCOUNT'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>Powered by Latraction Fitness Matrix</Text>

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => setPopupVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topGlow: {
    position: 'absolute',
    top: -80,
    width: width,
    height: 280,
    backgroundColor: COLORS.primaryGlow,
    borderRadius: 140,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1C1C22',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF3B3050',
  },
  logoEmoji: { fontSize: 24 },
  title: {
    fontSize: 24,
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
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  formGroup: { marginBottom: 16 },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 14,
  },
  countryCode: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planChip: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  planChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  planChipTextActive: {
    color: COLORS.textPrimary,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerText: {
    marginTop: 25,
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});