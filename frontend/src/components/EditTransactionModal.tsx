'use client';

import { useState, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  type Account,
  type Category,
  type CategoryType,
  type TransactionCreate,
} from '@/lib/api';
import { TransactionDisplay } from './TransactionList';

interface EditTransactionModalProps {
  transaction: TransactionDisplay | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, data: Partial<TransactionCreate>) => Promise<void>;
}

interface TransactionFormData {
  transactionType: CategoryType;
  amount: string;
  selectedAccount: string;
  selectedCategory: string;
  note: string;
  date: string;
}

// Extract initial form data from transaction
function getInitialFormData(transaction: TransactionDisplay | null): TransactionFormData {
  if (!transaction) {
    return {
      transactionType: 'expense',
      amount: '',
      selectedAccount: '',
      selectedCategory: '',
      note: '',
      date: '',
    };
  }

  const isIncome = transaction.category?.type === 'income';
  const txDate = new Date(transaction.date);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localDateStr = `${txDate.getFullYear()}-${pad(txDate.getMonth() + 1)}-${pad(txDate.getDate())}T${pad(txDate.getHours())}:${pad(txDate.getMinutes())}`;

  return {
    transactionType: isIncome ? 'income' : 'expense',
    amount: String(transaction.amount),
    selectedAccount: transaction.account_id,
    selectedCategory: transaction.category_id,
    note: transaction.note || '',
    date: localDateStr,
  };
}

export function EditTransactionModal({
  transaction,
  accounts,
  categories,
  onClose,
  onSave,
}: EditTransactionModalProps) {
  // Use key-based pattern: when transaction changes, component remounts with fresh state
  const initialData = useMemo(() => getInitialFormData(transaction), [transaction]);
  
  const [transactionType, setTransactionType] = useState<CategoryType>(initialData.transactionType);
  const [amount, setAmount] = useState(initialData.amount);
  const [selectedAccount, setSelectedAccount] = useState(initialData.selectedAccount);
  const [selectedCategory, setSelectedCategory] = useState(initialData.selectedCategory);
  const [note, setNote] = useState(initialData.note);
  const [date, setDate] = useState(initialData.date);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter categories by selected type
  const filteredCategories = categories.filter(c => c.type === transactionType);

  // Check if category is valid for current type
  const isCategoryValid = useMemo(() => {
    if (!selectedCategory) return true;
    const cat = categories.find(c => (c.id || c._id) === selectedCategory);
    return cat ? cat.type === transactionType : true;
  }, [selectedCategory, categories, transactionType]);

  // Use computed category (empty if invalid for current type)
  const effectiveSelectedCategory = isCategoryValid ? selectedCategory : '';

  const handleSubmit = async () => {
    if (!transaction) return;
    
    const txId = transaction.id || transaction._id;
    if (!txId) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Введіть коректну суму');
      return;
    }

    if (!selectedAccount || !effectiveSelectedCategory) {
      setError('Оберіть рахунок та категорію');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(txId, {
        account_id: selectedAccount,
        category_id: effectiveSelectedCategory,
        amount: numAmount,
        note: note || undefined,
        date: date ? new Date(date).toISOString() : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Редагувати транзакцію
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Transaction type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип транзакції
            </label>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setTransactionType('expense')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  transactionType === 'expense'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Витрата
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('income')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  transactionType === 'income'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Дохід
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сума
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-bold text-center py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Рахунок
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            >
              <option value="">Оберіть рахунок</option>
              {accounts.map((account) => {
                const accountId = account.id || account._id;
                return (
                  <option key={accountId} value={accountId}>
                    {account.name} ({account.balance.toLocaleString('uk-UA')} {account.currency})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Категорія
            </label>
            <select
              value={effectiveSelectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            >
              <option value="">Оберіть категорію</option>
              {filteredCategories.map((category) => {
                const categoryId = category.id || category._id;
                return (
                  <option key={categoryId} value={categoryId}>
                    {category.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Дата та час
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Нотатка
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Додайте нотатку..."
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !amount || !selectedAccount || !effectiveSelectedCategory}
            className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Збереження...
              </>
            ) : (
              'Зберегти'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}