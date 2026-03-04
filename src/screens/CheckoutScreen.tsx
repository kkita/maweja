import { useState, useSyncExternalStore } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { formatPrice } from '../lib/demo-data';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';
import { subscribe, getSnapshot, getCartTotal, clearCart } from '../lib/cart-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

const paymentMethods = [
  { id: 'airtel', name: 'Airtel Money', featherIcon: 'smartphone' as const, color: '#e40000' },
  { id: 'mpesa', name: 'M-PESA', featherIcon: 'smartphone' as const, color: '#00a650' },
  { id: 'orange', name: 'Orange Money', featherIcon: 'smartphone' as const, color: '#ff6600' },
  { id: 'afrimoney', name: 'AfriMoney', featherIcon: 'smartphone' as const, color: '#ffc107' },
  { id: 'illico', name: 'Illico Cash', featherIcon: 'dollar-sign' as const, color: '#0066cc' },
  { id: 'cash', name: 'Cash à la livraison', featherIcon: 'dollar-sign' as const, color: '#22c55e' },
  { id: 'card', name: 'Carte Bancaire', featherIcon: 'credit-card' as const, color: '#6366f1' },
];

export default function CheckoutScreen({ navigation }: Props) {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot);
  const total = getCartTotal();
  const deliveryFee = 2500;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');

  const handleOrder = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (!selectedPayment) {
      Alert.alert('Erreur', 'Veuillez choisir un mode de paiement');
      return;
    }
    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    clearCart();
    navigation.navigate('OrderSuccess', { orderId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="button-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Adresse de livraison</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            data-testid="input-name"
          />
          <TextInput
            style={styles.input}
            placeholder="Téléphone (ex: 0911742202)"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            data-testid="input-phone"
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Adresse complète à Kinshasa"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            data-testid="input-address"
          />
        </View>

        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <View style={styles.paymentGrid}>
          {paymentMethods.map(pm => (
            <TouchableOpacity
              key={pm.id}
              style={[
                styles.paymentOption,
                selectedPayment === pm.id && { borderColor: pm.color, borderWidth: 2 },
              ]}
              onPress={() => setSelectedPayment(pm.id)}
              data-testid={`button-payment-${pm.id}`}
            >
              <Feather name={pm.featherIcon} size={22} color={pm.color} />
              <Text style={styles.paymentName}>{pm.name}</Text>
              {selectedPayment === pm.id && (
                <View style={[styles.checkCircle, { backgroundColor: pm.color }]}>
                  <Feather name="check" size={12} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        <View style={styles.summary}>
          {cartItems.map(ci => (
            <View key={ci.item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {ci.quantity}x {ci.item.name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(ci.item.price * ci.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total + deliveryFee)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrder}
          data-testid="button-place-order"
        >
          <Text style={styles.orderButtonText}>
            Confirmer la commande • {formatPrice(total + deliveryFee)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  inputGroup: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentGrid: {
    gap: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  _paymentPlaceholder: {},
  paymentName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryItemName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomBar: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  orderButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  orderButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
