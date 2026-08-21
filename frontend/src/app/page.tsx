'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import {
  accountsApi,
  categoriesApi,
  transactionsApi,
  type Account,
  type Category,
  type CategoryType,
  type Transaction,
  type TransactionCreate
} from '@/lib/api';
import { BalanceWidget } from '@/components/BalanceWidget';
import { AccountSelector } from '@/components/AccountSelector';
import { CategoryGrid } from '@/components/CategoryGrid';
import { TransactionList, type TransactionDisplay } from '@/components/TransactionList';
import { TransactionFilters, type FilterState } from '@/components/TransactionFilters';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { CategoryChart } from '@/components/CategoryChart';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<CategoryType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDisplay | null>(null);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'all', accountId: 'all', period: 'all' });

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Load transactions with related data
  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const data = await transactionsApi.list({ limit: 20 });

      // Enrich transactions with category and account data
      const enrichedTransactions: TransactionDisplay[] = data.items.map(tx => {
        const category = categories.find(c => (c.id || c._id) === tx.category_id);
        const account = accounts.find(a => (a.id || a._id) === tx.account_id);
        return { ...tx, category, account };
      });

      // Sort by date (newest first)
      enrichedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(enrichedTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [categories, accounts]);

  // Load accounts, categories, and transactions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          accountsApi.list(),
          categoriesApi.list(),
        ]);

        setAccounts(accountsData.items);
        setCategories(categoriesData.items);

        // Auto-select first account
        if (accountsData.items.length > 0 && !selectedAccount) {
          const firstId = accountsData.items[0].id || accountsData.items[0]._id;
          if (firstId) {
            setSelectedAccount(firstId);
          }
        }

        // Load transactions after accounts and categories are fetched
        const txData = await transactionsApi.list({ limit: 20 });

        // Enrich transactions with category and account data
        const enrichedTransactions: TransactionDisplay[] = txData.items.map(tx => {
          const category = categoriesData.items.find(c => (c.id || c._id) === tx.category_id);
          const account = accountsData.items.find(a => (a.id || a._id) === tx.account_id);
          return { ...tx, category, account };
        });

        // Sort by date (newest first)
        enrichedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(enrichedTransactions);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Не вдалося завантажити дані. Перевірте підключення до сервера.');
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus on amount input
  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  const filteredCategories = categories.filter(c => c.type === transactionType);

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(tx => {
    // Search filter (by note or category name)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchesNote = tx.note?.toLowerCase().includes(q);
      const matchesCategory = tx.category?.name?.toLowerCase().includes(q);
      if (!matchesNote && !matchesCategory) return false;
    }

    // Type filter
    if (filters.type !== 'all') {
      if (tx.category?.type !== filters.type) return false;
    }

    // Account filter
    if (filters.accountId !== 'all') {
      const txAccountId = tx.account_id || tx.account?.id || tx.account?._id;
      if (txAccountId !== filters.accountId) return false;
    }

    // Period filter
    if (filters.period !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();
      if (filters.period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (txDate < startOfMonth) return false;
      } else if (filters.period === 'prev_month') {
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (txDate < startOfPrevMonth || txDate >= startOfMonth) return false;
      }
    }

    return true;
  });

  const handleSubmit = useCallback(async () => {
    if (!amount || !selectedCategory || !selectedAccount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await transactionsApi.create({
        account_id: selectedAccount,
        category_id: selectedCategory,
        amount: numAmount,
        note: note || undefined,
      });

      // Reset form
      setAmount('');
      setNote('');
      setSelectedCategory(null);
      setSuccess(true);

      // Hide success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000);

      // Reload accounts to get updated balance
      const accountsData = await accountsApi.list();
      setAccounts(accountsData.items);

      // Reload transactions
      await loadTransactions();

      // Re-focus on amount input
      amountInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  }, [amount, selectedCategory, selectedAccount, note, loadTransactions]);

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (deletingId) return; // Prevent double-click

    setDeletingId(transactionId);
    try {
      await transactionsApi.delete(transactionId);

      // Reload accounts to get updated balance
      const accountsData = await accountsApi.list();
      setAccounts(accountsData.items);

      // Reload transactions
      await loadTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setError('Не вдалося видалити транзакцію');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle update transaction
  const handleUpdateTransaction = async (transactionId: string, data: Partial<TransactionCreate>) => {
    await transactionsApi.update(transactionId, data);

    // Reload accounts to get updated balance
    const accountsData = await accountsApi.list();
    setAccounts(accountsData.items);

    // Reload transactions
    await loadTransactions();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-md mx-auto px-4 py-6 pb-8">
        {/* Header */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Нова транзакція
        </h1>

        {/* Total Balance Widget */}
        <BalanceWidget accounts={accounts} />

        {/* Account Cards */}
        <AccountSelector
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Транзакцію збережено!</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Amount input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Сума
          </label>
          <input
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="w-full text-4xl font-bold text-center py-4 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>

        {/* Transaction type toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setTransactionType('expense')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                transactionType === 'expense'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Витрата
            </button>
            <button
              onClick={() => setTransactionType('income')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                transactionType === 'income'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Дохід
            </button>
          </div>
        </div>

        {/* Categories grid */}
        <CategoryGrid
          categories={filteredCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Note input (optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Нотатка (необов'язково)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Додайте нотатку..."
            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!amount || Number(amount) <= 0 || !selectedCategory || !selectedAccount || loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
            loading || !amount || Number(amount) <= 0 || !selectedCategory || !selectedAccount
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : transactionType === 'expense'
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? 'Збереження...' : 'Зберегти'}
        </button>

        {/* Quick tip */}
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Натисніть Enter для швидкого збереження
        </p>

        {/* Transaction Filters */}
        <TransactionFilters
          accounts={accounts}
          filters={filters}
          onChange={setFilters}
        />

        {/* Transaction List Section */}
        <TransactionList
          transactions={filteredTransactions}
          loading={loadingTransactions}
          deletingId={deletingId}
          onDelete={handleDeleteTransaction}
          onEdit={setEditingTransaction}
        />
        <CategoryChart transactions={filteredTransactions} categories={categories} />

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          key={editingTransaction?.id || editingTransaction?._id || 'no-transaction'}
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingTransaction(null)}
          onSave={handleUpdateTransaction}
        />
      </main>
    </div>
  );
}
