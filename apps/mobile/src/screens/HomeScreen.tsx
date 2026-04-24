import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { TV_LIST, LAYOUTS, COLORS } from '../../../../packages/shared/src/constants';
import { useTVStore } from '../store/tvStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TV } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function TVCard({ tv, onPress }: { tv: TV; onPress: () => void }) {
  const { tvStates } = useTVStore();
  const state = tvStates[tv.id];
  const layout = state ? LAYOUTS.find(l => l.id === state.layoutId) : null;

  return (
    <TouchableOpacity style={s.tvCard} onPress={onPress} activeOpacity={0.85}>
      <View style={s.tvScreen}>
        <Text style={{ fontSize: 14 }}>{tv.icon}</Text>
        <Text style={s.tvScreenId}>{tv.id}</Text>
      </View>
      <View style={s.tvInfo}>
        <Text style={s.tvName}>{tv.name}</Text>
        <Text style={s.tvLoc}>📍 {tv.location}</Text>
        {layout
          ? <Text style={s.tvLayout}>{layout.name}</Text>
          : <Text style={s.tvNoLayout}>Tap to configure</Text>}
      </View>
      <View style={s.liveChip}>
        <View style={s.liveDot} />
        <Text style={s.liveText}>Live</Text>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { fetchTVState } = useTVStore();

  useEffect(() => {
    TV_LIST.forEach(tv => fetchTVState(tv.id));
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDk} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>📺 Signage Ctrl</Text>
          <Text style={s.headerSub}>Control {TV_LIST.length} displays</Text>
        </View>
        <View style={s.liveBadge}>
          <View style={s.liveBadgeDot} />
          <Text style={s.liveBadgeText}>{TV_LIST.length} Live</Text>
        </View>
      </View>

      {/* Scan Button */}
      <TouchableOpacity style={s.scanBtn} onPress={() => navigation.navigate('Scanner')} activeOpacity={0.9}>
        <Text style={{ fontSize: 26 }}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.scanTitle}>Scan TV QR Code</Text>
          <Text style={s.scanSub}>Point camera at TV screen</Text>
        </View>
        <Text style={s.scanArrow}>›</Text>
      </TouchableOpacity>

      {/* Section */}
      <View style={s.sectionRow}>
        <Text style={s.sectionLabel}>ALL DISPLAYS</Text>
        <Text style={s.sectionCount}>{TV_LIST.length} TVs</Text>
      </View>

      {/* TV List */}
      <FlatList
        data={TV_LIST}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TVCard tv={item} onPress={() => navigation.navigate('TVDetail', { tv: item })} />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primaryDk, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub: { color: COLORS.textFaint, fontSize: 12, marginTop: 2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  liveBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  liveBadgeText: { color: COLORS.success, fontSize: 12, fontWeight: '700' },

  scanBtn: {
    margin: 16, backgroundColor: COLORS.primary, borderRadius: 14,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 6, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12,
  },
  scanTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  scanSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  scanArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 28 },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  sectionCount: { color: COLORS.textMuted, fontSize: 11 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },

  tvCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    elevation: 2, shadowColor: '#0a1628', shadowOpacity: 0.08, shadowRadius: 8,
  },
  tvScreen: {
    width: 68, height: 44, backgroundColor: COLORS.primaryDk, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  tvScreenId: { color: '#3b6de8', fontSize: 8, fontWeight: '700', marginTop: 2 },
  tvInfo: { flex: 1 },
  tvName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  tvLoc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  tvLayout: {
    color: COLORS.primary, fontSize: 10, fontWeight: '700', marginTop: 5,
    backgroundColor: COLORS.primaryLt, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  tvNoLayout: { color: '#94a3b8', fontSize: 10, marginTop: 5 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 10, fontWeight: '700' },
});
