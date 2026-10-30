import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function ScanPassScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
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

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data: memberId }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      // 1. Verify if member exists and is active
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {
        setLoading(false);
        showAlert('ACCESS DENIED ❌', 'Invalid Gym Pass or Member not found.');
        return;
      }

      if (member.status !== 'active') {
        setLoading(false);
        showAlert('EXPIRED PASS ⚠️', `${member.name}'s membership is inactive/expired!`);
        return;
      }

      // 2. Check in the member in attendance table
      const nowISO = new Date().toISOString();
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([{ member_id: member.id, check_in_time: nowISO }]);

      if (attendanceError) throw attendanceError;

      setLoading(false);
      showAlert('ACCESS GRANTED ✅', `Welcome ${member.name}! Check-in recorded successfully.`);
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message || 'Failed to process check-in.');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text style={{ color: '#fff' }}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text style={{ color: '#ff3b30' }}>No access to camera. Please enable permissions in settings.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GATE ENTRY SCANNER</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scannerBox}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanTarget} />
          <Text style={styles.scanInstruction}>Align member's digital QR pass inside the frame</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: 'bold' }}>Verifying Pass...</Text>
        </View>
      )}

      {scanned && !loading && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>TAP TO SCAN NEXT PASS 🔄</Text>
        </TouchableOpacity>
      )}

      <CustomPopup
        visible={popupVisible}
        title={popupTitle}
        message={popupMsg}
        onClose={() => {
          setPopupVisible(false);
          setScanned(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 20 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 13, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  scannerBox: { flex: 1, borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  scanTarget: { width: 220, height: 220, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 20, backgroundColor: 'transparent' },
  scanInstruction: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  rescanBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  rescanText: { color: COLORS.textPrimary, fontWeight: '950', fontSize: 13, letterSpacing: 1 },
});