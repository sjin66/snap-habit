import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const QUOTES = [
  '"One step at a time, you\'re making great progress."',
  '"Every habit you build shapes the person you become."',
  '"Small wins compound into extraordinary results."',
  '"Consistency beats perfection every time."',
];

interface Props {
  completed: number;
  total: number;
}

export function ProgressCard({ completed, total }: Props) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const quote = QUOTES[Math.floor((completed / Math.max(total, 1)) * (QUOTES.length - 1))];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.countText}>
          <Text style={styles.countBold}>{completed} / {total}</Text>
          <Text style={styles.countLabel}> completed</Text>
        </Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>

      <Text style={styles.quote}>{quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 16,
  },
  countBold: {
    fontWeight: '700',
    color: '#1A1A2E',
    fontSize: 16,
  },
  countLabel: {
    color: '#6C757D',
    fontWeight: '400',
  },
  percent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  quote: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
