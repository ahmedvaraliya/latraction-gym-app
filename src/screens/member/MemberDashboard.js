import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function MemberDashboard({ route, navigation }) {
  const [member, setMember] = useState(route?.params?.memberData || {});
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Hero Banner & Notifications
  const [heroOffer, setHeroOffer] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(member?.name || '');
  const [newPhone, setNewPhone] = useState(member?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(member?.avatar_url || '');
  const [uploading, setUploading] = useState(false);

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
    if (member?.id) {
      fetchMemberStats();
      checkActiveSession();
      fetchNotificationsAndHero();
    }
  }, [member]);

  const fetchNotificationsAndHero = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`member_id.is.null,member_id.eq.${member.id}`)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setNotifications(data);
        setUnreadCount(data.length);

        // Filter active offer for Hero Section (within 24 hours)
        const now = new Date();
        const activeHero = data.find(item => {
          const expiry = item.expires_at ? new Date(item.expires_at) : new Date(new Date(item.created_at).getTime() + 24 * 60 * 60 * 1000);
          return expiry > now;
        });
        setHeroOffer(activeHero || null);
      }
    } catch (err) {
      console.log('Error fetching notifications:', err);
    }
  };

  // Profile Image Picker with explicit content-type fix
  const pickImageAndUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploading(true);
        const uri = result.assets[0].uri;
        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${member.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const response = await fetch(uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const newAvatar = publicUrlData.publicUrl;

        const { error: updateError } = await supabase
          .from('members')
          .update({ avatar_url: newAvatar })
          .eq('id', member.id);

        if (updateError) throw updateError;

        setAvatarUrl(newAvatar);
        setMember({ ...member, avatar_url: newAvatar });
        setUploading(false);
        showAlert('SUCCESS 📸', 'Profile photo updated successfully and synced with admin matrix!');
      }
    } catch (err) {
      setUploading(false);
      showAlert('Error', err.message || 'Failed to upload photo.');
    }
  };

  // Live Timer logic
  useEffect(() => {
    let interval = null;
    if (activeSession && activeSession.check_in_time) {
      interval = setInterval(() => {
        const checkInTime = new Date(activeSession.check_in_time).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - checkInTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchMemberStats = async () => {
    try {
      const { data } = await supabase.from('attendance').select('*').eq('member_id', member.id);
      if (data) setAttendanceCount(data.length);
    } catch (err) { console.log(err); }
  };

  const checkActiveSession = async () => {
    try {
      const { data } = await supabase.from('attendance').select('*').eq('member_id', member.id).is('check_out_time', null).single();
      if (data) setActiveSession(data);
    } catch (err) { setActiveSession(null); }
  };

  const handleCheckIn = async () => {
    try {
      const nowISO = new Date().toISOString();
      const { data, error } = await supabase.from('attendance').insert([{ member_id: member.id, check_in_time: nowISO }]).select().single();
      if (error) throw error;
      setActiveSession(data);
      setAttendanceCount(prev => prev + 1);
      showAlert('CHECKED IN ⚡', 'Workout session started live!');
    } catch (err) { showAlert('Error', err.message); }
  };

  const handleCheckOut = async () => {
    if (!activeSession?.id) return;
    try {
      const nowISO = new Date().toISOString();
      const { error } = await supabase.from('attendance').update({ check_out_time: nowISO }).eq('id', activeSession.id);
      if (error) throw error;
      setActiveSession(null);
      showAlert('CHECKED OUT 🛑', 'Session saved successfully.');
    } catch (err) { showAlert('Error', err.message); }
  };

  const handleUpdateProfile = async () => {
    if (!newName || !newPhone) {
      showAlert('Error', 'Fields cannot be empty.');
      return;
    }
    try {
      const { error } = await supabase.from('members').update({ name: newName, phone: newPhone }).eq('id', member.id);
      if (error) throw error;
      setMember({ ...member, name: newName, phone: newPhone });
      setEditModalVisible(false);
      showAlert('SUCCESS', 'Profile updated successfully and synced to admin!');
    } catch (err) { showAlert('Error', err.message); }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImageAndUpload} style={styles.profileBadgeContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileBadge}>
              <Text style={styles.profileInitial}>{member?.name ? member.name.charAt(0).toUpperCase() : 'M'}</Text>
            </View>
          )}
          {uploading && <View style={styles.uploadingOverlay}><ActivityIndicator size="small" color="#fff" /></View>}
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.welcomeText}>WELCOME BACK</Text>
          <Text style={styles.memberName}>{member?.name || 'Member'}</Text>
          <Text style={styles.memberPhone}>+91 {member?.phone}</Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setNotifModalVisible(true); setUnreadCount(0); }}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
            {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => setQrModalVisible(true)}>
            <Text style={{ fontSize: 16 }}>🪪</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => setEditModalVisible(true)}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- HERO BANNER SECTION (Active for 24 Hours) --- */}
      {heroOffer && (
        <View style={styles.heroBanner}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroBadge}>🔥 LIVE GYM OFFER / UPDATE</Text>
            <Text style={styles.heroTimer}>Active (24h)</Text>
          </View>
          <Text style={styles.heroTitle}>{heroOffer.title}</Text>
          <Text style={styles.heroMsg}>{heroOffer.message}</Text>
          {heroOffer.image_url && (
            <Image source={{ uri: heroOffer.image_url }} style={styles.heroImage} resizeMode="cover" />
          )}
        </View>
      )}

      {/* Membership Card & Status */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>MEMBERSHIP & FEES STATUS</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
            <Text style={[styles.statusText, { color: COLORS.success }]}>ACTIVE</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Plan Type:</Text>
          <Text style={styles.detailValue}>{member?.plan_type || 'Monthly'}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Fee Amount:</Text>
          <Text style={styles.detailValue}>₹{member?.fee_amount || 1500}</Text>
        </View>
      </View>

      {/* Live Check-In / Check-Out Widget */}
      <Text style={styles.sectionTitle}>GYM ATTENDANCE MATRIX</Text>
      {activeSession ? (
        <View style={styles.activeWorkoutCard}>
          <View style={styles.pulsingDot} />
          <Text style={styles.liveLabel}>WORKOUT IN PROGRESS</Text>
          <Text style={styles.timerText}>{elapsedTime}</Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckOut}>
            <Text style={styles.checkoutBtnText}>CHECK OUT NOW 🛑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.checkinBtnLarge} onPress={handleCheckIn} activeOpacity={0.85}>
          <Text style={styles.checkinEmoji}>⚡</Text>
          <Text style={styles.checkinMainText}>TAP TO CHECK IN</Text>
          <Text style={styles.checkinSubText}>Start your live gym session</Text>
        </TouchableOpacity>
      )}

      {/* Navigation Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity
          style={[styles.subActionBtn, { flex: 1, marginRight: 6 }]}
          onPress={() => navigation.navigate('AttendanceHistory', { memberId: member.id })}
        >
          <Text style={styles.subActionText}>📜 Attendance Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subActionBtn, { flex: 1, marginLeft: 6 }]}
          onPress={() => { setNotifModalVisible(true); setUnreadCount(0); }}
        >
          <Text style={styles.subActionText}>📬 Admin Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.logoutBtnText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* Notification Inbox Modal */}
      <Modal transparent animationType="slide" visible={notifModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '65%' }]}>
            <Text style={styles.modalTitle}>ADMIN BROADCAST INBOX</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.notifItem}>
                  <Text style={styles.notifTitle}>⚡ {item.title}</Text>
                  <Text style={styles.notifMsg}>{item.message}</Text>
                  {item.image_url && <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 120, borderRadius: 6, marginTop: 8 }} />}
                  <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No messages found.</Text>}
            />
            <TouchableOpacity style={[styles.payBtn, { marginTop: 15 }]} onPress={() => setNotifModalVisible(false)}>
              <Text style={styles.payBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Digital QR Pass Modal */}
      <Modal transparent animationType="fade" visible={qrModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <Text style={styles.modalTitle}>DIGITAL GYM PASS</Text>
            <View style={styles.qrBox}>
              <QRCode value={member?.id ? member.id.toString() : 'LATRACTION'} size={180} color="#000" backgroundColor="#fff" />
            </View>
            <Text style={styles.qrMemberName}>{member?.name}</Text>
            <Text style={styles.qrMemberMeta}>ID: LAT-{member?.id?.slice(0, 8)} | +91 {member?.phone}</Text>
            <TouchableOpacity style={[styles.payBtn, { marginTop: 20, width: '100%' }]} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.payBtnText}>CLOSE PASS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal transparent animationType="slide" visible={editModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EDIT PROFILE</Text>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>MOBILE NUMBER</Text>
            <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} keyboardType="number-pad" maxLength={10} placeholderTextColor={COLORS.textMuted} />
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.inputBackground }]} onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={handleUpdateProfile}>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '800' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomPopup visible={popupVisible} title={popupTitle} message={popupMsg} onClose={() => setPopupVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 35, marginBottom: 20 },
  profileBadgeContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: COLORS.primary },
  profileAvatar: { width: '100%', height: '100%' },
  profileBadge: { width: '100%', height: '100%', backgroundColor: '#26262E', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  welcomeText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  memberName: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  memberPhone: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  notifBadgeDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  heroBanner: { backgroundColor: '#1E1E26', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 16, marginBottom: 20 },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroBadge: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTimer: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' },
  heroTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  heroMsg: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  heroImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 10 },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusMd, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  detailLabel: { color: COLORS.textSecondary, fontSize: 13 },
  detailValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  checkinBtnLarge: { backgroundColor: '#FF3B3015', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: SIZES.radiusLg, padding: 22, alignItems: 'center', marginBottom: 15 },
  checkinEmoji: { fontSize: 32, marginBottom: 6 },
  checkinMainText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  checkinSubText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  activeWorkoutCard: { backgroundColor: '#34C75915', borderWidth: 1.5, borderColor: COLORS.success, borderRadius: SIZES.radiusLg, padding: 20, alignItems: 'center', marginBottom: 15 },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, marginBottom: 6 },
  liveLabel: { color: COLORS.success, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  timerText: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, marginVertical: 6, letterSpacing: 2 },
  checkoutBtn: { backgroundColor: COLORS.success, width: '100%', paddingVertical: 12, borderRadius: SIZES.radiusMd, alignItems: 'center', marginTop: 10 },
  checkoutBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  subActionBtn: { backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: SIZES.radiusMd, alignItems: 'center' },
  subActionText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 12 },
  logoutBtn: { backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMd, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoutBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.cardBackground, borderRadius: SIZES.radiusLg, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 15, textAlign: 'center', letterSpacing: 1 },
  notifItem: { backgroundColor: COLORS.inputBackground, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  notifTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  notifMsg: { color: COLORS.textPrimary, fontSize: 12, marginVertical: 4 },
  notifTime: { color: COLORS.textMuted, fontSize: 10 },
  qrBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 10 },
  qrMemberName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  qrMemberMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: COLORS.inputBackground, borderWidth: `1`, borderColor: COLORS.border, borderRadius: SIZES.radiusMd, padding: 12, color: COLORS.textPrimary, fontSize: 15, marginBottom: 15 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  payBtn: { backgroundColor: '#FF3B3020', borderWidth: 1, borderColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20, fontSize: 13 },
});