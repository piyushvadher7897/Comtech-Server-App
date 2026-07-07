import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { colors } from '../../theme/theme';

const AdminDepositsScreen = ({ navigation }) => (
  <AdminScreenLayout>
    <View style={styles.wrap}>
      <Text style={styles.title}>Deposits</Text>
      <Text style={styles.sub}>View and manage all fund deposit requests</Text>
      <GoldButton
        title="VIEW FUND DEPOSITS"
        onPress={() => navigation.navigate('FundDepositList', { initialTab: 'all' })}
      />
    </View>
  </AdminScreenLayout>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default AdminDepositsScreen;
