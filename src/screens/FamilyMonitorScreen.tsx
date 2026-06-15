import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function FamilyMonitorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FamilyMonitorScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: typography.title, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
});
