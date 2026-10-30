import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function OwnerDashboard({ navigation }) {
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGymStats();
  }, []);

  const fetchGymStats = async () => {
    try {
      const { data, error } = await supabase.from('members').select('status');
      if (!error && data) {
        const total = data.length;
        const active = data.filter((m) => m.status === 'active').length;
        setStats({ totalMembers: total, activeMembers: active });
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* Header with Title & Lock/Logout Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>LATRACTION</Text>
          <Text style={styles.subtitle}>Owner Control Center ⚡</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>🔒</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards Matrix */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('MemberList')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardLabel}>TOTAL MEMBERS ➔</Text>
          <Text style={styles.cardValue}>{loading ? '...' : stats.totalMembers}</Text>
        </TouchableOpacity>

        <View style={[styles.card, { borderColor: COLORS.success }]}>
          <Text style={[styles.cardLabel, { color: COLORS.success }]}>ACTIVE MEMBERS</Text>
          <Text style={[styles.cardValue, { color: COLORS.success }]}>
            {loading ? '...' : stats.activeMembers}
          </Text>
        </View>
      </View>

      {/* Quick Actions Header */}
      <Text style={styles.sectionTitle}>MANAGEMENT MATRIX</Text>

      {/* 1. Scan Member QR Pass (Camera Scanner) */}
      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: COLORS.primary, backgroundColor: '#FF3B3010' }]}
        onPress={() => navigation.navigate('ScanPass')}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { borderColor: COLORS.primary }]}>
          <Text style={styles.actionBtnIcon}>📷</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.actionBtnTitle, { color: COLORS.primary }]}>Scan Member QR Pass</Text>
          <Text style={styles.actionBtnSub}>Automate gate entry & attendance check-in</Text>
        </View>
        <Text style={[styles.arrowText, { color: COLORS.primary }]}>→</Text>
      </TouchableOpacity>

      {/* 2. Add New Member */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('AddMember')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Text style={styles.actionBtnIcon}>➕</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.actionBtnTitle}>Add New Member</Text>
          <Text style={styles.actionBtnSub}>Register a new gym client & plan</Text>
        </View>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      {/* 3. Members Directory & Direct Chat */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('MemberList')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Text style={styles.actionBtnIcon}>👥</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.actionBtnTitle}>Members Directory & Chat</Text>
          <Text style={styles.actionBtnSub}>Search users & send direct messages</Text>
        </View>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      {/* 4. Bulk Broadcast Center */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('OwnerBroadcast')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Text style={styles.actionBtnIcon}>📢</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.actionBtnTitle}>Bulk Broadcast Center</Text>
          <Text style={styles.actionBtnSub}>Push global announcements to all users</Text>
        </View>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      {/* 5. Attendance Logs */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('Attendance')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Text style={styles.actionBtnIcon}>📊</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.actionBtnTitle}>Attendance Logs</Text>
          <Text style={styles.actionBtnSub}>Monitor live & past check-in sessions</Text>
        </View>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      {/* 6. Fee & Payments */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('Payments')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Text style={styles.actionBtnIcon}>💳</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.actionBtnTitle}>Fee & Payments Tracker</Text>
          <Text style={styles.actionBtnSub}>Track dues, renewals & fee status</Text>
        </View>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20, paddingBottom: 60 },
  header: { marginTop: 35, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  settingsIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 1 },
  cardValue: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginTop: 8 },
  sectionTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: '900', marginBottom: 12, letterSpacing: 1.5 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.inputBackground, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionBtnIcon: { fontSize: 20 },
  actionBtnTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  actionBtnSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, fontWeight: '500' },
  arrowText: { color: COLORS.textMuted, fontSize: 18, fontWeight: 'bold' },
});