'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  categoriesApi,
  type Category,
  type CategoryType,
} from '@/lib/api';
import { iconMap } from './CategoryGrid';

const COLORS = [
  '#EF4444',
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
];

const ICONS = [
  'shopping-bag',
  'shopping-cart',
  'utensils',
  'car',
  'bus',
  'home',
  'heart-pulse',
  'coffee',
  'gamepad-2',
  'briefcase',
  'laptop',
  'trending-up',
  'gift',
  'wallet',
  'folder',
];

interface CategoryModalProps {
  category: Category | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function CategoryModal({ category, open, onClose, onSaved }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(category?.name || '');
    setType(category?.type || 'expense');
    setColor(category?.color || COLORS[0]);
    setIcon(category?.icon || ICONS[0]);
    setError(null);
  }, [category, open]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const categoryId = category?.id || category?._id;

    if (!trimmedName) {
      setError('Введіть назву категорії');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = { name: trimmedName, type, color, icon };
      if (categoryId) {
        await categoriesApi.update(categoryId, data);
      } else {
        await categoriesApi.create(data);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {category ? 'Редагувати категорію' : 'Нова категорія'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Назва
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Наприклад, Подорожі"
              maxLength={100}
              autoFocus
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Тип</p>
            <div className="flex gap-2">
              {(['expense', 'income'] as CategoryType[]).map((categoryType) => (
                <button
                  key={categoryType}
                  type="button"
                  onClick={() => setType(categoryType)}
                  className={`flex-1 rounded-xl px-4 py-3 font-medium transition ${
                    type === categoryType
                      ? categoryType === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {categoryType === 'income' ? 'Дохід' : 'Витрата'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Колір</p>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  aria-label={`Колір ${colorOption}`}
                  onClick={() => setColor(colorOption)}
                  className={`h-9 w-9 rounded-full transition ${color === colorOption ? 'scale-110 ring-2 ring-gray-900 ring-offset-2 dark:ring-white dark:ring-offset-gray-800' : ''}`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Іконка</p>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((iconKey) => {
                const Icon = iconMap[iconKey];
                if (!Icon) return null;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    aria-label={`Іконка ${iconKey}`}
                    onClick={() => setIcon(iconKey)}
                    className={`flex h-11 items-center justify-center rounded-xl transition ${icon === iconKey ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Скасувати</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  );
}
