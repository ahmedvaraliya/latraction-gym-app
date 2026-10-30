import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import { scheduleLocalNotification } from '../../config/notifications';
import CustomPopup from '../../components/CustomPopup';

export default function OwnerBroadcastScreen({ navigation }) {
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' or 'SPECIFIC'
  const [membersList, setMembersList] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Advanced Formatting States (Bold & Accent Color Theme)
  const [isBold, setIsBold] = useState(false);
  const [accentColor, setAccentColor] = useState(COLORS.primary);

  const [loading, setLoading] = useState(false);

  // Popup States
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const showAlert = (t, m) => {
    setPopupTitle(t);
    setPopupMsg(m);
    setPopupVisible(true);
  };

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('members').select('id, name, phone');
      if (error) throw error;
      setMembersList(data || []);
    } catch (err) {
      console.log('Error fetching members:', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      const uri = result.assets[0].uri;
      const fileName = `broadcast-${Date.now()}.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage.from('avatars').upload(fileName, blob);
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setImageUrl(data.publicUrl);
      }
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!title.trim() || !message.trim()) {
      showAlert('Missing Fields', 'Please enter both title and message body.');
      return;
    }

    if (targetType === 'SPECIFIC' && !selectedMemberId) {
      showAlert('Select Member', 'Please select a specific member to send the message.');
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        title,
        message,
        image_url: imageUrl || null,
        member_id: targetType === 'ALL' ? null : selectedMemberId,
        expires_at: expiresAt,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      await scheduleLocalNotification(title, message);

      setLoading(false);
      setTitle('');
      setMessage('');
      setImageUrl('');
      setSelectedMemberId(null);
      showAlert(
        'SUCCESS 🚀',
        targetType === 'ALL'
          ? 'Broadcast & 24h Hero Banner published successfully with push alerts!'
          : 'Personal message & push alert sent successfully!'
      );
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message || 'Failed to send message.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ADMIN BROADCAST & HERO POST</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>SELECT TARGET AUDIENCE</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.targetTab, targetType === 'ALL' && styles.targetTabActive]}
            onPress={() => setTargetType('ALL')}
          >
            <Text style={[styles.targetTabText, targetType === 'ALL' && styles.targetTextActive]}>📢 All Members (24h Hero)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.targetTab, targetType === 'SPECIFIC' && styles.targetTabActive]}
            onPress={() => setTargetType('SPECIFIC')}
          >
            <Text style={[styles.targetTabText, targetType === 'SPECIFIC' && styles.targetTextActive]}>👤 Specific Member</Text>
          </TouchableOpacity>
        </View>

        {targetType === 'SPECIFIC' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>CHOOSE MEMBER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
              {membersList.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, selectedMemberId === m.id && styles.memberChipActive]}
                  onPress={() => setSelectedMemberId(m.id)}
                >
                  <Text style={[styles.memberChipText, selectedMemberId === m.id && styles.memberChipTextActive]}>
                    {m.name} (+91 {m.phone})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>POST STYLING & ACCENT</Text>
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={[styles.toolBtn, isBold && { backgroundColor: COLORS.primary }]}
            onPress={() => setIsBold(!isBold)}
          >
            <Text style={[styles.toolText, isBold && { color: '#fff' }]}>B Bold</Text>
          </TouchableOpacity>

          <View style={styles.colorPickerRow}>
            {['#FF3B30', '#34C759', '#007AFF', '#FF9500'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorDot, { backgroundColor: color }, accentColor === color && styles.colorDotSelected]}
                onPress={() => setAccentColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>MESSAGE TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Festival Offer / New Equipment Alert"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>MESSAGE BODY (DETAILS BELOW PHOTO)</Text>
          <TextInput
            style={[
              styles.input,
              { height: 120, textAlignVertical: 'top' },
              isBold && { fontWeight: '900' },
              { color: accentColor },
            ]}
            placeholder="Type your message or offer details here..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        <Text style={styles.label}>ATTACH BANNER / OFFER PHOTO</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.8}>
          {uploading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 150, borderRadius: 8 }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📷</Text>
              <Text style={{ color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 }}>Tap to Upload Banner Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendMessage}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>
              {targetType === 'ALL' ? 'PUBLISH 24H HERO & PUSH NOTIFY ⚡' : 'SEND PERSONAL MESSAGE & NOTIFY 📩'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => setPopupVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  targetTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  targetTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  targetTabText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  targetTextActive: { color: COLORS.textPrimary },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, marginBottom: 15 },
  toolBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border },
  toolText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 13 },
  colorPickerRow: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#fff' },
  colorDotSelected: { borderWidth: 2.5, transform: [{ scale: 1.15 }] },
  formGroup: { marginBottom: 14 },
  memberChip: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  memberChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  memberChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  memberChipTextActive: { color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  imagePickerBtn: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMd,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});