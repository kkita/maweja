export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image: string;
  address: string;
  menu: MenuItem[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'all', name: 'Tous', icon: 'grid' },
  { id: 'african', name: 'Africain', icon: 'compass' },
  { id: 'fastfood', name: 'Fast Food', icon: 'zap' },
  { id: 'grills', name: 'Grillades', icon: 'thermometer' },
  { id: 'market', name: 'Marché', icon: 'shopping-bag' },
  { id: 'hotel', name: 'Hôtel', icon: 'star' },
];

export const restaurants: Restaurant[] = [
  {
    id: 'aldar',
    name: 'Aldar Restaurant',
    description: 'Cuisine libanaise et internationale au cœur de Kinshasa',
    cuisine: 'Libanais • International',
    rating: 4.7,
    deliveryTime: '30-45 min',
    deliveryFee: 2500,
    minOrder: 5000,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
    address: 'Avenue du Commerce, Gombe, Kinshasa',
    menu: [
      { id: 'a1', name: 'Houmous', description: 'Purée de pois chiches avec tahini et huile d\'olive', price: 4500, category: 'Entrées', image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=200&h=200&fit=crop' },
      { id: 'a2', name: 'Shawarma Poulet', description: 'Poulet mariné grillé avec sauce à l\'ail', price: 7500, category: 'Plats', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&h=200&fit=crop', popular: true },
      { id: 'a3', name: 'Falafel', description: 'Boulettes de pois chiches frites avec salade', price: 5500, category: 'Plats', image: 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=200&h=200&fit=crop' },
      { id: 'a4', name: 'Mixed Grill', description: 'Assortiment de viandes grillées avec riz', price: 15000, category: 'Plats', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop', popular: true },
      { id: 'a5', name: 'Taboulé', description: 'Salade fraîche de persil et boulgour', price: 4000, category: 'Entrées', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&h=200&fit=crop' },
      { id: 'a6', name: 'Baklava', description: 'Pâtisserie feuilletée au miel et pistaches', price: 3500, category: 'Desserts', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'kfc',
    name: 'KFC Kinshasa',
    description: 'Le poulet croustillant préféré de Kinshasa',
    cuisine: 'Fast Food • Poulet',
    rating: 4.3,
    deliveryTime: '20-35 min',
    deliveryFee: 2000,
    minOrder: 3000,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=250&fit=crop',
    address: 'Boulevard du 30 Juin, Gombe, Kinshasa',
    menu: [
      { id: 'k1', name: 'Bucket 8 pièces', description: '8 morceaux de poulet croustillant Original', price: 18000, category: 'Buckets', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop', popular: true },
      { id: 'k2', name: 'Zinger Burger', description: 'Burger poulet épicé avec salade et mayo', price: 6500, category: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', popular: true },
      { id: 'k3', name: 'Tenders 5 pcs', description: '5 tendres de poulet avec sauce', price: 7000, category: 'Poulet', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop' },
      { id: 'k4', name: 'Frites Large', description: 'Grandes frites croustillantes', price: 3000, category: 'Accompagnements', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop' },
      { id: 'k5', name: 'Coleslaw', description: 'Salade de chou crémeuse', price: 2000, category: 'Accompagnements', image: 'https://images.unsplash.com/photo-1625938145744-533e82ec18e1?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'hunga-busta',
    name: 'Hunga Busta',
    description: 'Les meilleurs burgers et grillades de Kin',
    cuisine: 'Burgers • Grillades',
    rating: 4.5,
    deliveryTime: '25-40 min',
    deliveryFee: 2000,
    minOrder: 4000,
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=250&fit=crop',
    address: 'Avenue de la Libération, Gombe, Kinshasa',
    menu: [
      { id: 'h1', name: 'Classic Burger', description: 'Bœuf grillé, cheddar, laitue, tomate', price: 8000, category: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', popular: true },
      { id: 'h2', name: 'Double Smash', description: 'Double steak, double fromage, oignons caramélisés', price: 12000, category: 'Burgers', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&h=200&fit=crop', popular: true },
      { id: 'h3', name: 'Chicken Wings 10pcs', description: 'Ailes de poulet sauce BBQ ou piquante', price: 9000, category: 'Poulet', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=200&h=200&fit=crop' },
      { id: 'h4', name: 'Brochettes Bœuf', description: '4 brochettes de bœuf marinées avec frites', price: 11000, category: 'Grillades', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop' },
      { id: 'h5', name: 'Milkshake', description: 'Vanille, chocolat ou fraise', price: 4000, category: 'Boissons', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'city-market',
    name: 'City Market',
    description: 'Supermarché avec livraison de produits frais',
    cuisine: 'Supermarché • Produits frais',
    rating: 4.2,
    deliveryTime: '35-50 min',
    deliveryFee: 3000,
    minOrder: 8000,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=250&fit=crop',
    address: 'Avenue Colonel Mondjiba, Ngaliema, Kinshasa',
    menu: [
      { id: 'c1', name: 'Panier Fruits', description: 'Assortiment de fruits frais de saison', price: 6000, category: 'Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop' },
      { id: 'c2', name: 'Légumes Variés', description: 'Tomates, oignons, poivrons, aubergines', price: 5000, category: 'Légumes', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop' },
      { id: 'c3', name: 'Poulet Entier', description: 'Poulet frais local', price: 8500, category: 'Viandes', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200&h=200&fit=crop', popular: true },
      { id: 'c4', name: 'Riz 5kg', description: 'Riz long grain premium', price: 7500, category: 'Épicerie', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
      { id: 'c5', name: 'Huile de Palme 1L', description: 'Huile de palme rouge traditionnelle', price: 3500, category: 'Épicerie', image: 'https://images.unsplash.com/photo-1474979266404-7eaacdc948b6?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'hilton',
    name: 'Hilton Kinshasa',
    description: 'Cuisine gastronomique avec vue sur le fleuve Congo',
    cuisine: 'Gastronomique • International',
    rating: 4.8,
    deliveryTime: '40-55 min',
    deliveryFee: 5000,
    minOrder: 15000,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop',
    address: 'Boulevard du 30 Juin, Gombe, Kinshasa',
    menu: [
      { id: 'hi1', name: 'Carpaccio de Bœuf', description: 'Bœuf finement tranché, roquette, parmesan', price: 12000, category: 'Entrées', image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=200&h=200&fit=crop' },
      { id: 'hi2', name: 'Filet de Capitaine', description: 'Poisson du fleuve grillé, sauce au beurre blanc', price: 18000, category: 'Plats', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop', popular: true },
      { id: 'hi3', name: 'Entrecôte Grillée', description: 'Entrecôte 300g avec frites maison et salade', price: 22000, category: 'Plats', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200&h=200&fit=crop', popular: true },
      { id: 'hi4', name: 'Tiramisu', description: 'Dessert italien classique au mascarpone', price: 8000, category: 'Desserts', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop' },
      { id: 'hi5', name: 'Cocktail Signature', description: 'Cocktail maison aux fruits tropicaux', price: 7000, category: 'Boissons', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'golden-tulip',
    name: 'Golden Tulip',
    description: 'Restaurant d\'hôtel avec buffet varié et cuisine raffinée',
    cuisine: 'Buffet • International',
    rating: 4.6,
    deliveryTime: '35-50 min',
    deliveryFee: 4000,
    minOrder: 10000,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=250&fit=crop',
    address: 'Avenue Batetela, Gombe, Kinshasa',
    menu: [
      { id: 'g1', name: 'Salade César', description: 'Romaine, poulet grillé, croûtons, parmesan', price: 8500, category: 'Entrées', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop' },
      { id: 'g2', name: 'Poulet Moambé', description: 'Poulet traditionnel en sauce moambé avec riz', price: 14000, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=200&fit=crop', popular: true },
      { id: 'g3', name: 'Poisson Braisé', description: 'Poisson entier braisé avec bananes plantains', price: 16000, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=200&h=200&fit=crop', popular: true },
      { id: 'g4', name: 'Pasta Carbonara', description: 'Spaghetti à la crème, lardons, parmesan', price: 11000, category: 'Plats', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=200&fit=crop' },
      { id: 'g5', name: 'Crème Brûlée', description: 'Crème vanille avec caramel croustillant', price: 6000, category: 'Desserts', image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'kin-marche',
    name: 'Kin Marché',
    description: 'Marché local avec produits congolais authentiques',
    cuisine: 'Marché • Congolais',
    rating: 4.1,
    deliveryTime: '30-45 min',
    deliveryFee: 2000,
    minOrder: 5000,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=250&fit=crop',
    address: 'Marché Central, Kinshasa',
    menu: [
      { id: 'm1', name: 'Fumbwa', description: 'Légumes fumbwa cuisinés à l\'huile de palme', price: 5000, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop', popular: true },
      { id: 'm2', name: 'Chikwangue', description: 'Pain de manioc traditionnel (lot de 4)', price: 2500, category: 'Accompagnements', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop' },
      { id: 'm3', name: 'Pondu', description: 'Feuilles de manioc pilées cuites longuement', price: 4500, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=200&h=200&fit=crop', popular: true },
      { id: 'm4', name: 'Makemba Grillées', description: 'Bananes plantains grillées', price: 2000, category: 'Accompagnements', image: 'https://images.unsplash.com/photo-1528825871115-3581a5e0791d?w=200&h=200&fit=crop' },
      { id: 'm5', name: 'Saka Saka', description: 'Feuilles de manioc à la pâte d\'arachide', price: 5500, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&h=200&fit=crop' },
    ],
  },
  {
    id: 'la-terrasse',
    name: 'La Terrasse Gombe',
    description: 'Restaurant terrasse avec ambiance décontractée',
    cuisine: 'Congolais • Grillades',
    rating: 4.4,
    deliveryTime: '25-40 min',
    deliveryFee: 2500,
    minOrder: 6000,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop',
    address: 'Avenue de la Justice, Gombe, Kinshasa',
    menu: [
      { id: 't1', name: 'Brochettes Chèvre', description: 'Brochettes de viande de chèvre marinées', price: 10000, category: 'Grillades', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop', popular: true },
      { id: 't2', name: 'Liboke de Poisson', description: 'Poisson cuit en papillote de feuilles de bananier', price: 13000, category: 'Plats', image: 'https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=200&h=200&fit=crop', popular: true },
      { id: 't3', name: 'Ndolé', description: 'Feuilles amères aux crevettes et arachides', price: 9000, category: 'Plats Congolais', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop' },
      { id: 't4', name: 'Brochettes Bœuf', description: 'Brochettes de bœuf tendre avec sauce pili-pili', price: 11000, category: 'Grillades', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200&h=200&fit=crop' },
      { id: 't5', name: 'Jus de Gingembre', description: 'Boisson fraîche au gingembre maison', price: 2000, category: 'Boissons', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop' },
      { id: 't6', name: 'Bière Primus', description: 'Bière locale congolaise bien fraîche', price: 2500, category: 'Boissons', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200&h=200&fit=crop' },
    ],
  },
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-CD') + ' FC';
}
