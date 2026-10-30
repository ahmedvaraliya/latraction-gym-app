import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function AttendanceScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerLogs();
  }, []);

  const fetchOwnerLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, members(name, phone)')
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.log('Error owner logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const checkIn = new Date(item.check_in_time);
    const checkOut = item.check_out_time ? new Date(item.check_out_time) : null;

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.memberName}>{item.members?.name || 'Unknown Member'}</Text>
          <View style={[styles.badge, { backgroundColor: checkOut ? '#34C75920' : '#FF3B3020' }]}>
            <Text style={[styles.badgeText, { color: checkOut ? COLORS.success : COLORS.primary }]}>
              {checkOut ? 'COMPLETED' : 'ACTIVE IN GYM'}
            </Text>
          </View>
        </View>
        <Text style={styles.phoneText}>📞 +91 {item.members?.phone}</Text>
        <View style={styles.timeBox}>
          <Text style={styles.timeText}>In: {checkIn.toLocaleTimeString()} ({checkIn.toLocaleDateString()})</Text>
          <Text style={styles.timeText}>Out: {checkOut ? checkOut.toLocaleTimeString() : 'Still Working Out...'}</Text>
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
        <Text style={styles.title}>GYM ATTENDANCE LOGS</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No attendance logs found.</Text>}
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
  card: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusMd, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  memberName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  phoneText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '900' },
  timeBox: { backgroundColor: COLORS.inputBackground, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  timeText: { fontSize: 12, color: COLORS.textSecondary, marginVertical: 2 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});