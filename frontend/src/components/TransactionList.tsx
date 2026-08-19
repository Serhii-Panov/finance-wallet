'use client';

import { Wallet, Trash2, Pencil, MoreHorizontal } from 'lucide-react';
import type { Account, Category, Transaction } from '@/lib/api';
import { iconMap } from './CategoryGrid';

// Transaction with related data for display - exported for use in page.tsx
export interface TransactionDisplay extends Transaction {
  category?: Category;
  account?: Account;
}

// Format amount with sign based on transaction type
export function formatAmount(amount: number, isIncome: boolean): string {
  const formatted = amount.toLocaleString('uk-UA');
  return isIncome ? `+${formatted}` : `-${formatted}`;
}

// Format date with relative labels
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сьогодні';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчора';
  } else {
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

interface TransactionListProps {
  transactions: TransactionDisplay[];
  loading: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onEdit: (transaction: TransactionDisplay) => void;
}

export function TransactionList({ transactions, loading, deletingId, onDelete, onEdit }: TransactionListProps) {
  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Останні транзакції
        </h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Останні транзакції
      </h2>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Транзакцій поки немає
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const txId = tx.id || tx._id;
            const category = tx.category;
            const account = tx.account;
            const isIncome = category?.type === 'income';
            const IconComponent = category?.icon ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;
            const isDeleting = deletingId === txId;

            return (
              <div
                key={txId}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-opacity ${
                  isDeleting ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Category icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: category?.color ? `${category.color}20` : '#e5e7eb' }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: category?.color || '#6b7280' }}
                      />
                    </div>

                    {/* Transaction details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {category?.name || 'Категорія'}
                        </span>
                        <span
                          className={`font-bold whitespace-nowrap ${
                            isIncome
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatAmount(tx.amount, isIncome)} {account?.currency || ''}
                        </span>
                      </div>

                      {account && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Wallet className="w-3 h-3" />
                          <span>{account.name}</span>
                        </div>
                      )}

                      {tx.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {tx.note}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center ml-2 flex-shrink-0">
                    <button
                      onClick={() => onEdit(tx)}
                      disabled={isDeleting || !!deletingId}
                      className={`p-2 rounded-lg transition-colors ${
                        isDeleting || deletingId
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                      title="Редагувати"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => txId && onDelete(txId)}
                      disabled={isDeleting || !!deletingId}
                      className={`p-2 rounded-lg transition-colors ${
                        isDeleting || deletingId
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title="Видалити"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}