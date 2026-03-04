import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderSuccess'>;

export default function OrderSuccessScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check" size={48} color={colors.white} />
        </View>

        <Text style={styles.title}>Commande confirmée !</Text>
        <Text style={styles.subtitle}>
          Votre commande a été passée avec succès
        </Text>

        <View style={styles.orderIdBox}>
          <Text style={styles.orderIdLabel}>Numéro de commande</Text>
          <Text style={styles.orderId} data-testid="text-order-id">{orderId}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Feather name="clock" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Temps estimé: 30-45 minutes</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="truck" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Le livreur est en route</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="phone" size={18} color={colors.primary} />
            <Text style={styles.infoText}>Contact: 0911742202</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('Tracking', { orderId })}
          data-testid="button-track-order"
        >
          <Feather name="map-pin" size={20} color={colors.white} />
          <Text style={styles.trackButtonText}>Suivre ma commande</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          data-testid="button-go-home"
        >
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Demo by Khevin Andrew Kita</Text>
          <Text style={styles.footerText}>Ed Corporation 0911742202</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  orderIdBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  orderIdLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  orderId: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  trackButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  trackButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  homeButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
