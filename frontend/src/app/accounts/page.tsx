'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Wallet, CreditCard } from 'lucide-react';
import { accountsApi, type Account } from '@/lib/api';
import { AccountModal } from '@/components/AccountModal';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountsApi.list();
      setAccounts(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження рахунків');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setModalOpen(true);
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`Ви впевнені, що хочете видалити рахунок "${account.name}"?`)) {
      return;
    }

    try {
      const accountId = account.id || account._id || '';
      await accountsApi.delete(accountId);
      setAccounts(accounts.filter(a => (a.id || a._id) !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення рахунку');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAccount(null);
  };

  const handleModalSuccess = () => {
    loadAccounts();
    handleModalClose();
  };

  const getAccountIcon = (account: Account) => {
    const type = account.type?.toLowerCase() || '';
    if (type.includes('card') || type.includes('credit')) {
      return <CreditCard className="w-6 h-6" />;
    }
    return <Wallet className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Управління рахунками</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Account Button */}
        <button
          onClick={handleAddAccount}
          className="mb-8 w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Додати рахунок</span>
        </button>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Завантаження рахунків...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              У вас немає рахунків. Створіть перший рахунок!
            </p>
          </div>
        )}

        {/* Accounts Grid */}
        {!loading && accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const accountId = account.id || account._id || '';
              return (
                <div
                  key={accountId}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  {/* Header with icon and actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      {getAccountIcon(account)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Редагувати"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Видалити"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Account name */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {account.name}
                  </h3>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {account.balance.toLocaleString('uk-UA')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {account.currency}
                    </p>
                  </div>

                  {/* Account type */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {account.type === 'card'
                        ? 'Картка'
                        : account.type === 'savings'
                          ? 'Накопичувальний'
                          : 'Готівка'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AccountModal
        open={modalOpen}
        account={selectedAccount}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
