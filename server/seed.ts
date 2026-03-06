import { db } from "./db";
import { users, restaurants, menuItems, orders } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(restaurants);
  if (Number(existing.count) > 0) return;

  console.log("Seeding database...");

  await db.insert(users).values([
    { email: "admin@maweja.cd", password: "admin123", name: "Admin MAWEJA", phone: "0819994041", role: "admin", walletBalance: 0, loyaltyPoints: 0, isOnline: true },
    { email: "client@test.cd", password: "test123", name: "Patrick Kabongo", phone: "0812345678", role: "client", walletBalance: 15000, loyaltyPoints: 250, isOnline: false },
    { email: "client2@test.cd", password: "test123", name: "Marie Lukusa", phone: "0898765432", role: "client", walletBalance: 8000, loyaltyPoints: 120, isOnline: false },
    { email: "driver1@maweja.cd", password: "driver123", name: "Jean-Pierre Mutombo", phone: "0823456789", role: "driver", walletBalance: 45000, loyaltyPoints: 0, isOnline: true, lat: -4.3217, lng: 15.3125 },
    { email: "driver2@maweja.cd", password: "driver123", name: "David Tshimanga", phone: "0834567890", role: "driver", walletBalance: 32000, loyaltyPoints: 0, isOnline: true, lat: -4.3150, lng: 15.2980 },
    { email: "driver3@maweja.cd", password: "driver123", name: "Samuel Ilunga", phone: "0845678901", role: "driver", walletBalance: 28000, loyaltyPoints: 0, isOnline: false, lat: -4.3280, lng: 15.3050 },
    { email: "driver4@maweja.cd", password: "driver123", name: "Joseph Kalala", phone: "0856789012", role: "driver", walletBalance: 52000, loyaltyPoints: 0, isOnline: true, lat: -4.3100, lng: 15.3200 },
  ]);

  const restaurantData = [
    { name: "Aldar Restaurant", description: "Cuisine libanaise et internationale au coeur de Kinshasa", cuisine: "Libanais", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop", address: "Avenue du Commerce, Gombe", rating: 4.7, deliveryTime: "30-45 min", deliveryFee: 2500, minOrder: 5000, isActive: true, lat: -4.3106, lng: 15.3139 },
    { name: "KFC Kinshasa", description: "Le poulet croustillant prefere de Kinshasa", cuisine: "Fast Food", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop", address: "Boulevard du 30 Juin, Gombe", rating: 4.3, deliveryTime: "20-35 min", deliveryFee: 2000, minOrder: 3000, isActive: true, lat: -4.3150, lng: 15.3100 },
    { name: "Hunga Busta", description: "Les meilleurs burgers et grillades de Kin", cuisine: "Burgers", image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop", address: "Avenue de la Liberation, Gombe", rating: 4.5, deliveryTime: "25-40 min", deliveryFee: 2000, minOrder: 4000, isActive: true, lat: -4.3180, lng: 15.3060 },
    { name: "Hilton Kinshasa", description: "Cuisine gastronomique avec vue sur le fleuve Congo", cuisine: "Gastronomique", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop", address: "Boulevard du 30 Juin, Gombe", rating: 4.8, deliveryTime: "40-55 min", deliveryFee: 5000, minOrder: 15000, isActive: true, lat: -4.3120, lng: 15.3080 },
    { name: "Golden Tulip", description: "Restaurant d'hotel avec buffet varie", cuisine: "International", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=600&h=400&fit=crop", address: "Avenue Batetela, Gombe", rating: 4.6, deliveryTime: "35-50 min", deliveryFee: 4000, minOrder: 10000, isActive: true, lat: -4.3200, lng: 15.3150 },
    { name: "Kin Marche", description: "Marche local avec produits congolais authentiques", cuisine: "Congolais", image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop", address: "Marche Central, Kinshasa", rating: 4.1, deliveryTime: "30-45 min", deliveryFee: 2000, minOrder: 5000, isActive: true, lat: -4.3250, lng: 15.3100 },
    { name: "La Terrasse Gombe", description: "Restaurant terrasse avec ambiance decontractee", cuisine: "Grillades", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop", address: "Avenue de la Justice, Gombe", rating: 4.4, deliveryTime: "25-40 min", deliveryFee: 2500, minOrder: 6000, isActive: true, lat: -4.3170, lng: 15.3180 },
    { name: "City Market", description: "Supermarche avec livraison de produits frais", cuisine: "Supermarche", image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop", address: "Avenue Colonel Mondjiba, Ngaliema", rating: 4.2, deliveryTime: "35-50 min", deliveryFee: 3000, minOrder: 8000, isActive: true, lat: -4.3300, lng: 15.2900 },
  ];
  const insertedRestaurants = await db.insert(restaurants).values(restaurantData).returning();

  const menuData: any[] = [];
  const r = insertedRestaurants;

  // Aldar
  menuData.push(
    { restaurantId: r[0].id, name: "Houmous", description: "Puree de pois chiches avec tahini", price: 4500, image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=300&h=300&fit=crop", category: "Entrees", isAvailable: true, popular: false },
    { restaurantId: r[0].id, name: "Shawarma Poulet", description: "Poulet marine grille avec sauce ail", price: 7500, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: true },
    { restaurantId: r[0].id, name: "Falafel", description: "Boulettes de pois chiches frites", price: 5500, image: "https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: false },
    { restaurantId: r[0].id, name: "Mixed Grill", description: "Assortiment de viandes grillees avec riz", price: 15000, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: true },
    { restaurantId: r[0].id, name: "Baklava", description: "Patisserie feuilletee au miel", price: 3500, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=300&h=300&fit=crop", category: "Desserts", isAvailable: true, popular: false },
  );
  // KFC
  menuData.push(
    { restaurantId: r[1].id, name: "Bucket 8 pieces", description: "8 morceaux de poulet croustillant", price: 18000, image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop", category: "Buckets", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Zinger Burger", description: "Burger poulet epice avec salade", price: 6500, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[1].id, name: "Tenders 5 pcs", description: "5 tendres de poulet avec sauce", price: 7000, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop", category: "Poulet", isAvailable: true, popular: false },
    { restaurantId: r[1].id, name: "Frites Large", description: "Grandes frites croustillantes", price: 3000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
  );
  // Hunga Busta
  menuData.push(
    { restaurantId: r[2].id, name: "Classic Burger", description: "Boeuf grille, cheddar, laitue, tomate", price: 8000, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[2].id, name: "Double Smash", description: "Double steak, double fromage", price: 12000, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop", category: "Burgers", isAvailable: true, popular: true },
    { restaurantId: r[2].id, name: "Chicken Wings 10pcs", description: "Ailes de poulet sauce BBQ", price: 9000, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=300&fit=crop", category: "Poulet", isAvailable: true, popular: false },
    { restaurantId: r[2].id, name: "Brochettes Boeuf", description: "4 brochettes de boeuf avec frites", price: 11000, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop", category: "Grillades", isAvailable: true, popular: false },
  );
  // Hilton
  menuData.push(
    { restaurantId: r[3].id, name: "Filet de Capitaine", description: "Poisson du fleuve grille, sauce beurre blanc", price: 18000, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: true },
    { restaurantId: r[3].id, name: "Entrecote Grillee", description: "Entrecote 300g avec frites maison", price: 22000, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: true },
    { restaurantId: r[3].id, name: "Tiramisu", description: "Dessert italien classique", price: 8000, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=300&fit=crop", category: "Desserts", isAvailable: true, popular: false },
  );
  // Golden Tulip
  menuData.push(
    { restaurantId: r[4].id, name: "Poulet Moambe", description: "Poulet traditionnel en sauce moambe", price: 14000, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=300&fit=crop", category: "Congolais", isAvailable: true, popular: true },
    { restaurantId: r[4].id, name: "Poisson Braise", description: "Poisson entier braise avec plantains", price: 16000, image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=300&h=300&fit=crop", category: "Congolais", isAvailable: true, popular: true },
    { restaurantId: r[4].id, name: "Pasta Carbonara", description: "Spaghetti creme, lardons, parmesan", price: 11000, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: false },
  );
  // Kin Marche
  menuData.push(
    { restaurantId: r[5].id, name: "Fumbwa", description: "Legumes fumbwa a l'huile de palme", price: 5000, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=300&fit=crop", category: "Congolais", isAvailable: true, popular: true },
    { restaurantId: r[5].id, name: "Pondu", description: "Feuilles de manioc pilees", price: 4500, image: "https://images.unsplash.com/photo-1540914124281-342587941389?w=300&h=300&fit=crop", category: "Congolais", isAvailable: true, popular: true },
    { restaurantId: r[5].id, name: "Chikwangue", description: "Pain de manioc traditionnel (x4)", price: 2500, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop", category: "Accompagnements", isAvailable: true, popular: false },
    { restaurantId: r[5].id, name: "Saka Saka", description: "Feuilles de manioc pate d'arachide", price: 5500, image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=300&fit=crop", category: "Congolais", isAvailable: true, popular: false },
  );
  // La Terrasse
  menuData.push(
    { restaurantId: r[6].id, name: "Brochettes Chevre", description: "Brochettes de viande de chevre", price: 10000, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop", category: "Grillades", isAvailable: true, popular: true },
    { restaurantId: r[6].id, name: "Liboke de Poisson", description: "Poisson en papillote de feuilles", price: 13000, image: "https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=300&h=300&fit=crop", category: "Plats", isAvailable: true, popular: true },
    { restaurantId: r[6].id, name: "Biere Primus", description: "Biere locale congolaise fraiche", price: 2500, image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&h=300&fit=crop", category: "Boissons", isAvailable: true, popular: false },
  );
  // City Market
  menuData.push(
    { restaurantId: r[7].id, name: "Panier Fruits", description: "Assortiment de fruits frais", price: 6000, image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=300&fit=crop", category: "Fruits", isAvailable: true, popular: false },
    { restaurantId: r[7].id, name: "Poulet Entier", description: "Poulet frais local", price: 8500, image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&h=300&fit=crop", category: "Viandes", isAvailable: true, popular: true },
    { restaurantId: r[7].id, name: "Riz 5kg", description: "Riz long grain premium", price: 7500, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop", category: "Epicerie", isAvailable: true, popular: false },
  );

  await db.insert(menuItems).values(menuData);

  // Seed some demo orders
  await db.insert(orders).values([
    { orderNumber: "MAW-001", clientId: 2, restaurantId: r[0].id, driverId: 4, status: "delivered", items: JSON.stringify([{name:"Shawarma Poulet",qty:2,price:7500},{name:"Houmous",qty:1,price:4500}]), subtotal: 19500, deliveryFee: 2500, total: 22000, paymentMethod: "mobile_money", paymentStatus: "paid", deliveryAddress: "123 Avenue Kasavubu, Kinshasa" },
    { orderNumber: "MAW-002", clientId: 3, restaurantId: r[1].id, driverId: 5, status: "picked_up", items: JSON.stringify([{name:"Bucket 8 pieces",qty:1,price:18000},{name:"Frites Large",qty:2,price:3000}]), subtotal: 24000, deliveryFee: 2000, total: 26000, paymentMethod: "wallet", paymentStatus: "paid", deliveryAddress: "45 Blvd Lumumba, Gombe" },
    { orderNumber: "MAW-003", clientId: 2, restaurantId: r[2].id, status: "pending", items: JSON.stringify([{name:"Classic Burger",qty:1,price:8000},{name:"Double Smash",qty:1,price:12000}]), subtotal: 20000, deliveryFee: 2000, total: 22000, paymentMethod: "cash", paymentStatus: "pending", deliveryAddress: "78 Rue de la Paix, Gombe" },
  ]);

  console.log("Database seeded successfully!");
}
