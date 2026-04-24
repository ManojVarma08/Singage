import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Canvas } from 'react-native';
import { COLORS, LAYOUTS } from '../../../../packages/shared/src/constants';
import { useTVStore } from '../store/tvStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import QRCodeSVG from 'react-native-qrcode-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'TVDetail'>;

export function TVDetailScreen({ route, navigation }: Props) {
  const { tv } = route.params;
  const { tvStates, fetchTVState, clearTV } = useTVStore();
  const state = tvStates[tv.id];
  const layout = state ? LAYOUTS.find(l => l.id === state.layoutId) : null;

  useEffect(() => {
    fetchTVState(tv.id);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* TV Header */}
        <View style={s.header}>
          <View style={s.tvScreen}>
            <Text style={{ fontSize: 28 }}>{tv.icon}</Text>
            <Text style={s.tvScreenId}>{tv.id}</Text>
          </View>
          <Text style={s.tvName}>{tv.name}</Text>
          <Text style={s.tvLoc}>📍 {tv.location}</Text>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>Live · Connected</Text>
          </View>
          {layout && (
            <View style={s.layoutBadge}>
              <Text style={s.layoutBadgeText}>🗂 {layout.name} · {layout.cells} zones</Text>
            </View>
          )}
        </View>

        {/* QR Code */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TV QR CODE</Text>
          <Text style={s.sectionSub}>Display this on TV screen for scanning</Text>
          <View style={s.qrBox}>
            <QRCodeSVG value={tv.id} size={180} color={COLORS.primaryDk} backgroundColor="#ffffff" />
            <Text style={s.qrLabel}>{tv.id} · {tv.location}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>CONTROLS</Text>

          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Layout', { tv })} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: COLORS.primaryLt }]}>
              <Text style={{ fontSize: 22 }}>🗂</Text>
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Change Layout</Text>
              <Text style={s.actionSub}>Choose from 12 zone layouts</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => {
              if (state?.layoutId) {
                navigation.navigate('Media', { tv, layoutId: state.layoutId, cellCount: state.cells.length });
              } else {
                navigation.navigate('Layout', { tv });
              }
            }}
            activeOpacity={0.85}
          >
            <View style={[s.actionIcon, { backgroundColor: '#dcfce7' }]}>
              <Text style={{ fontSize: 22 }}>🖼</Text>
            </View>
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Push Media</Text>
              <Text style={s.actionSub}>Upload image or video to TV</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.actionBtn, { borderColor: '#fee2e2' }]} onPress={() => clearTV(tv.id)} activeOpacity={0.85}>
            <View style={[s.actionIcon, { backgroundColor: '#fee2e2' }]}>
              <Text style={{ fontSize: 22 }}>🗑</Text>
            </View>
            <View style={s.actionInfo}>
              <Text style={[s.actionTitle, { color: COLORS.error }]}>Clear Display</Text>
              <Text style={s.actionSub}>Remove all media from TV</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primaryDk, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  tvScreen: {
    width: 88, height: 56, backgroundColor: '#112240', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary, marginBottom: 14,
  },
  tvScreenId: { color: '#3b6de8', fontSize: 10, fontWeight: '700', marginTop: 2 },
  tvName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  tvLoc: { color: COLORS.textFaint, fontSize: 13, marginTop: 4 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  layoutBadge: { marginTop: 10, backgroundColor: 'rgba(30,79,216,0.3)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  layoutBadgeText: { color: '#93c5fd', fontSize: 12, fontWeight: '700' },
  section: { margin: 16 },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  sectionSub: { color: COLORS.textMuted, fontSize: 12, marginBottom: 14 },
  qrBox: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24,
    alignItems: 'center', elevation: 2, borderWidth: 2, borderColor: COLORS.primary,
  },
  qrLabel: { marginTop: 14, color: COLORS.textMid, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  actionBtn: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    elevation: 2, borderWidth: 1, borderColor: COLORS.divider,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  actionInfo: { flex: 1 },
  actionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  actionSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  arrow: { color: COLORS.border, fontSize: 28 },
});
