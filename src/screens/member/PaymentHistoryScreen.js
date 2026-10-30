import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function PaymentHistoryScreen({ route, navigation }) {
  const { memberId } = route.params;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.log('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PAYMENT RECEIPTS</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.planText}>⚡ {item.plan_type} Membership</Text>
                <Text style={[styles.statusText, { color: item.status === 'paid' ? COLORS.success : COLORS.primary }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.amountText}>₹{item.amount}</Text>
              <Text style={styles.dateText}>Paid on: {new Date(item.payment_date).toLocaleDateString()}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No payment history found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 13, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  paymentCard: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  planText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  statusText: { fontSize: 11, fontWeight: '900' },
  amountText: { color: COLORS.primary, fontSize: 22, fontWeight: '900', marginVertical: 6 },
  dateText: { color: COLORS.textMuted, fontSize: 11 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});