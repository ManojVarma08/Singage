import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { LAYOUTS, COLORS } from '../../../../packages/shared/src/constants';
import { useTVStore } from '../store/tvStore';
import { useUpload } from '../hooks/useUpload';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Media'>;

export function MediaScreen({ route, navigation }: Props) {
  const { tv, layoutId, cellCount } = route.params;
  const layout = LAYOUTS.find(l => l.id === layoutId);
  const { tvStates } = useTVStore();
  const state = tvStates[tv.id];
  const cells = state?.cells || Array.from({ length: cellCount }, () => ({ mediaUrl: null, mediaType: null }));

  const [activeCell, setActiveCell] = useState(0);
  const { uploading, progress, pickImage, pickVideo, takePhoto } = useUpload(tv.id, activeCell);

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      Alert.alert('✅ Success!', `Media is live on ${tv.name} — Zone ${activeCell + 1}`);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Check your internet and AWS config.');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={{ fontSize: 24 }}>{tv.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>{tv.name}</Text>
          <Text style={s.headerSub}>{layout?.name} · {cellCount} zone{cellCount > 1 ? 's' : ''}</Text>
        </View>
        <View style={s.liveChip}><View style={s.liveDot}/><Text style={s.liveText}>Live</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Zone selector */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>SELECT ZONE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cells.map((cell, i) => (
              <TouchableOpacity key={i} style={[s.zoneChip, activeCell === i && s.zoneChipActive]} onPress={() => setActiveCell(i)}>
                {cell.mediaUrl ? (
                  cell.mediaType === 'image'
                    ? <Image source={{ uri: cell.mediaUrl }} style={s.zoneThumb} />
                    : <View style={[s.zoneThumb, s.videoThumb]}><Text style={{ fontSize: 20 }}>🎬</Text></View>
                ) : (
                  <View style={s.zoneEmpty}><Text style={{ fontSize: 22, color: COLORS.primary }}>+</Text></View>
                )}
                <Text style={[s.zoneLabel, activeCell === i && { color: COLORS.primary, fontWeight: '800' }]}>Zone {i + 1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Active zone banner */}
        <View style={s.activeBanner}>
          <Text style={s.activeBannerText}>
            Pushing to: <Text style={s.activeBold}>{tv.name} — Zone {activeCell + 1}</Text>
          </Text>
        </View>

        {/* Upload options */}
        {uploading ? (
          <View style={s.uploadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.uploadingText}>{progress}</Text>
            <Text style={s.uploadingSub}>Do not close the app</Text>
          </View>
        ) : (
          <View style={s.uploadSection}>
            <Text style={s.sectionLabel}>PUSH MEDIA TO ZONE {activeCell + 1}</Text>

            <TouchableOpacity style={s.uploadBtn} onPress={() => handleAction(pickImage)} activeOpacity={0.85}>
              <View style={[s.uploadIcon, { backgroundColor: COLORS.primaryLt }]}><Text style={{ fontSize: 24 }}>🖼</Text></View>
              <View style={s.uploadInfo}>
                <Text style={s.uploadTitle}>Upload Image</Text>
                <Text style={s.uploadSub}>JPG, PNG → S3 → TV (permanent)</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.uploadBtn} onPress={() => handleAction(pickVideo)} activeOpacity={0.85}>
              <View style={[s.uploadIcon, { backgroundColor: '#dcfce7' }]}><Text style={{ fontSize: 24 }}>🎬</Text></View>
              <View style={s.uploadInfo}>
                <Text style={s.uploadTitle}>Upload Video</Text>
                <Text style={s.uploadSub}>MP4 up to 60s → S3 → TV</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.uploadBtn} onPress={() => handleAction(takePhoto)} activeOpacity={0.85}>
              <View style={[s.uploadIcon, { backgroundColor: '#fff7ed' }]}><Text style={{ fontSize: 24 }}>📷</Text></View>
              <View style={s.uploadInfo}>
                <Text style={s.uploadTitle}>Take Photo Now</Text>
                <Text style={s.uploadSub}>Camera → S3 → TV instantly</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.backBtnText}>← Back to All TVs</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primaryDk, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub: { color: COLORS.textFaint, fontSize: 11, marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  section: { padding: 16 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  zoneChip: {
    marginRight: 10, alignItems: 'center', borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 12, padding: 6, backgroundColor: COLORS.white,
  },
  zoneChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLt },
  zoneThumb: { width: 70, height: 52, borderRadius: 8 },
  videoThumb: { backgroundColor: COLORS.primaryDk, alignItems: 'center', justifyContent: 'center' },
  zoneEmpty: { width: 70, height: 52, borderRadius: 8, backgroundColor: COLORS.primaryLt, alignItems: 'center', justifyContent: 'center' },
  zoneLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  activeBanner: {
    backgroundColor: COLORS.primaryLt, marginHorizontal: 16, borderRadius: 10,
    padding: 12, marginBottom: 4, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  activeBannerText: { color: COLORS.textMid, fontSize: 12 },
  activeBold: { color: COLORS.primary, fontWeight: '800' },
  uploadSection: { paddingHorizontal: 16 },
  uploadBtn: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.divider,
  },
  uploadIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  uploadInfo: { flex: 1 },
  uploadTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  uploadSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  arrow: { color: COLORS.border, fontSize: 26 },
  uploadingBox: { alignItems: 'center', padding: 48 },
  uploadingText: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginTop: 16 },
  uploadingSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 6 },
  backBtn: { margin: 16, padding: 14, alignItems: 'center', backgroundColor: COLORS.divider, borderRadius: 12 },
  backBtnText: { color: COLORS.textMid, fontSize: 13, fontWeight: '700' },
});
