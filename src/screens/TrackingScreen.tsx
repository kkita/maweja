import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

const trackingSteps = [
  { id: 1, title: 'Commande reçue', subtitle: 'Le restaurant a reçu votre commande', icon: 'check-circle' as const },
  { id: 2, title: 'En préparation', subtitle: 'Votre repas est en cours de préparation', icon: 'clock' as const },
  { id: 3, title: 'En livraison', subtitle: 'Le livreur est en route vers vous', icon: 'truck' as const },
  { id: 4, title: 'Livré', subtitle: 'Bon appétit !', icon: 'home' as const },
];

export default function TrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 4) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="button-back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de commande</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>Commande</Text>
          <Text style={styles.orderNumber} data-testid="text-tracking-order-id">{orderId}</Text>
          <View style={styles.estimateRow}>
            <Feather name="clock" size={16} color={colors.primary} />
            <Text style={styles.estimateText}>
              {currentStep < 4 ? 'Arrivée estimée: 25-35 min' : 'Commande livrée !'}
            </Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          {trackingSteps.map((step, index) => {
            const isComplete = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
            const isLast = index === trackingSteps.length - 1;

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepCircle,
                      isComplete && styles.stepCircleComplete,
                      isCurrent && styles.stepCircleCurrent,
                    ]}
                  >
                    {isComplete ? (
                      <Feather name="check" size={16} color={colors.white} />
                    ) : (
                      <Feather name={step.icon} size={16} color={colors.textMuted} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        isComplete && styles.stepLineComplete,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isComplete && styles.stepTitleComplete,
                    ]}
                  >
                    {step.title}
                    {isCurrent && currentStep < 4 ? '...' : ''}
                  </Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
          <View style={styles.contactRow}>
            <Feather name="phone" size={18} color={colors.primary} />
            <Text style={styles.contactText}>0911742202</Text>
          </View>
          <Text style={styles.contactNote}>Ed Corporation - Service client</Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          data-testid="button-go-home"
        >
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
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
    padding: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  orderLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  orderNumber: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  estimateText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  stepsContainer: {
    marginBottom: spacing.xxl,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 72,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 40,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stepLineComplete: {
    backgroundColor: colors.success,
  },
  stepContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepTitleComplete: {
    color: colors.text,
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  contactTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  contactNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  homeButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  homeButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
