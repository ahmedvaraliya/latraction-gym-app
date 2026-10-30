import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planType, setPlanType] = useState('Monthly');
  const [loading, setLoading] = useState(false);
  
  // Custom Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showAlert = (title, msg, success = false) => {
    setPopupTitle(title);
    setPopupMsg(msg);
    setIsSuccess(success);
    setPopupVisible(true);
  };

  const handleSignup = async () => {
    if (!name || !phone) {
      showAlert('Missing Fields', 'Please enter your name and phone number.');
      return;
    }

    if (phone.length < 10) {
      showAlert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingUser) {
        setLoading(false);
        showAlert('Account Exists', 'This phone number is already registered. Please login.');
        return;
      }

      const fee = planType === 'Monthly' ? 1500 : planType === 'Quarterly' ? 4000 : 12000;
      
      const { error } = await supabase
        .from('members')
        .insert([
          {
            name,
            phone,
            plan_type: planType,
            fee_amount: fee,
            status: 'active',
          },
        ]);

      if (error) throw error;

      setLoading(false);
      showAlert('SUCCESS 🎉', 'Account created successfully! Welcome to Latraction.', true);
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message || 'Registration failed.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>JOIN LATRACTION</Text>
        <Text style={styles.subtitle}>Create your member account</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SELECT PLAN</Text>
          <View style={styles.planContainer}>
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? <Text style={{ color: COLORS.primary }}>Login</Text></Text>
        </TouchableOpacity>
      </View>

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => {
          setPopupVisible(false);
          if (isSuccess) navigation.replace('Login');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 25 },
  formGroup: { marginBottom: 18 },
  label: { fontSize: SIZES.fontSm, color: COLORS.textMuted, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 15,
    color: COLORS.textPrimary,
    fontSize: SIZES.fontLg,
  },
  planContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  planChip: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  planChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  planChipText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  planChipTextActive: { color: COLORS.textPrimary },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: SIZES.fontSm },
});