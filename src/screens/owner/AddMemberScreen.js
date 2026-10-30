import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function AddMemberScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planType, setPlanType] = useState('Monthly');
  const [feeAmount, setFeeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!name || !phone || !feeAmount) {
      Alert.alert('Missing Details', 'Please fill in all the required fields.');
      return;
    }

    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Insert Member in Supabase
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([
          {
            name,
            phone,
            plan_type: planType,
            fee_amount: parseFloat(feeAmount),
            status: 'active',
          },
        ])
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. Auto-create Payment Entry
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error: paymentError } = await supabase.from('payments').insert([
        {
          member_id: member.id,
          amount: parseFloat(feeAmount),
          due_date: nextMonth.toISOString().split('T')[0],
          status: 'paid',
        },
      ]);

      if (paymentError) console.log('Payment log error:', paymentError);

      Alert.alert('Success 🎉', `${name} has been added to Latraction Gym!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to register member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Header */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>NEW MEMBER</Text>
      <Text style={styles.subtitle}>Register a new client to Latraction Gym</Text>

      {/* Inputs */}
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>MOBILE NUMBER</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit number"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>MEMBERSHIP PLAN</Text>
        <View style={styles.planContainer}>
          {['Monthly', 'Quarterly', 'Yearly'].map((plan) => (
            <TouchableOpacity
              key={plan}
              style={[styles.planChip, planType === plan && styles.planChipActive]}
              onPress={() => setPlanType(plan)}
            >
              <Text
                style={[
                  styles.planChipText,
                  planType === plan && styles.planChipTextActive,
                ]}
              >
                {plan}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>FEE AMOUNT (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1500"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
          value={feeAmount}
          onChangeText={setFeeAmount}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.btnDisabled]}
        onPress={handleAddMember}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textPrimary} />
        ) : (
          <Text style={styles.saveBtnText}>REGISTER MEMBER</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  backBtn: { marginTop: 40, marginBottom: 15 },
  backBtnText: { color: COLORS.primary, fontSize: SIZES.fontLg, fontWeight: '700' },
  title: { fontSize: SIZES.fontTitle, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2 },
  subtitle: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginBottom: 30 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: SIZES.fontSm, color: COLORS.textMuted, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.cardBackground,
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
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSm,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  planChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  planChipText: { color: COLORS.textSecondary, fontWeight: '700' },
  planChipTextActive: { color: COLORS.textPrimary },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 40,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, fontWeight: '800', letterSpacing: 1 },
});