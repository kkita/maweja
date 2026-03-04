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
    name: "Le Gourmet Parisien",
    cuisine: "Francais",
    rating: 4.8,
    reviewCount: 342,
    deliveryTime: "25-35 min",
    deliveryFee: 2.5,
    image: "",
    coverImage: "",
    address: "12 Avenue des Champs",
    description: "Cuisine francaise raffinee avec des ingredients frais et locaux. Notre chef etoile vous propose une experience culinaire unique.",
    featured: true,
    promo: "-15%",
  },
  {
    id: 2,
    name: "Mama Africa",
    cuisine: "Africain",
    rating: 4.6,
    reviewCount: 218,
    deliveryTime: "30-45 min",
    deliveryFee: 1.5,
    image: "",
    coverImage: "",
    address: "45 Rue de la Paix",
    description: "Saveurs authentiques d'Afrique. Poulet braise, poisson grille, et plats traditionnels prepares avec amour.",
    featured: true,
    promo: "-20%",
  },
  {
    id: 3,
    name: "Tokyo Ramen House",
    cuisine: "Japonais",
    rating: 4.7,
    reviewCount: 189,
    deliveryTime: "20-30 min",
    deliveryFee: 2.0,
    image: "",
    coverImage: "",
    address: "8 Boulevard Nippon",
    description: "Les meilleurs ramens et sushis de la ville. Ingredients importes directement du Japon.",
    featured: true,
  },
  {
    id: 4,
    name: "Pizza Napoli",
    cuisine: "Italien",
    rating: 4.5,
    reviewCount: 456,
    deliveryTime: "20-25 min",
    deliveryFee: 1.0,
    image: "",
    coverImage: "",
    address: "23 Via Roma",
    description: "Pizzas artisanales cuites au feu de bois. Pate fraiche preparee chaque jour selon la tradition napolitaine.",
    featured: false,
    promo: "-10%",
  },
  {
    id: 5,
    name: "Burger Factory",
    cuisine: "Americain",
    rating: 4.4,
    reviewCount: 567,
    deliveryTime: "15-25 min",
    deliveryFee: 1.5,
    image: "",
    coverImage: "",
    address: "67 Main Street",
    description: "Burgers gourmet avec du boeuf 100% Angus. Frites maison et milkshakes artisanaux.",
    featured: false,
  },
  {
    id: 6,
    name: "Le Jardin Thai",
    cuisine: "Thailandais",
    rating: 4.6,
    reviewCount: 234,
    deliveryTime: "25-35 min",
    deliveryFee: 2.0,
    image: "",
    coverImage: "",
    address: "15 Rue du Temple",
    description: "Cuisine thailandaise authentique. Pad thai, curry vert, et specialites de Bangkok.",
    featured: true,
  },
  {
    id: 7,
    name: "Chez Fatou",
    cuisine: "Senegalais",
    rating: 4.9,
    reviewCount: 178,
    deliveryTime: "35-45 min",
    deliveryFee: 1.5,
    image: "",
    coverImage: "",
    address: "34 Avenue Dakar",
    description: "Le meilleur thieboudienne de la ville. Cuisine senegalaise traditionnelle faite maison.",
    featured: true,
    promo: "-25%",
  },
  {
    id: 8,
    name: "Shawarma King",
    cuisine: "Libanais",
    rating: 4.5,
    reviewCount: 312,
    deliveryTime: "15-20 min",
    deliveryFee: 1.0,
    image: "",
    coverImage: "",
    address: "9 Rue du Liban",
    description: "Shawarmas, falafels et mezze prepares avec des epices authentiques du Moyen-Orient.",
    featured: false,
  },
];

export const menuItems: MenuItem[] = [
  { id: 1, restaurantId: 1, name: "Filet de Boeuf Rossini", description: "Filet de boeuf, foie gras poele, sauce truffe", price: 28.50, image: "", category: "Plats", popular: true },
  { id: 2, restaurantId: 1, name: "Salade Nicoise", description: "Thon frais, olives, oeufs, tomates, haricots verts", price: 14.00, image: "", category: "Entrees", popular: false },
  { id: 3, restaurantId: 1, name: "Creme Brulee", description: "Creme vanille, caramel croustillant", price: 8.50, image: "", category: "Desserts", popular: true },
  { id: 4, restaurantId: 1, name: "Soupe a l'Oignon", description: "Soupe gratinee traditionnelle", price: 9.00, image: "", category: "Entrees", popular: false },
  { id: 5, restaurantId: 1, name: "Coq au Vin", description: "Poulet mijoté au vin rouge, champignons, lardons", price: 22.00, image: "", category: "Plats", popular: true },
  { id: 6, restaurantId: 1, name: "Tarte Tatin", description: "Tarte aux pommes caramelisees", price: 9.50, image: "", category: "Desserts", popular: false },

  { id: 7, restaurantId: 2, name: "Poulet Braise", description: "Poulet marine grille, servi avec plantains et attiéké", price: 15.00, image: "", category: "Plats", popular: true },
  { id: 8, restaurantId: 2, name: "Poisson Grille Tilapia", description: "Tilapia entier grille, sauce tomate pimentée", price: 18.00, image: "", category: "Plats", popular: true },
  { id: 9, restaurantId: 2, name: "Alloco", description: "Bananes plantains frites avec piment", price: 6.00, image: "", category: "Accompagnements", popular: false },
  { id: 10, restaurantId: 2, name: "Ndole", description: "Feuilles ameres, crevettes, arachides", price: 16.00, image: "", category: "Plats", popular: true },
  { id: 11, restaurantId: 2, name: "Jus de Gingembre", description: "Boisson fraiche au gingembre et citron", price: 3.50, image: "", category: "Boissons", popular: false },
  { id: 12, restaurantId: 2, name: "Beignets Haricots", description: "Beignets croustillants aux haricots noirs", price: 5.00, image: "", category: "Entrees", popular: false },

  { id: 13, restaurantId: 3, name: "Ramen Tonkotsu", description: "Bouillon porc, chashu, oeuf mollet, nori", price: 16.50, image: "", category: "Ramens", popular: true },
  { id: 14, restaurantId: 3, name: "Sushi Mix (12 pieces)", description: "Assortiment de sashimi, maki et nigiri", price: 22.00, image: "", category: "Sushis", popular: true },
  { id: 15, restaurantId: 3, name: "Gyoza (6 pieces)", description: "Raviolis japonais au porc grilles", price: 8.00, image: "", category: "Entrees", popular: false },
  { id: 16, restaurantId: 3, name: "Tempura Crevettes", description: "Crevettes en beignet croustillant, sauce tentsuyu", price: 14.00, image: "", category: "Entrees", popular: true },
  { id: 17, restaurantId: 3, name: "Mochi Glacé (3 pieces)", description: "Glace enrobee de pate de riz", price: 7.50, image: "", category: "Desserts", popular: false },

  { id: 18, restaurantId: 4, name: "Margherita", description: "Sauce tomate, mozzarella, basilic frais", price: 11.00, image: "", category: "Pizzas", popular: true },
  { id: 19, restaurantId: 4, name: "Quattro Formaggi", description: "Mozzarella, gorgonzola, parmesan, chevre", price: 14.00, image: "", category: "Pizzas", popular: true },
  { id: 20, restaurantId: 4, name: "Diavola", description: "Salami piquant, poivrons, olives noires", price: 13.50, image: "", category: "Pizzas", popular: false },
  { id: 21, restaurantId: 4, name: "Tiramisu", description: "Mascarpone, cafe, cacao", price: 7.00, image: "", category: "Desserts", popular: true },
  { id: 22, restaurantId: 4, name: "Bruschetta (4 pieces)", description: "Pain grille, tomates fraiches, ail, basilic", price: 8.50, image: "", category: "Entrees", popular: false },

  { id: 23, restaurantId: 5, name: "Classic Smash Burger", description: "Double boeuf Angus, cheddar, sauce speciale", price: 13.50, image: "", category: "Burgers", popular: true },
  { id: 24, restaurantId: 5, name: "Bacon Cheese Burger", description: "Boeuf, bacon croustillant, cheddar, oignons frits", price: 15.00, image: "", category: "Burgers", popular: true },
  { id: 25, restaurantId: 5, name: "Frites Maison", description: "Frites croustillantes, sel de mer", price: 5.50, image: "", category: "Accompagnements", popular: false },
  { id: 26, restaurantId: 5, name: "Milkshake Vanille", description: "Glace artisanale, lait frais, chantilly", price: 6.50, image: "", category: "Boissons", popular: false },
  { id: 27, restaurantId: 5, name: "Chicken Wings (8 pieces)", description: "Ailes de poulet croustillantes, sauce buffalo", price: 10.00, image: "", category: "Entrees", popular: true },

  { id: 28, restaurantId: 6, name: "Pad Thai Crevettes", description: "Nouilles de riz, crevettes, cacahuetes, citron vert", price: 14.50, image: "", category: "Plats", popular: true },
  { id: 29, restaurantId: 6, name: "Curry Vert Poulet", description: "Lait de coco, bambou, basilic thai", price: 15.00, image: "", category: "Plats", popular: true },
  { id: 30, restaurantId: 6, name: "Tom Yum Kung", description: "Soupe épicée aux crevettes, citronnelle", price: 10.00, image: "", category: "Soupes", popular: false },
  { id: 31, restaurantId: 6, name: "Rouleaux de Printemps (4 pcs)", description: "Crevettes, vermicelles, menthe, sauce arachide", price: 8.50, image: "", category: "Entrees", popular: false },
  { id: 32, restaurantId: 6, name: "Riz Gluant Mangue", description: "Riz gluant, mangue fraiche, lait de coco", price: 7.00, image: "", category: "Desserts", popular: true },

  { id: 33, restaurantId: 7, name: "Thieboudienne", description: "Riz au poisson, legumes, sauce tomate", price: 14.00, image: "", category: "Plats", popular: true },
  { id: 34, restaurantId: 7, name: "Yassa Poulet", description: "Poulet marine aux oignons et citron", price: 13.00, image: "", category: "Plats", popular: true },
  { id: 35, restaurantId: 7, name: "Mafe Boeuf", description: "Ragout de boeuf a la pate d'arachide", price: 14.50, image: "", category: "Plats", popular: true },
  { id: 36, restaurantId: 7, name: "Pastels (6 pieces)", description: "Beignets farcis au thon et legumes", price: 6.00, image: "", category: "Entrees", popular: false },
  { id: 37, restaurantId: 7, name: "Jus de Bissap", description: "Boisson a l'hibiscus, menthe et sucre", price: 3.00, image: "", category: "Boissons", popular: false },

  { id: 38, restaurantId: 8, name: "Shawarma Poulet", description: "Poulet marine, crudites, sauce ail", price: 9.50, image: "", category: "Wraps", popular: true },
  { id: 39, restaurantId: 8, name: "Falafel Wrap", description: "Falafels, houmous, salade, tahini", price: 8.50, image: "", category: "Wraps", popular: true },
  { id: 40, restaurantId: 8, name: "Mezze Mix", description: "Houmous, baba ganoush, taboulé, pain pita", price: 12.00, image: "", category: "Entrees", popular: false },
  { id: 41, restaurantId: 8, name: "Kebbé (4 pieces)", description: "Boulettes de viande épicées, boulgour", price: 10.00, image: "", category: "Entrees", popular: false },
  { id: 42, restaurantId: 8, name: "Baklava (3 pieces)", description: "Patisserie feuilletee, pistaches, miel", price: 5.50, image: "", category: "Desserts", popular: true },
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
