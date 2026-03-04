import { useState, useSyncExternalStore } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getRestaurantById, formatPrice, MenuItem } from '../lib/demo-data';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';
import { addToCart, getCartCount, subscribe, getSnapshot } from '../lib/cart-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Restaurant'>;

export default function RestaurantScreen({ route, navigation }: Props) {
  const restaurant = getRestaurantById(route.params.id);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const cartItems = useSyncExternalStore(subscribe, getSnapshot);
  const cartCount = getCartCount();

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Restaurant non trouvé</Text>
      </SafeAreaView>
    );
  }

  const menuCategories = ['all', ...new Set(restaurant.menu.map(item => item.category))];
  const filteredMenu = selectedCategory === 'all'
    ? restaurant.menu
    : restaurant.menu.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item, restaurant.id, restaurant.name);
    Alert.alert('Ajouté ! ✅', `${item.name} ajouté au panier`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.headerImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            data-testid="button-back"
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartHeaderButton}
            onPress={() => navigation.navigate('Cart')}
            data-testid="button-cart-header"
          >
            <Feather name="shopping-cart" size={20} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="star" size={16} color={colors.star} />
              <Text style={styles.metaValue}>{restaurant.rating}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={16} color={colors.primary} />
              <Text style={styles.metaValue}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="truck" size={16} color={colors.primary} />
              <Text style={styles.metaValue}>{formatPrice(restaurant.deliveryFee)}</Text>
            </View>
          </View>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color={colors.textMuted} />
            <Text style={styles.addressText}>{restaurant.address}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {menuCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              data-testid={`button-menu-cat-${cat}`}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === cat && styles.categoryTabTextActive,
                ]}
              >
                {cat === 'all' ? 'Tout' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.menuSection}>
          {filteredMenu.map(item => (
            <View key={item.id} style={styles.menuItem}>
              <Image source={{ uri: item.image }} style={styles.menuImage} />
              <View style={styles.menuInfo}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
                  {item.popular && (
                    <View style={styles.popularBadge}>
                      <Feather name="trending-up" size={14} color={colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.menuDescription} numberOfLines={2}>{item.description}</Text>
                <View style={styles.menuFooter}>
                  <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                    data-testid={`button-add-${item.id}`}
                  >
                    <Feather name="plus" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Min. {formatPrice(restaurant.minOrder)}</Text>
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          data-testid="button-floating-cart"
        >
          <Feather name="shopping-cart" size={20} color={colors.white} />
          <Text style={styles.floatingCartText}>Voir le panier ({cartCount})</Text>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    backgroundColor: colors.white,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cartHeaderButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.white,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.destructive,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  infoSection: {
    padding: spacing.xl,
  },
  restaurantName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  restaurantDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  categoryTabs: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTabTextActive: {
    color: colors.white,
  },
  menuSection: {
    paddingHorizontal: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.surface,
  },
  menuInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  popularBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  _placeholder: {},
  menuDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  menuPrice: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  floatingCart: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingCartText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
