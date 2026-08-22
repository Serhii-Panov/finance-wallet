'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { accountsApi, type Account, type AccountType, type Currency } from '@/lib/api';

const getErrorMessage = (err: any): string => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => `${e.loc?.at(-1) || 'field'}: ${e.msg}`).join('; ');
  }
  if (err?.message) return err.message;
  return 'Помилка збереження рахунку';
};

interface AccountModalProps {
  open: boolean;
  account?: Account | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AccountModal({ open, account, onClose, onSuccess }: AccountModalProps) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('card');
  const [currency, setCurrency] = useState<Currency>('UAH');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (account) {
        setName(account.name);
        setAccountType(account.type);
        setCurrency(account.currency);
        setBalance(account.balance.toString());
      } else {
        setName('');
        setAccountType('card');
        setCurrency('UAH');
        setBalance('');
      }
      setError(null);
    }
  }, [open, account]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Введіть назву рахунку");
      return;
    }

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setError('Введіть коректний баланс');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (account) {
        // Update existing account
        const accountId = account.id || account._id || '';
        await accountsApi.update(accountId, {
          name: name.trim(),
          currency,
          balance: numBalance,
        });
      } else {
        // Create new account
        await accountsApi.create({
          name: name.trim(),
          type: accountType,
          currency,
          balance: numBalance,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isEditing = !!account;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Редагувати рахунок' : 'Новий рахунок'}
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Назва рахунку
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мій рахунок"
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Account type */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тип рахунку
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
              >
                <option value="card">Картка</option>
                <option value="cash">Готівка</option>
              </select>
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Валюта
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
            >
              <option value="UAH">UAH (Українська гривня)</option>
              <option value="USD">USD (Американський долар)</option>
              <option value="EUR">EUR (Євро)</option>
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Баланс
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full py-3 px-4 text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white"
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
            disabled={loading || !name.trim() || !balance}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Збереження...
              </>
            ) : isEditing ? (
              'Оновити'
            ) : (
              'Створити'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
