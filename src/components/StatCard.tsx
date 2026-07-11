import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '../theme/useThemeColors';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendPositive = true,
  color = '#3b82f6' 
}) => {
  const { colors, isDark } = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={20} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trend, { color: trendPositive ? colors.success : colors.error }]}>
            {trendPositive ? '+' : ''}{trend}
          </Text>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flex: 1,
    margin: 6,
    minWidth: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
});
