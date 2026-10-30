import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function PaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (name, phone)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.log('Error fetching payments:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const markAsPaid = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('id', paymentId);

      if (error) throw error;

      Alert.alert('Success ✅', 'Payment marked as Paid!');
      fetchPayments();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update payment status.');
    }
  };

  const renderItem = ({ item }) => {
    const isPaid = item.status === 'paid';
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentInfo}>
          <Text style={styles.memberName}>{item.members?.name || 'Unknown Member'}</Text>
          <Text style={styles.memberPhone}>📞 +91 {item.members?.phone || 'N/A'}</Text>
          <Text style={styles.dueDate}>Due Date: {item.due_date}</Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.amountText}>₹{item.amount}</Text>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: isPaid ? '#34C75920' : '#FF3B3020' }]}
            onPress={() => !isPaid && markAsPaid(item.id)}
            disabled={isPaid}
          >
            <Text style={[styles.statusText, { color: isPaid ? COLORS.success : COLORS.primary }]}>
              {item.status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FEE & PAYMENTS</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No payment records found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: SIZES.fontLg, fontWeight: '700' },
  title: { fontSize: SIZES.fontLg, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  listContainer: { paddingBottom: 30 },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentInfo: { flex: 1 },
  memberName: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, fontWeight: '700' },
  memberPhone: { color: COLORS.textSecondary, fontSize: SIZES.fontSm, marginTop: 2 },
  dueDate: { color: COLORS.textMuted, fontSize: SIZES.fontSm, marginTop: 4 },
  rightSection: { alignItems: 'flex-end' },
  amountText: { color: COLORS.textPrimary, fontSize: SIZES.fontLg, fontWeight: '900', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: SIZES.fontLg },
});