import { useState, useSyncExternalStore } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { restaurants, categories } from '../lib/demo-data';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';
import { getCartCount, subscribe, getSnapshot } from '../lib/cart-store';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const cartItems = useSyncExternalStore(subscribe, getSnapshot);
  const cartCount = getCartCount();

  const filtered = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'african') return matchesSearch && (r.cuisine.includes('Congolais') || r.cuisine.includes('Africain'));
    if (selectedCategory === 'fastfood') return matchesSearch && (r.cuisine.includes('Fast Food') || r.cuisine.includes('Burgers'));
    if (selectedCategory === 'grills') return matchesSearch && r.cuisine.includes('Grillades');
    if (selectedCategory === 'market') return matchesSearch && (r.cuisine.includes('Marché') || r.cuisine.includes('Supermarché'));
    if (selectedCategory === 'hotel') return matchesSearch && (r.cuisine.includes('Gastronomique') || r.cuisine.includes('Buffet') || r.cuisine.includes('Hôtel'));
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenue sur</Text>
            <Text style={styles.appName}>Voss</Text>
            <Text style={styles.location}>
              <Feather name="map-pin" size={14} color={colors.primary} /> Kinshasa, RDC
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
            data-testid="button-cart"
          >
            <Feather name="shopping-cart" size={22} color={colors.white} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            data-testid="input-search"
          />
        </View>

        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Livraison à Kinshasa</Text>
            <Text style={styles.promoSubtitle}>Vos plats préférés livrés chez vous</Text>
            <View style={styles.promoTag}>
              <Text style={styles.promoTagText}>-20% première commande</Text>
            </View>
          </View>
          <View style={styles.promoIconWrap}>
            <Feather name="truck" size={40} color={colors.white} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              data-testid={`button-category-${cat.id}`}
            >
              <Feather
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restaurants populaires</Text>
          <Text style={styles.sectionCount}>{filtered.length} trouvés</Text>
        </View>

        {filtered.map(restaurant => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => navigation.navigate('Restaurant', { id: restaurant.id })}
            activeOpacity={0.7}
            data-testid={`card-restaurant-${restaurant.id}`}
          >
            <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
              <View style={styles.restaurantMeta}>
                <View style={styles.ratingContainer}>
                  <Feather name="star" size={14} color={colors.star} />
                  <Text style={styles.ratingText}>{restaurant.rating}</Text>
                </View>
                <View style={styles.metaDot} />
                <Feather name="clock" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {restaurant.deliveryFee.toLocaleString()} FC
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Demo by Khevin Andrew Kita</Text>
          <Text style={styles.footerText}>Ed Corporation 0911742202</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 4,
  },
  cartButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.destructive,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
  },
  promoBanner: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  promoSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  promoTagText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  promoIconWrap: {
    marginLeft: spacing.lg,
    opacity: 0.9,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  restaurantCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface,
  },
  restaurantInfo: {
    padding: spacing.lg,
  },
  restaurantName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  restaurantCuisine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
