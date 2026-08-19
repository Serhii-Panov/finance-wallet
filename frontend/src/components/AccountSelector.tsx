'use client';

import { Wallet, CreditCard, PiggyBank } from 'lucide-react';
import type { Account } from '@/lib/api';

// Account type icons
export const accountIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cash': Wallet,
  'card': CreditCard,
  'savings': PiggyBank,
};

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: string | null;
  onSelectAccount: (id: string) => void;
}

export function AccountSelector({ accounts, selectedAccount, onSelectAccount }: AccountSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Рахунки
      </label>
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 -mx-4 px-4 scrollbar-hide">
        {accounts.map((account) => {
          const IconComponent = accountIcons[account.type] || Wallet;
          const accountId = account.id || account._id;
          const isSelected = selectedAccount === accountId;

          return (
            <button
              key={accountId}
              onClick={() => accountId && onSelectAccount(accountId)}
              className={`flex-shrink-0 w-32 p-4 rounded-xl transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300 dark:ring-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <IconComponent className={`w-5 h-5 ${
                  isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`} />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium truncate">{account.name}</div>
                <div className={`text-lg font-bold ${
                  isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {account.balance.toLocaleString('uk-UA')}
                </div>
                <div className={`text-xs ${
                  isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {account.currency}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}