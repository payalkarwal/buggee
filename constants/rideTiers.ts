import { MaterialCommunityIcons } from '@expo/vector-icons';

export type TierType = 'Standard' | 'Delux' | 'VIP';

export interface TierDetail {
  name: TierType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  desc: string;
  detailDesc: string;
  price: string;
  eta: string;
  rating: string;
  capacity: string;
}

export const tierDetails: Record<TierType, TierDetail> = {
  Standard: {
    name: 'Standard',
    icon: 'car-side',
    color: '#FF4F8B',
    desc: 'Comfortable, budget-friendly everyday rides.',
    detailDesc: 'Perfect for daily commuting or quick solo trips. Safe, clean, and extremely budget-friendly hatchbacks with professional drivers.',
    price: '₹ 49',
    eta: '4 mins away',
    rating: '4.8',
    capacity: '4 seats',
  },
  Delux: {
    name: 'Delux',
    icon: 'car-sports',
    color: '#FF4F8B',
    desc: 'Premium comfort and extra space.',
    detailDesc: 'Enjoy a premium travel experience in spacious, high-end sedans. Features top-rated drivers, extra legroom, and dual-zone climate control.',
    price: '₹ 79',
    eta: '2 mins away',
    rating: '4.9',
    capacity: '4 seats',
  },
  VIP: {
    name: 'VIP',
    icon: 'crown',
    color: '#FF4F8B',
    desc: 'Elite luxury experience with top chauffeurs.',
    detailDesc: 'Ride in first-class luxury. Our elite tier features high-end premium SUVs, noise-canceling cabin, complimentary refreshments, and priority route dispatch.',
    price: '₹ 129',
    eta: '1 min away',
    rating: '5.0',
    capacity: '6 seats',
  },
};
