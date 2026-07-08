import { WheelSector } from '../types';

export const SECTORS: WheelSector[] = [
  {
    id: 1,
    label: '100 Coins',
    value: 100,
    type: 'coins',
    color: '#0A2540', // Deep Royal Blue
    textColor: '#FFD700', // Gold
    weight: 35, // 35% probability
  },
  {
    id: 2,
    label: '+1 Spin',
    value: 1,
    type: 'extra_spin',
    color: '#1E3A8A', // Medium Blue
    textColor: '#FFFFFF', // White
    weight: 15,
  },
  {
    id: 3,
    label: '500 Coins',
    value: 500,
    type: 'coins',
    color: '#0D1B3E', // Even deeper blue
    textColor: '#FFD700',
    weight: 8,
  },
  {
    id: 4,
    label: 'XP Boost',
    value: 2,
    type: 'multiplier',
    color: '#D4AF37', // Gold Segment
    textColor: '#0A1128', // Dark Blue
    weight: 12,
  },
  {
    id: 5,
    label: '50 Coins',
    value: 50,
    type: 'coins',
    color: '#111827', // Obsidian Blue/Black
    textColor: '#FFD700',
    weight: 45, // Most common
  },
  {
    id: 6,
    label: 'JACKPOT',
    value: 1500,
    type: 'jackpot',
    color: '#F59E0B', // Glowing Amber/Gold
    textColor: '#0A1128',
    weight: 2, // Rare
  },
  {
    id: 7,
    label: 'Mystery Box',
    value: 300,
    type: 'mystery',
    color: '#1E40AF', // Bright Royal Blue
    textColor: '#FFFFFF',
    weight: 10,
  },
  {
    id: 8,
    label: '250 Coins',
    value: 250,
    type: 'coins',
    color: '#0F172A', // Slate Blue
    textColor: '#FFD700',
    weight: 18,
  },
];
