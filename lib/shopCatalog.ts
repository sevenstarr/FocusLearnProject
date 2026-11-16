import type { ShopItem } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'mare', name: 'Maré', description: 'Uma paleta azul e tranquila.', category: 'theme', price: 10, swatch: '#0ea5e9' },
  { id: 'bosque', name: 'Bosque', description: 'Tons verdes para uma área de foco serena.', category: 'theme', price: 40, swatch: '#16a34a' },
  { id: 'nebulosa', name: 'Nebulosa', description: 'Uma paleta violeta para suas sessões.', category: 'theme', price: 100, swatch: '#8b5cf6' },
  { id: 'raposa', name: 'Raposa', description: 'Um avatar esperto e curioso.', category: 'avatar', price: 15, emoji: '🦊' },
  { id: 'coruja', name: 'Coruja', description: 'Um avatar para quem aprende sempre.', category: 'avatar', price: 35, emoji: '🦉' },
  { id: 'capivara', name: 'Capivara', description: 'Um avatar calmo para manter o ritmo.', category: 'avatar', price: 70, emoji: '🦫' },
];
