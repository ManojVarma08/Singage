import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TV_LIST, COLORS } from '../../../../packages/shared/src/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(120);

    const tvId = data.trim().toUpperCase();
    const tv = TV_LIST.find(t => t.id === tvId);

    if (tv) {
      navigation.replace('TVDetail', { tv });
    } else {
      Alert.alert('Invalid QR Code', `"${data}" is not a valid TV ID.`, [
        { text: 'Try Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.permText}>Camera permission needed</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={s.overlay}>
        <View style={s.overlayTop} />
        <View style={s.overlayRow}>
          <View style={s.overlaySide} />
          <View style={s.finder}>
            <View style={[s.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[s.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[s.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[s.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
            <View style={s.scanLine} />
          </View>
          <View style={s.overlaySide} />
        </View>
        <View style={s.overlayBottom}>
          <Text style={s.scanText}>
            {scanned ? '✅ TV Found!' : 'Point camera at the QR code on the TV screen'}
          </Text>
          <TouchableOpacity style={s.manualBtn} onPress={() => {
            Alert.prompt('Enter TV ID', 'e.g. TV1, TV5', (text) => {
              if (text?.trim()) handleScan({ data: text.trim() });
            }, 'plain-text');
          }}>
            <Text style={s.manualBtnText}>Enter TV ID Manually</Text>
          </TouchableOpacity>
          <View style={s.quickGrid}>
            {TV_LIST.map(tv => (
              <TouchableOpacity key={tv.id} style={s.quickChip} onPress={() => handleScan({ data: tv.id })}>
                <Text style={{ fontSize: 14 }}>{tv.icon}</Text>
                <Text style={s.quickId}>{tv.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FINDER = 220;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: COLORS.primaryDk, alignItems: 'center', justifyContent: 'center' },
  permText: { color: '#fff', fontSize: 16, marginBottom: 20 },
  permBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayRow: { height: FINDER, flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  finder: { width: FINDER, height: FINDER, position: 'relative' },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: COLORS.primary, borderStyle: 'solid', borderWidth: 0 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, backgroundColor: COLORS.primary, top: '50%' },
  overlayBottom: {
    flex: 1.4, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  scanText: { color: '#fff', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  manualBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 16 },
  manualBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  quickChip: {
    backgroundColor: 'rgba(30,79,216,0.4)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(30,79,216,0.7)',
  },
  quickId: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 2 },
});
