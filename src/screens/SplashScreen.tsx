import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚕</Text>
      <Text style={styles.title}>SilverRide</Text>
      <Text style={styles.subtitle}>어르신을 위한 편안한 택시</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: typography.largeNumber, fontWeight: typography.fontWeightBold, color: colors.white, marginBottom: 8 },
  subtitle: { fontSize: typography.body, color: colors.white, opacity: 0.85 },
});
