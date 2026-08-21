'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Tags } from 'lucide-react';
import { 
  accountsApi, 
  categoriesApi, 
  transactionsApi,
  type Account, 
  type Category,
  type CategoryType
} from '@/lib/api';
import { TransactionList, type TransactionDisplay } from '@/components/TransactionList';
import { TransactionFilters, FilterState } from '@/components/TransactionFilters';
import { BalanceWidget } from '@/components/BalanceWidget';
import { CategoryChart } from '@/components/CategoryChart';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';

export default function Home() {
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Активный таб: Витрати / Доходи / Усі
  const [activeTab, setActiveTab] = useState<CategoryType | 'all'>('expense');

  // Модальное окно
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDisplay | null>(null);

  // Фильтры поиска
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    accountId: 'all',
    period: 'all',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txData, accData, catData] = await Promise.all([
        transactionsApi.list(),
        accountsApi.list(),
        categoriesApi.list(),
      ]);

      const accountsById = new Map(
        accData.items.flatMap((account) => {
          const id = account.id || account._id;
          return id ? [[id, account] as const] : [];
        })
      );
      const categoriesById = new Map(
        catData.items.flatMap((category) => {
          const id = category.id || category._id;
          return id ? [[id, category] as const] : [];
        })
      );

      setTransactions(
        txData.items.map((transaction) => ({
          ...transaction,
          account: accountsById.get(transaction.account_id),
          category: categoriesById.get(transaction.category_id),
        })) as TransactionDisplay[]
      );
      setAccounts(accData.items);
      setCategories(catData.items);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  // Фильтрация транзакций
  const filteredTransactions = transactions.filter((tx) => {
    // 1. Фильтр по активному табу (Витрати / Доходи)
    if (activeTab !== 'all' && tx.category?.type !== activeTab) {
      return false;
    }

    // 2. Фильтр по выбранному счету
    if (filters.accountId !== 'all' && tx.account_id !== filters.accountId) {
      return false;
    }

    // 3. Текстовый поиск
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const noteMatch = tx.note?.toLowerCase().includes(q);
      const catMatch = tx.category?.name?.toLowerCase().includes(q);
      if (!noteMatch && !catMatch) return false;
    }

    // 4. Фильтр по периоду
    if (filters.period !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();

      if (filters.period === 'month') {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (filters.period === 'prev_month') {
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (
          txDate.getMonth() !== prevMonthDate.getMonth() ||
          txDate.getFullYear() !== prevMonthDate.getFullYear()
        ) {
          return false;
        }
      } else if (filters.period === 'custom') {
        if (filters.startDate && txDate < new Date(filters.startDate)) {
          return false;
        }

        if (filters.endDate && txDate > new Date(`${filters.endDate}T23:59:59`)) {
          return false;
        }
      }
    }

    return true;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await transactionsApi.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (transaction: TransactionDisplay) => {
    setEditingTransaction(transaction);
  };

  const handleUpdate = async (id: string, data: Parameters<typeof transactionsApi.update>[1]) => {
    await transactionsApi.update(id, data);
    await fetchData();
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Шапка с кнопкой добавления */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Гаманець</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/categories"
              className="rounded-xl p-2.5 text-gray-300 transition hover:bg-gray-800 hover:text-white"
              title="Категорії"
            >
              <Tags className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
            >
              <Plus className="h-5 w-5" />
              <span>Нова транзакція</span>
            </button>
          </div>
        </div>

        {/* Счета и общий баланс */}
        <BalanceWidget accounts={accounts} />

        {/* Переключатель табов */}
        <div className="flex bg-gray-800/80 p-1.5 rounded-2xl border border-gray-700/60">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${
              activeTab === 'expense'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Витрати
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${
              activeTab === 'income'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Доходи
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${
              activeTab === 'all'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Усі
          </button>
        </div>

        {/* Динамическая диаграмма категорий */}
        {activeTab !== 'all' && (
          <CategoryChart transactions={transactions} categories={categories} type={activeTab} />
        )}

        {/* Поисковая панель */}
        <TransactionFilters
          accounts={accounts}
          filters={filters}
          onChange={setFilters}
        />

        {/* Список операций */}
        <TransactionList
          transactions={filteredTransactions}
          loading={loading}
          deletingId={deletingId}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>

      {/* Модальное окно создания */}
      <AddTransactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={fetchData}
      />

      <EditTransactionModal
        key={editingTransaction?.id || editingTransaction?._id || 'empty'}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdate}
      />
    </main>
  );
}