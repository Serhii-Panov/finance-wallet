'use client';

import { 
  ShoppingCart, Coffee, Car, Gamepad2, Heart, Shirt, 
  Phone, Home as HomeIcon, BookOpen, Gift, MoreHorizontal,
  Briefcase, Laptop, TrendingUp, PlusCircle, Bus, Utensils,
  ShoppingBag, Wallet
} from 'lucide-react';
import type { Category } from '@/lib/api';

// Icon mapping for categories - exported for use in other components
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shopping-cart': ShoppingCart,
  'coffee': Coffee,
  'car': Car,
  'gamepad-2': Gamepad2,
  'heart-pulse': Heart,
  'shirt': Shirt,
  'phone': Phone,
  'home': HomeIcon,
  'book-open': BookOpen,
  'gift': Gift,
  'more-horizontal': MoreHorizontal,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  // Additional icons from backend categories
  'bus': Bus,
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'wallet': Wallet,
};

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryGrid({ categories, selectedCategory, onSelectCategory }: CategoryGridProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Категорія
      </label>
      <div className="grid grid-cols-4 gap-2">
        {categories.map((category, index) => {
          const IconComponent = category.icon ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;
          const categoryId = category.id || category._id;
          const isSelected = selectedCategory === categoryId;

          return (
            <button
              key={categoryId || index}
              onClick={() => onSelectCategory(categoryId || null)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-md scale-95'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                style={{ 
                  backgroundColor: isSelected 
                    ? 'rgba(255,255,255,0.2)' 
                    : `${category.color}20` 
                }}
              >
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ color: isSelected ? 'white' : category.color || undefined }}
                />
              </div>
              <span className="text-xs text-center truncate w-full">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}