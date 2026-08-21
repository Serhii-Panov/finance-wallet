'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { categoriesApi, type Category, type CategoryType } from '@/lib/api';
import { iconMap } from '@/components/CategoryGrid';
import { CategoryModal } from '@/components/CategoryModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesApi.getAll();
      setCategories(Array.isArray(response) ? response : response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити категорії');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (category: Category) => {
    const categoryId = category.id || category._id;
    if (!categoryId || !window.confirm(`Видалити категорію «${category.name}»?`)) return;

    try {
      setDeletingId(categoryId);
      setError(null);
      await categoriesApi.delete(categoryId);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити категорію');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleCategories = categories.filter((category) => category.type === activeTab);

  return (
    <main className="min-h-screen bg-gray-900 p-4 pb-24 text-white sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 rounded-xl px-2 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white" title="Назад">
              <ArrowLeft className="h-5 w-5" />
              <span>Назад</span>
            </Link>
            <h1 className="text-2xl font-bold">Категорії</h1>
          </div>
          <button
            type="button"
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Нова категорія</span>
          </button>
        </div>

        <div className="flex rounded-2xl border border-gray-700/60 bg-gray-800/80 p-1.5">
          {(['expense', 'income'] as CategoryType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                activeTab === type
                  ? type === 'expense' ? 'border border-red-500/30 bg-red-500/20 text-red-400' : 'border border-green-500/30 bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type === 'expense' ? 'Витрати' : 'Доходи'}
            </button>
          ))}
        </div>

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" /></div>
        ) : visibleCategories.length === 0 ? (
          <div className="rounded-2xl border border-gray-700/60 bg-gray-800/50 p-10 text-center text-gray-400">Категорій поки немає</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleCategories.map((category) => {
              const categoryId = category.id || category._id || '';
              const Icon = category.icon ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;
              const isDeleting = deletingId === categoryId;

              return (
                <div key={categoryId} className={`flex items-center gap-3 rounded-2xl border border-gray-700/60 bg-gray-800/70 p-4 transition-opacity ${isDeleting ? 'opacity-50' : ''}`}>
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${category.color || '#6B7280'}25` }}>
                    <Icon className="h-5 w-5" style={{ color: category.color || '#9CA3AF' }} />
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                  <div className="flex items-center">
                    <button type="button" onClick={() => { setEditingCategory(category); setIsModalOpen(true); }} disabled={isDeleting} className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50" title="Редагувати">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(category)} disabled={isDeleting} className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50" title="Видалити">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryModal
        key={editingCategory?.id || editingCategory?._id || 'new'}
        category={editingCategory}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadCategories}
      />
    </main>
  );
}
