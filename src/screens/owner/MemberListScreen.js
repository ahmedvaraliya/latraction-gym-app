import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function MemberListScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Direct Message Modal States
  const [msgModalVisible, setMsgModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);

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
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (err) {
      console.log('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search filter logic
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

  const handleSendPersonalMessage = async () => {
    if (!msgTitle.trim() || !msgBody.trim()) {
      showAlert('Missing Fields', 'Please enter title and message.');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('notifications').insert([
        {
          title: msgTitle,
          message: msgBody,
          member_id: selectedMember.id, // Specific member ID
        },
      ]);

      if (error) throw error;

      setSending(false);
      setMsgModalVisible(false);
      setMsgTitle('');
      setMsgBody('');
      showAlert('SUCCESS 🚀', `Personal message sent to ${selectedMember.name} successfully!`);
    } catch (err) {
      setSending(false);
      showAlert('Error', err.message);
    }
  };

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberMeta}>📞 +91 {item.phone}</Text>
          <Text style={styles.memberMeta}>Plan: {item.plan_type} | ₹{item.fee_amount}</Text>
        </View>

        {/* Direct Message Icon Button */}
        <TouchableOpacity
          style={styles.msgIconBtn}
          onPress={() => {
            setSelectedMember(item);
            setMsgModalVisible(true);
          }}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MEMBERS DIRECTORY</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Members List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMemberItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No members found.</Text>}
        />
      )}

      {/* Send Personal Message Modal */}
      <Modal transparent animationType="slide" visible={msgModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SEND MESSAGE TO {selectedMember?.name?.toUpperCase()}</Text>
            
            <Text style={styles.label}>MESSAGE TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fee Reminder / Diet Update"
              placeholderTextColor={COLORS.textMuted}
              value={msgTitle}
              onChangeText={setMsgTitle}
            />

            <Text style={styles.label}>MESSAGE BODY</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Type your personal message here..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={msgBody}
              onChangeText={setMsgBody}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.inputBackground }]}
                onPress={() => setMsgModalVisible(false)}
              >
                <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleSendPersonalMessage}
                disabled={sending}
              >
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: COLORS.textPrimary, fontWeight: '950' }}>Send 🚀</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomPopup visible={popupVisible} title={popupTitle} message={popupMsg} onClose={() => setPopupVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 13, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMd, paddingHorizontal: 14, marginBottom: 15 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, paddingVertical: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  memberCard: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusMd, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  memberInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#26262E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  avatarText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  memberName: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  memberMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  msgIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF3B3015', borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusLg, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 18, textAlign: 'center', letterSpacing: 1 },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMd, padding: 12, color: COLORS.textPrimary, fontSize: 14, marginBottom: 15 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 },
});