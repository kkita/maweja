import { db } from "./db";
import { users, restaurants, menuItems, serviceCategories, serviceCatalogItems } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
  if (Number(existing.count) > 0) return;

  console.log("Seeding database...");

  await db.insert(users).values([
    { email: "admin@maweja.cd", password: "admin123", name: "Admin MAWEJA", phone: "0819994041", role: "admin", walletBalance: 0, loyaltyPoints: 0, isOnline: true, isBlocked: false },
    { email: "admin@maweja.net", password: "Maweja2026", name: "Super Admin", phone: "0819994041", role: "admin", walletBalance: 0, loyaltyPoints: 0, isOnline: true, isBlocked: false },
    { email: "driver1@maweja.cd", password: "driver123", name: "Jean-Pierre Mutombo", phone: "0823456789", role: "driver", walletBalance: 18, loyaltyPoints: 0, isOnline: true, isBlocked: false, lat: -4.3217, lng: 15.3125, vehicleType: "moto", vehiclePlate: "KN-1234-AB", driverLicense: "DL-001234", commissionRate: 15, verificationStatus: "approved" },
    { email: "driver2@maweja.cd", password: "driver123", name: "David Tshimanga", phone: "0834567890", role: "driver", walletBalance: 13, loyaltyPoints: 0, isOnline: true, isBlocked: false, lat: -4.3150, lng: 15.2980, vehicleType: "moto", vehiclePlate: "KN-5678-CD", driverLicense: "DL-005678", commissionRate: 15, verificationStatus: "approved" },
    { email: "driver3@maweja.cd", password: "driver123", name: "Samuel Ilunga", phone: "0845678901", role: "driver", walletBalance: 11, loyaltyPoints: 0, isOnline: false, isBlocked: false, lat: -4.3280, lng: 15.3050, vehicleType: "voiture", vehiclePlate: "KN-9012-EF", driverLicense: "DL-009012", commissionRate: 12, verificationStatus: "approved" },
    { email: "driver4@maweja.cd", password: "driver123", name: "Joseph Kalala", phone: "0856789012", role: "driver", walletBalance: 21, loyaltyPoints: 0, isOnline: true, isBlocked: false, lat: -4.3100, lng: 15.3200, vehicleType: "scooter", vehiclePlate: "KN-3456-GH", driverLicense: "DL-003456", commissionRate: 15, verificationStatus: "approved" },
  ]);

  const restaurantData = [
    {
      name: "Aldar Restaurant",
      description: "Cuisine libanaise et internationale authentique au cœur de Kinshasa — mezze, grillades et pâtisseries orientales",
      cuisine: "Libanais",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Avenue du Commerce 14, Gombe, Kinshasa",
      rating: 4.7, deliveryTime: "30-45 min", deliveryFee: 2, minOrder: 8,
      isActive: true, lat: -4.3106, lng: 15.3139, phone: "+243 81 234 5678",
      openingHours: "09:00 - 23:00", prepTime: "20-30 min"
    },
    {
      name: "Maman Cécile Kitchen",
      description: "Saveurs congolaises authentiques — Pondu, Moambe, Liboke et spécialités traditionnelles de Kinshasa",
      cuisine: "Congolais",
      image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Avenue Kasa-Vubu 88, Lingwala, Kinshasa",
      rating: 4.8, deliveryTime: "25-40 min", deliveryFee: 2, minOrder: 5,
      isActive: true, lat: -4.3190, lng: 15.3020, phone: "+243 82 345 6789",
      openingHours: "08:00 - 22:00", prepTime: "25-35 min"
    },
    {
      name: "Hunga Busta",
      description: "Les meilleurs burgers artisanaux et grillades de Kin — viande locale, sauces maison, frites croustillantes",
      cuisine: "Burgers",
      image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Avenue de la Libération 23, Gombe, Kinshasa",
      rating: 4.5, deliveryTime: "20-35 min", deliveryFee: 2, minOrder: 6,
      isActive: true, lat: -4.3180, lng: 15.3060, phone: "+243 83 456 7890",
      openingHours: "11:00 - 01:00", prepTime: "15-25 min"
    },
    {
      name: "KFC Kinshasa",
      description: "Le poulet croustillant préféré de Kinshasa — recette originale, livraison rapide et fraîche",
      cuisine: "Fast Food",
      image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Boulevard du 30 Juin, Gombe, Kinshasa",
      rating: 4.3, deliveryTime: "15-30 min", deliveryFee: 2, minOrder: 5,
      isActive: true, lat: -4.3150, lng: 15.3100, phone: "+243 84 567 8901",
      openingHours: "10:00 - 23:00", prepTime: "10-20 min"
    },
    {
      name: "La Bella Pizza",
      description: "Pizzas artisanales cuites au four à bois — pâte fine croustillante, ingrédients frais et recettes italiennes authentiques",
      cuisine: "Pizza",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Avenue des Aviateurs 5, Gombe, Kinshasa",
      rating: 4.6, deliveryTime: "25-40 min", deliveryFee: 2, minOrder: 7,
      isActive: true, lat: -4.3135, lng: 15.3165, phone: "+243 85 678 9012",
      openingHours: "11:00 - 23:30", prepTime: "20-30 min"
    },
    {
      name: "Café du Fleuve Congo",
      description: "Café & brunch moderne avec vue sur le fleuve — petit-déjeuner, sandwichs gourmet, jus frais et café de spécialité",
      cuisine: "Café & Brunch",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Boulevard du 30 Juin 42, Gombe, Kinshasa",
      rating: 4.7, deliveryTime: "15-25 min", deliveryFee: 2, minOrder: 4,
      isActive: true, lat: -4.3115, lng: 15.3095, phone: "+243 86 789 0123",
      openingHours: "06:30 - 22:00", prepTime: "10-15 min"
    },
    {
      name: "Le Grand Saveur",
      description: "Gastronomie internationale dans un cadre élégant — carte des vins, fruits de mer, viandes nobles et desserts raffinés",
      cuisine: "Gastronomique",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&h=500&fit=crop",
      logoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop",
      coverVideoUrl: null,
      address: "Avenue Batetela 12, Gombe, Kinshasa",
      rating: 4.9, deliveryTime: "40-60 min", deliveryFee: 3, minOrder: 20,
      isActive: true, lat: -4.3200, lng: 15.3150, phone: "+243 87 890 1234",
      openingHours: "12:00 - 00:00", prepTime: "35-50 min"
    },
  ];

  const insertedRestaurants = await db.insert(restaurants).values(restaurantData).returning();
  const r = insertedRestaurants;

  const menuData: any[] = [];

  // 1. Aldar Restaurant - Libanais
  menuData.push(
    { restaurantId: r[0].id, name: "Houmous Maison", description: "Purée de pois chiches au tahini, huile d'olive et paprika", price: 3, image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=400&fit=crop", category: "Entrées", isAvailable: true, popular: false },
    { restaurantId: r[0].id, name: "Shawarma Poulet", description: "Poulet mariné grillé à la broche, sauce ail et herbes", price: 4, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop", category: "Plats Chauds", isAvailable: true, popular: true },
    { restaurantId: r[0].id, name: "Falafel Plate", description: "6 falafels croustillants, salade, tahini et pain pita", price: 5, image: "https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=400&h=400&fit=crop", category: "Plats Chauds", isAvailable: true, popular: false },
    { restaurantId: r[0].id, name: "Mixed Grill Royal", description: "Assortiment brochettes agneau, poulet et kefta avec riz et fattoush", price: 12, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop", category: "Grillades", isAvailable: true, popular: true },
    { restaurantId: r[0].id, name: "Taboulé Frais", description: "Salade de persil, tomates, boulgour, citron et menthe", price: 3, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop", category: "Entrées", isAvailable: true, popular: false },
    { restaurantId: r[0].id, name: "Baklava Assorti", description: "Assortiment de pâtisseries orientales au miel et pistaches", price: 4, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop", category: "Desserts", isAvailable: true, popular: true },
    { restaurantId: r[0].id, name: "Jus de Grenade", description: "Jus de grenade frais pressé à la commande", price: 2, image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=400&fit=crop", category: "Boissons", isAvailable: true, popular: false },
  );

  // 2. Maman Cécile Kitchen - Congolais
  menuData.push(
    { restaurantId: r[1].id, name: "Poulet Moambe", description: "Poulet entier mijoté en sauce moambe traditionnelle avec riz blanc", price: 8, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop", category: "Plats Congolais", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Pondu au Poisson Salé", description: "Feuilles de manioc pilées à l'huile de palme avec poisson salé", price: 5, image: "https://images.unsplash.com/photo-1540914124281-342587941389?w=400&h=400&fit=crop", category: "Plats Congolais", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Liboke de Capitaine", description: "Capitaine du fleuve Congo en papillote de feuilles de bananier", price: 10, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop", category: "Plats Congolais", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Fumbwa à la Viande", description: "Légumes fumbwa à l'huile de palme avec morceaux de viande de bœuf", price: 6, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop", category: "Plats Congolais", isAvailable: true, popular: false },
    { restaurantId: r[1].id, name: "Saka Saka + Chikwangue", description: "Saka saka à la pâte d'arachide, servie avec chikwangue maison (x3)", price: 5, image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop", category: "Plats Congolais", isAvailable: true, popular: false },
    { restaurantId: r[1].id, name: "Makayabu Braisé", description: "Morue braisée sur charbon, servie avec plantains et légumes", price: 7, image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=400&fit=crop", category: "Grillades", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Kwanga Fraîche (x5)", description: "Bâtons de kwanga fraîche préparés le matin même", price: 2, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
    { restaurantId: r[1].id, name: "Bissi (Bouillon Bœuf)", description: "Bouillon de bœuf maison avec légumes et épices locales", price: 4, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop", category: "Soupes", isAvailable: true, popular: false },
  );

  // 3. Hunga Busta - Burgers & Grillades
  menuData.push(
    { restaurantId: r[2].id, name: "Classic Smash Burger", description: "Double steak haché, cheddar fondu, oignons caramélisés, sauce maison", price: 5, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[2].id, name: "Hunga Special", description: "Triple steak, triple fromage, bacon, jalapeños, sauce diable", price: 8, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[2].id, name: "Chicken Crispy Burger", description: "Blanc de poulet frit croustillant, salade coleslaw, sauce ranch", price: 5, image: "https://images.unsplash.com/photo-1615297928064-24977384d0da?w=400&h=400&fit=crop", category: "Burgers", isAvailable: true, popular: false },
    { restaurantId: r[2].id, name: "Brochettes Bœuf x4", description: "4 brochettes de bœuf local grillées, sauce tomate épicée et frites", price: 7, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop", category: "Grillades", isAvailable: true, popular: true },
    { restaurantId: r[2].id, name: "Chicken Wings 10 pcs", description: "Ailes de poulet croustillantes sauce BBQ ou piquante au choix", price: 6, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop", category: "Poulet", isAvailable: true, popular: false },
    { restaurantId: r[2].id, name: "Loaded Fries", description: "Frites maison recouvertes de fromage fondu, bacon et herbes", price: 4, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
    { restaurantId: r[2].id, name: "Milkshake Maison", description: "Milkshake épais vanille, chocolat ou fraise — 500ml", price: 3, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop", category: "Boissons", isAvailable: true, popular: false },
  );

  // 4. KFC Kinshasa - Fast Food
  menuData.push(
    { restaurantId: r[3].id, name: "Bucket 8 pièces", description: "8 morceaux de poulet croustillant recette originale avec 2 sauces", price: 10, image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop", category: "Buckets", isAvailable: true, popular: true },
    { restaurantId: r[3].id, name: "Zinger Burger", description: "Filet de poulet épicé croustillant, laitue, mayo piquante", price: 4, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[3].id, name: "Tenders 5 pcs", description: "5 tendres de poulet extra-croustillants avec sauce BBQ ou honey mustard", price: 5, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop", category: "Poulet", isAvailable: true, popular: false },
    { restaurantId: r[3].id, name: "Bucket Familial 16 pcs", description: "16 morceaux de poulet — idéal pour la famille entière", price: 18, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop", category: "Buckets", isAvailable: true, popular: true },
    { restaurantId: r[3].id, name: "Frites Large", description: "Grande portion de frites croustillantes à la KFC", price: 2, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
    { restaurantId: r[3].id, name: "Coleslaw", description: "Salade crémeuse de chou frais à la recette KFC", price: 1, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
  );

  // 5. La Bella Pizza - Pizza
  menuData.push(
    { restaurantId: r[4].id, name: "Pizza Margherita", description: "Sauce tomate San Marzano, mozzarella fior di latte, basilic frais", price: 8, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop", category: "Pizzas", isAvailable: true, popular: true },
    { restaurantId: r[4].id, name: "Pizza 4 Fromages", description: "Mozzarella, gorgonzola, parmesan, chèvre sur crème fraîche", price: 10, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop", category: "Pizzas", isAvailable: true, popular: true },
    { restaurantId: r[4].id, name: "Pizza Pepperoni", description: "Sauce tomate, mozzarella, pepperoni fumé généreux", price: 9, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop", category: "Pizzas", isAvailable: true, popular: true },
    { restaurantId: r[4].id, name: "Calzone Poulet Basilic", description: "Chausson farci poulet, champignons, ricotta et basilic", price: 9, image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop", category: "Pizzas", isAvailable: true, popular: false },
    { restaurantId: r[4].id, name: "Bruschetta Assortie", description: "3 toasts grillés aux toppings tomates, avocat et saumon fumé", price: 5, image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop", category: "Entrées", isAvailable: true, popular: false },
    { restaurantId: r[4].id, name: "Tiramisu Maison", description: "Tiramisu authentique au café et mascarpone — portion généreuse", price: 4, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop", category: "Desserts", isAvailable: true, popular: false },
  );

  // 6. Café du Fleuve Congo - Café & Brunch
  menuData.push(
    { restaurantId: r[5].id, name: "Petit-Déjeuner Fleuve", description: "Œufs brouillés, croissant beurré, jus d'orange, café au lait", price: 6, image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=400&fit=crop", category: "Petit-Déjeuner", isAvailable: true, popular: true },
    { restaurantId: r[5].id, name: "Cappuccino Spécial", description: "Double espresso, lait vapeur velouté et mousse crémeuse", price: 3, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", category: "Cafés", isAvailable: true, popular: true },
    { restaurantId: r[5].id, name: "Avocado Toast", description: "Pain de seigle grillé, avocat écrasé, œuf poché et graines de sésame", price: 5, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop", category: "Brunch", isAvailable: true, popular: true },
    { restaurantId: r[5].id, name: "Croissant Jambon-Fromage", description: "Croissant feuilleté jambon de Parme et emmental fondu", price: 4, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop", category: "Viennoiseries", isAvailable: true, popular: false },
    { restaurantId: r[5].id, name: "Smoothie Bowl Tropical", description: "Base mangue-ananas, granola maison, fruits frais du Congo", price: 5, image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=400&fit=crop", category: "Brunch", isAvailable: true, popular: false },
    { restaurantId: r[5].id, name: "Jus Fruits Frais", description: "Jus de passion, mangue ou ananas — 100% fruits locaux pressés", price: 2, image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=400&fit=crop", category: "Boissons", isAvailable: true, popular: false },
    { restaurantId: r[5].id, name: "Crêpes Sucrées x3", description: "3 crêpes fines, confiture locale, banane caramélisée et sucre glace", price: 4, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=400&fit=crop", category: "Petit-Déjeuner", isAvailable: true, popular: false },
  );

  // 7. Le Grand Saveur - Gastronomique
  menuData.push(
    { restaurantId: r[6].id, name: "Filet de Capitaine Grillé", description: "Capitaine du fleuve Congo grillé, beurre blanc aux herbes, légumes saisonniers", price: 14, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop", category: "Poissons", isAvailable: true, popular: true },
    { restaurantId: r[6].id, name: "Entrecôte Wagyu 300g", description: "Entrecôte Wagyu grillée à point, frites maison et sauce béarnaise", price: 22, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=400&fit=crop", category: "Viandes", isAvailable: true, popular: true },
    { restaurantId: r[6].id, name: "Homard à la Nantaise", description: "Demi-homard grillé, bisque maison, légumes glacés et beurre d'estragon", price: 28, image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop", category: "Fruits de Mer", isAvailable: true, popular: false },
    { restaurantId: r[6].id, name: "Salade de Langoustines", description: "Langoustines poêlées, mesclun, vinaigrette aux agrumes et parmesan", price: 12, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop", category: "Entrées", isAvailable: true, popular: false },
    { restaurantId: r[6].id, name: "Fondant Chocolat Noir", description: "Cœur coulant chocolat belge 72%, glace vanille Bourbon", price: 7, image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop", category: "Desserts", isAvailable: true, popular: true },
    { restaurantId: r[6].id, name: "Sélection de Fromages", description: "Plateau 5 fromages affinés, confiture de figues et pain de campagne", price: 10, image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop", category: "Fromages", isAvailable: true, popular: false },
    { restaurantId: r[6].id, name: "Velouté de Courge", description: "Velouté de butternut, crème fouettée, noisettes torréfiées et huile de truffe", price: 6, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop", category: "Entrées", isAvailable: true, popular: false },
  );

  await db.insert(menuItems).values(menuData);

  // Service Categories
  const cats = await db.insert(serviceCategories).values([
    {
      name: "Coiffure",
      icon: "Scissors",
      description: "Tresses, nattes, perruques, défrisage, coloration et coupes professionnelles à domicile",
      isActive: true,
    },
    {
      name: "Pédicure & Manucure",
      icon: "Hand",
      description: "Soins complets des ongles, nail art, soins des pieds et massage relaxant à domicile",
      isActive: true,
    },
    {
      name: "Massage & Bien-être",
      icon: "Heart",
      description: "Massages relaxants, thérapeutiques et sportifs par des professionnels certifiés",
      isActive: true,
    },
    {
      name: "Ménage à domicile",
      icon: "Home",
      description: "Nettoyage professionnel de votre domicile — cuisine, salles de bain, sols et vitres",
      isActive: true,
    },
  ]).returning();

  const [coiffure, pedicure] = cats;

  await db.insert(serviceCatalogItems).values([
    // Coiffure
    { categoryId: coiffure.id, name: "Tresses Box Braids", description: "Tresses box braids longues ou courtes, durée ~4h", imageUrl: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=400&h=400&fit=crop", price: "$15–$35", isActive: true, sortOrder: 1 },
    { categoryId: coiffure.id, name: "Nattes Collées (Cornrows)", description: "Nattes collées simples ou avec motifs créatifs", imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop", price: "$10–$25", isActive: true, sortOrder: 2 },
    { categoryId: coiffure.id, name: "Pose de Perruque", description: "Installation et coiffage de perruque frontale ou full lace", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop", price: "$20–$50", isActive: true, sortOrder: 3 },
    { categoryId: coiffure.id, name: "Défrisage & Lissage", description: "Défrisage chimique ou lissage brésilien kératine", imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop", price: "$15–$40", isActive: true, sortOrder: 4 },
    { categoryId: coiffure.id, name: "Coloration Cheveux", description: "Coloration complète ou mèches, toutes nuances disponibles", imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop", price: "$20–$45", isActive: true, sortOrder: 5 },
    { categoryId: coiffure.id, name: "Coupe & Brushing Femme", description: "Coupe, shampooing et brushing professionnel à domicile", imageUrl: "https://images.unsplash.com/photo-1560066984-138daaa5a68f?w=400&h=400&fit=crop", price: "$10–$20", isActive: true, sortOrder: 6 },
    { categoryId: coiffure.id, name: "Coupe Homme", description: "Coupe dégradé, barbe et styling pour hommes à domicile", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop", price: "$5–$15", isActive: true, sortOrder: 7 },
    { categoryId: coiffure.id, name: "Dreadlocks", description: "Création, entretien et retouche de dreadlocks naturelles", imageUrl: "https://images.unsplash.com/photo-1590334841786-a24e59beba6a?w=400&h=400&fit=crop", price: "$25–$60", isActive: true, sortOrder: 8 },

    // Pédicure & Manucure
    { categoryId: pedicure.id, name: "Soins Ongles Pieds Complet", description: "Coupe, lime, repousse cuticules et soin hydratant", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", price: "$8–$15", isActive: true, sortOrder: 1 },
    { categoryId: pedicure.id, name: "Vernis Classique", description: "Application vernis couleur longue durée — pieds ou mains", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", price: "$5–$10", isActive: true, sortOrder: 2 },
    { categoryId: pedicure.id, name: "Nail Art Créatif", description: "Décoration personnalisée, motifs, strass et dégradés artistiques", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", price: "$10–$25", isActive: true, sortOrder: 3 },
    { categoryId: pedicure.id, name: "Pédicure Spa Relaxant", description: "Bain de pieds, gommage, masque hydratant et massage", imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=400&fit=crop", price: "$15–$30", isActive: true, sortOrder: 4 },
    { categoryId: pedicure.id, name: "Faux Ongles Gel", description: "Pose de faux ongles en gel — naturel ou couleur, toutes longueurs", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", price: "$20–$40", isActive: true, sortOrder: 5 },
    { categoryId: pedicure.id, name: "Soins Callosités", description: "Traitement professionnel des callosités et peaux mortes", imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=400&fit=crop", price: "$10–$20", isActive: true, sortOrder: 6 },
    { categoryId: pedicure.id, name: "Massage Réflexologie Pieds", description: "Massage réflexologie 30min — détente profonde et rééquilibrage", imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=400&fit=crop", price: "$15–$25", isActive: true, sortOrder: 7 },
    { categoryId: pedicure.id, name: "Soins Complets Mains", description: "Manucure complète : lime, cuticules, soin + vernis au choix", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", price: "$8–$18", isActive: true, sortOrder: 8 },
  ]);

  console.log("Database seeded successfully!");
}
