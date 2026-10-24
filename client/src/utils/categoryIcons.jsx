// src/utils/categoryIcons.jsx
// Maps finance categories to sleek Lucide React icons
import {
  UtensilsCrossed,
  Plane,
  ShoppingBag,
  Zap,
  Film,
  Heart,
  GraduationCap,
  Briefcase,
  Coins,
  TrendingUp,
  Gift,
  Folder,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const getCategoryIcon = (category = '', size = 16) => {
  const normalized = category.toLowerCase().trim();

  switch (normalized) {
    case 'food':
      return <UtensilsCrossed size={size} />;
    case 'travel':
      return <Plane size={size} />;
    case 'shopping':
      return <ShoppingBag size={size} />;
    case 'utilities':
      return <Zap size={size} />;
    case 'entertainment':
      return <Film size={size} />;
    case 'health':
      return <Heart size={size} />;
    case 'education':
      return <GraduationCap size={size} />;
    case 'salary':
      return <Briefcase size={size} />;
    case 'freelance':
      return <Coins size={size} />;
    case 'investment':
      return <TrendingUp size={size} />;
    case 'gift':
      return <Gift size={size} />;
    default:
      return <Folder size={size} />;
  }
};

export const getTypeIcon = (type = 'expense', size = 16) => {
  return type === 'income' ? <ArrowDownLeft size={size} /> : <ArrowUpRight size={size} />;
};
