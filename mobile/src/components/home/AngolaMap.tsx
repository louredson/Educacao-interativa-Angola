import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppCard } from '../AppCard'
import { AppText } from '../AppText'
import { colors, radii, spacing } from '../../constants/colors'
import { provinces } from '../../constants/home'

const mapImage = require('../../assets/angola-map.png')

export function AngolaMap() {
  const [selectedProvince, setSelectedProvince] = useState(provinces[0])

  const provinceSummary = useMemo(
    () => [
      { label: 'Capital', value: selectedProvince.capital },
      { label: 'Municípios', value: selectedProvince.municipalities },
      { label: 'Extensão', value: selectedProvince.extension },
    ],
    [selectedProvince],
  )

  return (
    <AppCard>
      <View style={styles.header}>
        <View>
          <View style={styles.badge}>
            <Ionicons name="map-outline" size={12} color="#2563EB" />
            <AppText style={styles.badgeText}>Mapa Interativo</AppText>
          </View>
          <AppText variant="subtitle" style={styles.title}>
            Explore Angola por Província
          </AppText>
          <AppText variant="muted" style={styles.subtitle}>
            Toque numa província para ver governador, capital, municípios e mais dados.
          </AppText>
        </View>
      </View>

      <View style={styles.mapFrame}>
        <Image source={mapImage} style={styles.mapImage} resizeMode="contain" />
      </View>

      <View style={styles.chips}>
        {provinces.map((province) => {
          const active = province.name === selectedProvince.name
          return (
            <Pressable
              key={province.name}
              onPress={() => setSelectedProvince(province)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <AppText style={[styles.chipText, active && styles.chipTextActive]}>{province.name}</AppText>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.detailCard}>
        <AppText variant="label">Província selecionada</AppText>
        <AppText variant="subtitle">{selectedProvince.name}</AppText>
        <View style={styles.detailGrid}>
          {provinceSummary.map((item) => (
            <View key={item.label} style={styles.detailItem}>
              <AppText style={styles.detailLabel}>{item.label}</AppText>
              <AppText style={styles.detailValue}>{item.value}</AppText>
            </View>
          ))}
        </View>
        <View style={styles.detailList}>
          <DetailLine label="Governador" value={selectedProvince.governor} />
          <DetailLine label="Língua" value={selectedProvince.language} />
          <DetailLine label="Etnia" value={selectedProvince.ethnicity} />
        </View>
      </View>
    </AppCard>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <AppText style={styles.lineLabel}>{label}:</AppText>
      <AppText style={styles.lineValue}>{value}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  mapFrame: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#F8D94A',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  mapImage: {
    width: '100%',
    height: 360,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFF',
  },
  detailCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailItem: {
    flexGrow: 1,
    minWidth: 96,
    flexBasis: '30%',
    padding: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    marginTop: 4,
    fontWeight: '700',
    color: colors.text,
    fontSize: 13,
  },
  detailList: {
    gap: 8,
  },
  line: {
    gap: 2,
  },
  lineLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  lineValue: {
    fontSize: 14,
    color: colors.text,
  },
})

