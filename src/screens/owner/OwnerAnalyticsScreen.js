import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function OwnerAnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    paidMembers: 0,
    pendingMembers: 0,
    totalRevenue: 0,
    totalCheckins: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch Members
      const { data: membersData, error: membersError } = await supabase.from('members').select('*');
      if (membersError) throw membersError;

      // Fetch Attendance
      const { data: attendanceData, error: attendanceError } = await supabase.from('attendance').select('*');
      if (attendanceError) throw attendanceError;

      const totalMembers = membersData.length;
      let paidMembers = 0;
      let pendingMembers = 0;
      let totalRevenue = 0;

      membersData.forEach((m) => {
        if (m.fee_status === 'PAID') {
          paidMembers++;
          totalRevenue += Number(m.fee_amount || 1500);
        } else {
          pendingMembers++;
        }
      });

      setStats({
        totalMembers,
        paidMembers,
        pendingMembers,
        totalRevenue,
        totalCheckins: attendanceData.length,
      });

      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log('Error fetching analytics:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GYM REVENUE & ANALYTICS</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Revenue Hero Card */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>TOTAL COLLECTED REVENUE</Text>
        <Text style={styles.revenueAmount}>₹ {stats.totalRevenue}</Text>
        <Text style={styles.revenueSub}>Based on verified active fee payments</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.gridRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{stats.totalMembers}</Text>
          <Text style={styles.metricLabel}>Total Members</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: COLORS.success }]}>{stats.paidMembers}</Text>
          <Text style={styles.metricLabel}>Fees Paid</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: COLORS.primary }]}>{stats.pendingMembers}</Text>
          <Text style={styles.metricLabel}>Fees Pending</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#007AFF' }]}>{stats.totalCheckins}</Text>
          <Text style={styles.metricLabel}>Total Check-ins</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  revenueCard: {
    backgroundColor: '#1E1E26',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  revenueLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  revenueAmount: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '900', marginVertical: 8, letterSpacing: 1 },
  revenueSub: { color: COLORS.textSecondary, fontSize: 11 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: 18,
    alignItem: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  metricValue: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4 },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textAlign: 'center' },
});