import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { supabase } from '../../config/supabase';
import { COLORS, SIZES } from '../../config/theme';
import CustomPopup from '../../components/CustomPopup';

export default function OwnerScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

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
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Fetch member details based on scanned ID
      const { data: memberData, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', data)
        .single();

      if (error || !memberData) {
        showAlert('INVALID PASS ❌', 'Scanned QR code does not belong to any active member.');
        return;
      }

      // Check fee status
      const isPaid = memberData.fee_status === 'PAID';

      showAlert(
        isPaid ? 'ACCESS GRANTED ⚡' : 'FEE PENDING ⚠️',
        `Member: ${memberData.name}\nPhone: +91 ${memberData.phone}\nFee Status: ${memberData.fee_status || 'PENDING'}`
      );
    } catch (err) {
      showAlert('Error', 'Failed to verify member pass.');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.centerContainer}><Text style={styles.text}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.centerContainer}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GATE QR SCANNER</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.scanOverlay}>
          <Text style={styles.overlayText}>Align Member QR Pass within frame</Text>
        </View>
      </View>

      {scanned && (
        <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
          <Text style={styles.scanAgainText}>TAP TO SCAN NEXT PASS 🔄</Text>
        </TouchableOpacity>
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  text: { color: COLORS.textPrimary, fontSize: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 35, marginBottom: 15 },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  cameraContainer: { flex: 1, borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 },
  scanOverlay: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  overlayText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  scanAgainBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  scanAgainText: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});