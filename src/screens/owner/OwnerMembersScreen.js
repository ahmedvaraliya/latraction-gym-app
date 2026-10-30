import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function OwnerMembersScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (title, msg) => {
    setPopupTitle(title);
    setPopupMsg(msg);
    setPopupVisible(true);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message || 'Failed to load members.');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(
        (m) =>
          m.name.toLowerCase().includes(text.toLowerCase()) ||
          m.phone.includes(text)
      );
      setFilteredMembers(filtered);
    }
  };

  const toggleFeeStatus = async (memberId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
      const { error } = await supabase
        .from('members')
        .update({ fee_status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      const updated = members.map((m) =>
        m.id === memberId ? { ...m, fee_status: newStatus } : m
      );
      setMembers(updated);
      setFilteredMembers(updated);
      showAlert('UPDATED ⚡', `Fee status changed to ${newStatus}`);
    } catch (err) {
      showAlert('Error', err.message || 'Failed to update fee status.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ADMIN MEMBER MATRIX</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search member by name or phone..."
        placeholderTextColor={COLORS.textMuted}
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {item.name ? item.name.charAt(0).toUpperCase() : 'M'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberMeta}>+91 {item.phone}</Text>
                <Text style={styles.memberMeta}>Plan: {item.plan_type || 'Monthly'} (₹{item.fee_amount || 1500})</Text>
              </View>

              {/* Fee Status Toggle */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  { backgroundColor: item.fee_status === 'PAID' ? '#34C75920' : '#FF3B3020' },
                ]}
                onPress={() => toggleFeeStatus(item.id, item.fee_status)}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.fee_status === 'PAID' ? COLORS.success : COLORS.primary },
                  ]}
                >
                  {item.fee_status || 'PENDING'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No members found.</Text>
          }
        />
      )}

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => setPopupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 15 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  searchBar: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginBottom: 15,
  },
  memberCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: COLORS.primary },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#26262E', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  memberName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  memberMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  statusText: { fontSize: 11, fontWeight: '900' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});