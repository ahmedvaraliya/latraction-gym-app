import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';

export default function AttendanceHistoryScreen({ route, navigation }) {
  const memberId = route?.params?.memberId;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      fetchAttendanceLogs();
    }
  }, [memberId]);

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', memberId)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.log('Error fetching attendance logs:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ATTENDANCE HISTORY</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => {
            const checkIn = new Date(item.check_in_time);
            const checkOut = item.check_out_time ? new Date(item.check_out_time) : null;
            
            // Calculate duration if checked out
            let durationStr = 'In Progress...';
            if (checkOut) {
              const diffMs = checkOut - checkIn;
              const diffMins = Math.floor(diffMs / 60000);
              const hrs = Math.floor(diffMins / 60);
              const mins = diffMins % 60;
              durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
            }

            return (
              <View style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.sessionNumber}>SESSION #{logs.length - index}</Text>
                  <View style={[styles.badge, { backgroundColor: checkOut ? '#34C75920' : '#FF3B3020' }]}>
                    <Text style={[styles.badgeText, { color: checkOut ? COLORS.success : COLORS.primary }]}>
                      {checkOut ? 'COMPLETED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Check-in:</Text>
                  <Text style={styles.timeVal}>{checkIn.toLocaleString()}</Text>
                </View>

                {checkOut && (
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Check-out:</Text>
                    <Text style={styles.timeVal}>{checkOut.toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Duration:</Text>
                  <Text style={[styles.timeVal, { color: COLORS.primary, fontWeight: '900' }]}>{durationStr}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No attendance records found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  logCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sessionNumber: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '900' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeLabel: { color: COLORS.textSecondary, fontSize: 12 },
  timeVal: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});