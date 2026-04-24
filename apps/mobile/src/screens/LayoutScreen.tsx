import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LAYOUTS, COLORS } from '../../../../packages/shared/src/constants';
import { useTVStore } from '../store/tvStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Layout'>;

const ZONE_COLORS = ['#1e4fd8','#2d5be3','#3b6de8','#5585ee','#7ba3f5'];

export function LayoutScreen({ route, navigation }: Props) {
  const { tv } = route.params;
  const { tvStates, setLayout } = useTVStore();
  const currentLayoutId = tvStates[tv.id]?.layoutId;
  const [selectedId, setSelectedId] = useState(currentLayoutId || null);
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    if (!selectedId) return;
    setSaving(true);
    const layout = LAYOUTS.find(l => l.id === selectedId)!;
    await setLayout(tv.id, selectedId, layout.cells);
    setSaving(false);
    navigation.navigate('Media', { tv, layoutId: selectedId, cellCount: layout.cells });
  };

  return (
    <SafeAreaView style={s.container}>
      {/* TV bar */}
      <View style={s.tvBar}>
        <Text style={{ fontSize: 20 }}>{tv.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.tvName}>{tv.name}</Text>
          <Text style={s.tvLoc}>📍 {tv.location}</Text>
        </View>
        <View style={s.liveChip}><View style={s.liveDot}/><Text style={s.liveText}>Live</Text></View>
      </View>

      <Text style={s.hint}>Choose how to divide your screen into zones</Text>

      <FlatList
        data={LAYOUTS}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={({ item }) => {
          const isSel = selectedId === item.id;
          const isCurrent = currentLayoutId === item.id;
          return (
            <TouchableOpacity style={[s.card, isSel && s.cardSel]} onPress={() => setSelectedId(item.id)} activeOpacity={0.8}>
              {isCurrent && <View style={s.currentBadge}><Text style={s.currentBadgeText}>Active</Text></View>}
              <View style={s.preview}>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 2, gap: 2 }}>
                  {Array.from({ length: item.cells }, (_, i) => (
                    <View key={i} style={[s.previewCell, { backgroundColor: isSel ? ZONE_COLORS[i % ZONE_COLORS.length] : '#1e3a5f' }]} />
                  ))}
                </View>
              </View>
              <Text style={[s.cardName, isSel && { color: COLORS.primary }]}>{item.name}</Text>
              <Text style={s.cardCells}>{item.cells} zone{item.cells > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      />

      <View style={s.footer}>
        {selectedId && (
          <Text style={s.selectedInfo}>
            {LAYOUTS.find(l => l.id === selectedId)?.description}
          </Text>
        )}
        <TouchableOpacity style={[s.applyBtn, !selectedId && s.applyBtnOff]} onPress={apply} disabled={saving || !selectedId} activeOpacity={0.9}>
          <Text style={s.applyBtnText}>{saving ? 'Applying...' : selectedId ? 'Apply & Add Media →' : 'Select a Layout'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tvBar: {
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  tvName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  tvLoc: { color: COLORS.textMuted, fontSize: 11 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  liveText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  hint: { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 16, paddingVertical: 10 },
  grid: { paddingHorizontal: 10, paddingBottom: 120 },
  card: {
    flex: 1, margin: 4, backgroundColor: COLORS.white, borderRadius: 12, padding: 8,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.divider,
    elevation: 1, position: 'relative',
  },
  cardSel: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLt, elevation: 4 },
  currentBadge: {
    position: 'absolute', top: 5, right: 5, backgroundColor: COLORS.success,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  currentBadgeText: { color: '#fff', fontSize: 7, fontWeight: '800' },
  preview: { width: '100%', aspectRatio: 16/9, backgroundColor: '#0d1e3a', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  previewCell: { flex: 1, minWidth: '28%', borderRadius: 2 },
  cardName: { fontSize: 9, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  cardCells: { fontSize: 8, color: COLORS.textMuted, marginTop: 1 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.divider, elevation: 8,
  },
  selectedInfo: { color: COLORS.textMuted, fontSize: 11, marginBottom: 8, textAlign: 'center' },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 4 },
  applyBtnOff: { backgroundColor: COLORS.border },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
