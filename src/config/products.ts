export interface Product {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
}

// Static product catalogue — expand as more products are added
const PRODUCTS: Product[] = [
  {
    id: 'ysho-ghee-500ml',
    name: 'Ysho A2 Desi Cow Bilona Ghee',
    variant: '500ml (450g)',
    price: 1899,
    image: '/src/assets/ysho-packaging-hero.png',
  },
];

export default PRODUCTS;
