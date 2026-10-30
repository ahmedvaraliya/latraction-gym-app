import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function OwnerPaymentsScreen({ navigation }) {
  const [membersPayments, setMembersPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (t, m) => {
    setPopupTitle(t);
    setPopupMsg(m);
    setPopupVisible(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('members').select('id, name, phone, plan_type, fee_amount, status');
      if (error) throw error;
      setMembersPayments(data || []);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (member) => {
    try {
      const { error } = await supabase.from('payments').insert([
        {
          member_id: member.id,
          amount: member.fee_amount || 1500,
          plan_type: member.plan_type || 'Monthly',
          status: 'paid',
        },
      ]);

      if (error) throw error;
      showAlert('SUCCESS 💳', `Payment recorded successfully for ${member.name}!`);
    } catch (err) {
      showAlert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FEE & PAYMENTS MATRIX</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={membersPayments}
            keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>📞 +91 {item.phone}</Text>
                <Text style={styles.meta}>Plan: {item.plan_type} | Dues: ₹{item.fee_amount || 1500}</Text>
              </View>
              <TouchableOpacity style={styles.payBtn} onPress={() => handleRecordPayment(item)}>
                <Text style={styles.payBtnText}>MARK PAID ⚡</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No members found.</Text>}
        />
      )}

      <CustomPopup visible={popupVisible} title={popupTitle} message={popupMsg} onClose={() => setPopupVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusMd, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  name: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  payBtn: { backgroundColor: '#34C75920', borderWidth: 1, borderColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: COLORS.success, fontWeight: '900', fontSize: 11 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});