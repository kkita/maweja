export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  coverImage: string;
  address: string;
  description: string;
  featured: boolean;
  promo?: string;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantName: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  discount: string;
  bgColor: string;
  textColor: string;
}

export const categories: Category[] = [
  { id: 1, name: "Burger", icon: "burger" },
  { id: 2, name: "Pizza", icon: "pizza" },
  { id: 3, name: "Sushi", icon: "sushi" },
  { id: 4, name: "Poulet", icon: "chicken" },
  { id: 5, name: "Africain", icon: "african" },
  { id: 6, name: "Desserts", icon: "dessert" },
  { id: 7, name: "Boissons", icon: "drinks" },
  { id: 8, name: "Grillades", icon: "grill" },
];

export const promotions: Promotion[] = [
  {
    id: 1,
    title: "Offre Speciale",
    subtitle: "Livraison gratuite sur votre 1ere commande",
    discount: "-30%",
    bgColor: "from-orange-500 to-red-500",
    textColor: "text-white",
  },
  {
    id: 2,
    title: "Happy Hour",
    subtitle: "De 12h a 14h sur tous les menus",
    discount: "-20%",
    bgColor: "from-violet-500 to-purple-600",
    textColor: "text-white",
  },
  {
    id: 3,
    title: "Weekend Deal",
    subtitle: "Combo famille a prix reduit",
    discount: "-25%",
    bgColor: "from-emerald-500 to-teal-600",
    textColor: "text-white",
  },
];

export const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "Aldar",
    cuisine: "Libanais & Grillades",
    rating: 4.8,
    reviewCount: 342,
    deliveryTime: "25-35 min",
    deliveryFee: 2.5,
    image: "",
    coverImage: "",
    address: "Boulevard du 30 Juin, Gombe",
    description: "Restaurant libanais haut de gamme proposant grillades, mezze et specialites orientales dans un cadre elegant au coeur de Kinshasa.",
    featured: true,
    promo: "-15%",
  },
  {
    id: 2,
    name: "KFC",
    cuisine: "Fast-Food & Poulet",
    rating: 4.5,
    reviewCount: 567,
    deliveryTime: "15-25 min",
    deliveryFee: 1.5,
    image: "",
    coverImage: "",
    address: "Avenue du Commerce, Gombe",
    description: "Le poulet croustillant que tout le monde aime. Buckets, tenders, wraps et accompagnements savoureux.",
    featured: true,
    promo: "-20%",
  },
  {
    id: 3,
    name: "Hunga Busta",
    cuisine: "Burger & Americain",
    rating: 4.6,
    reviewCount: 289,
    deliveryTime: "20-30 min",
    deliveryFee: 2.0,
    image: "",
    coverImage: "",
    address: "Avenue de la Justice, Gombe",
    description: "Les meilleurs burgers de Kinshasa. Viande de qualite, frites maison et milkshakes cremeux.",
    featured: true,
  },
  {
    id: 4,
    name: "City Market",
    cuisine: "International & Traiteur",
    rating: 4.4,
    reviewCount: 198,
    deliveryTime: "30-40 min",
    deliveryFee: 2.0,
    image: "",
    coverImage: "",
    address: "Avenue Colonel Mondjiba, Ngaliema",
    description: "Supermarche et traiteur offrant une large selection de plats prepares, salades fraiches et produits gourmets.",
    featured: false,
    promo: "-10%",
  },
  {
    id: 5,
    name: "Hilton Kinshasa",
    cuisine: "Gastronomique",
    rating: 4.9,
    reviewCount: 156,
    deliveryTime: "35-50 min",
    deliveryFee: 3.0,
    image: "",
    coverImage: "",
    address: "Boulevard du 30 Juin, Gombe",
    description: "Cuisine gastronomique internationale du Grand Hotel Hilton. Buffet, carte raffinee et patisseries d'exception.",
    featured: true,
  },
  {
    id: 6,
    name: "Golden Tulip",
    cuisine: "Cuisine Internationale",
    rating: 4.7,
    reviewCount: 234,
    deliveryTime: "30-45 min",
    deliveryFee: 2.5,
    image: "",
    coverImage: "",
    address: "Avenue Batetela, Gombe",
    description: "Le restaurant du Golden Tulip propose une cuisine internationale de qualite, des grillades et des specialites congolaises revisitees.",
    featured: true,
    promo: "-15%",
  },
  {
    id: 7,
    name: "Kin Marche",
    cuisine: "Congolais & Traiteur",
    rating: 4.6,
    reviewCount: 412,
    deliveryTime: "25-35 min",
    deliveryFee: 1.5,
    image: "",
    coverImage: "",
    address: "Avenue de la Liberte, Masina",
    description: "Traiteur congolais authentique. Poulet a la braise, poisson sale, pondu, fufu et specialites locales preparees avec soin.",
    featured: true,
    promo: "-25%",
  },
  {
    id: 8,
    name: "La Terrasse Gombe",
    cuisine: "Francais & Brunch",
    rating: 4.5,
    reviewCount: 178,
    deliveryTime: "25-35 min",
    deliveryFee: 2.0,
    image: "",
    coverImage: "",
    address: "Avenue Roi Baudouin, Gombe",
    description: "Cuisine francaise et brunch dans un cadre decontracte. Croissants, salades, steaks et vins fins.",
    featured: false,
  },
];

export const menuItems: MenuItem[] = [
  { id: 1, restaurantId: 1, name: "Shawarma Mixte", description: "Melange poulet et viande, crudites, sauce ail maison", price: 12.00, image: "", category: "Wraps", popular: true },
  { id: 2, restaurantId: 1, name: "Mezze Libanais", description: "Houmous, baba ganoush, taboulé, fattouch, pain pita", price: 15.00, image: "", category: "Entrees", popular: true },
  { id: 3, restaurantId: 1, name: "Brochettes Mixtes", description: "Brochettes de poulet, kefta et agneau grillees", price: 22.00, image: "", category: "Grillades", popular: true },
  { id: 4, restaurantId: 1, name: "Falafel Assiette", description: "Falafels croustillants, salade, houmous, tahini", price: 10.00, image: "", category: "Plats", popular: false },
  { id: 5, restaurantId: 1, name: "Kebbe Frit (6 pcs)", description: "Boulettes de viande et boulgour frites", price: 9.00, image: "", category: "Entrees", popular: false },
  { id: 6, restaurantId: 1, name: "Baklava (4 pcs)", description: "Patisserie feuilletee aux pistaches et miel", price: 6.00, image: "", category: "Desserts", popular: false },

  { id: 7, restaurantId: 2, name: "Bucket 8 Pieces", description: "8 morceaux de poulet croustillant Original Recipe", price: 18.00, image: "", category: "Buckets", popular: true },
  { id: 8, restaurantId: 2, name: "Zinger Burger", description: "Filet de poulet croustillant pimente, salade, mayo", price: 8.50, image: "", category: "Burgers", popular: true },
  { id: 9, restaurantId: 2, name: "Mighty Bucket", description: "4 tenders, 2 pieces poulet, frites, coleslaw, boisson", price: 15.00, image: "", category: "Buckets", popular: true },
  { id: 10, restaurantId: 2, name: "Tenders (5 pcs)", description: "Morceaux de blanc de poulet croustillants", price: 9.50, image: "", category: "Poulet", popular: false },
  { id: 11, restaurantId: 2, name: "Frites Large", description: "Portion large de frites dorees et croustillantes", price: 4.00, image: "", category: "Accompagnements", popular: false },
  { id: 12, restaurantId: 2, name: "Coleslaw", description: "Salade de chou frais, carottes et mayo", price: 3.00, image: "", category: "Accompagnements", popular: false },

  { id: 13, restaurantId: 3, name: "Classic Smash Burger", description: "Double viande Angus, cheddar fondu, sauce speciale", price: 13.50, image: "", category: "Burgers", popular: true },
  { id: 14, restaurantId: 3, name: "BBQ Bacon Burger", description: "Viande grillée, bacon croustillant, oignons caramelises, sauce BBQ", price: 15.00, image: "", category: "Burgers", popular: true },
  { id: 15, restaurantId: 3, name: "Chicken Burger", description: "Filet de poulet pane, salade, tomate, mayo", price: 11.00, image: "", category: "Burgers", popular: false },
  { id: 16, restaurantId: 3, name: "Loaded Fries", description: "Frites garnies de cheddar, bacon et sauce", price: 8.00, image: "", category: "Sides", popular: true },
  { id: 17, restaurantId: 3, name: "Milkshake Oreo", description: "Milkshake cremeux aux biscuits Oreo", price: 6.50, image: "", category: "Boissons", popular: false },

  { id: 18, restaurantId: 4, name: "Salade Cesar", description: "Laitue romaine, poulet grille, parmesan, croutons", price: 11.00, image: "", category: "Salades", popular: true },
  { id: 19, restaurantId: 4, name: "Lasagne Maison", description: "Couches de pates, bolognaise, bechamel, fromage gratine", price: 14.00, image: "", category: "Plats Chauds", popular: true },
  { id: 20, restaurantId: 4, name: "Quiche Lorraine", description: "Quiche aux lardons, oeufs et fromage", price: 8.50, image: "", category: "Snacks", popular: false },
  { id: 21, restaurantId: 4, name: "Wrap Poulet Avocat", description: "Tortilla, poulet, avocat, crudites, sauce ranch", price: 10.00, image: "", category: "Wraps", popular: true },
  { id: 22, restaurantId: 4, name: "Jus de Fruits Frais", description: "Jus presse du jour (orange, ananas ou mangue)", price: 4.50, image: "", category: "Boissons", popular: false },

  { id: 23, restaurantId: 5, name: "Filet de Boeuf Grille", description: "Filet de boeuf, sauce au poivre, legumes de saison", price: 35.00, image: "", category: "Plats", popular: true },
  { id: 24, restaurantId: 5, name: "Saumon Teriyaki", description: "Pave de saumon glace teriyaki, riz parfume", price: 28.00, image: "", category: "Plats", popular: true },
  { id: 25, restaurantId: 5, name: "Club Sandwich Hilton", description: "Triple etage, poulet, bacon, oeuf, frites", price: 18.00, image: "", category: "Snacks", popular: true },
  { id: 26, restaurantId: 5, name: "Creme Brulee", description: "Creme vanille, caramel croustillant", price: 10.00, image: "", category: "Desserts", popular: false },
  { id: 27, restaurantId: 5, name: "Salade Nicoise", description: "Thon, olives, oeufs, tomates, haricots verts", price: 16.00, image: "", category: "Entrees", popular: false },

  { id: 28, restaurantId: 6, name: "Brochettes de Capitaine", description: "Poisson capitaine grille, legumes, sauce citron", price: 22.00, image: "", category: "Poissons", popular: true },
  { id: 29, restaurantId: 6, name: "Cote de Boeuf (500g)", description: "Cote de boeuf grillee, frites, salade verte", price: 30.00, image: "", category: "Grillades", popular: true },
  { id: 30, restaurantId: 6, name: "Risotto aux Champignons", description: "Riz arborio, champignons, parmesan, truffe", price: 18.00, image: "", category: "Plats", popular: false },
  { id: 31, restaurantId: 6, name: "Salade Golden", description: "Mesclun, chevre chaud, noix, miel", price: 13.00, image: "", category: "Entrees", popular: false },
  { id: 32, restaurantId: 6, name: "Tiramisu Maison", description: "Mascarpone, cafe, cacao, biscuits", price: 9.00, image: "", category: "Desserts", popular: true },

  { id: 33, restaurantId: 7, name: "Poulet a la Braise", description: "Demi-poulet braise, bananes plantains, pili pili", price: 12.00, image: "", category: "Plats", popular: true },
  { id: 34, restaurantId: 7, name: "Poisson Sale Grille", description: "Poisson sale grille, chikwangue, pondu", price: 14.00, image: "", category: "Plats", popular: true },
  { id: 35, restaurantId: 7, name: "Fufu & Pondu", description: "Fufu de manioc frais avec sauce aux feuilles de manioc", price: 10.00, image: "", category: "Plats", popular: true },
  { id: 36, restaurantId: 7, name: "Liboke de Poisson", description: "Poisson cuit a la vapeur dans des feuilles de bananier", price: 16.00, image: "", category: "Plats", popular: true },
  { id: 37, restaurantId: 7, name: "Sambusa (6 pcs)", description: "Beignets triangulaires farcis a la viande", price: 5.00, image: "", category: "Entrees", popular: false },
  { id: 38, restaurantId: 7, name: "Jus de Tangawisi", description: "Boisson fraiche au gingembre et citron", price: 3.00, image: "", category: "Boissons", popular: false },

  { id: 39, restaurantId: 8, name: "Entrecote Grillee", description: "Entrecote, beurre maitre d'hotel, frites maison", price: 24.00, image: "", category: "Plats", popular: true },
  { id: 40, restaurantId: 8, name: "Croissant Jambon Fromage", description: "Croissant beurre garni de jambon et gruyere", price: 7.00, image: "", category: "Brunch", popular: true },
  { id: 41, restaurantId: 8, name: "Omelette Champignons", description: "Omelette aux champignons, fromage, herbes fraiches", price: 9.00, image: "", category: "Brunch", popular: false },
  { id: 42, restaurantId: 8, name: "Tarte au Chocolat", description: "Tarte fondante au chocolat noir, creme anglaise", price: 8.00, image: "", category: "Desserts", popular: true },
  { id: 43, restaurantId: 8, name: "Cafe Latte", description: "Espresso, lait mousse, art latte", price: 4.50, image: "", category: "Boissons", popular: false },
];

export const SERVICE_FEE = 0.99;

export function getRestaurantById(id: number): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}

export function getMenuByRestaurant(restaurantId: number): MenuItem[] {
  return menuItems.filter(m => m.restaurantId === restaurantId);
}

export function getMenuCategories(restaurantId: number): string[] {
  const items = getMenuByRestaurant(restaurantId);
  return [...new Set(items.map(i => i.category))];
}

export function getPopularItems(restaurantId: number): MenuItem[] {
  return getMenuByRestaurant(restaurantId).filter(i => i.popular);
}

export function getFeaturedRestaurants(): Restaurant[] {
  return restaurants.filter(r => r.featured);
}

export function searchRestaurants(query: string): Restaurant[] {
  const q = query.toLowerCase();
  return restaurants.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.cuisine.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q)
  );
}
