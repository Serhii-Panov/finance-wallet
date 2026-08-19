'use client';

import type { Account } from '@/lib/api';

interface BalanceWidgetProps {
  accounts: Account[];
}

export function BalanceWidget({ accounts }: BalanceWidgetProps) {
  // Group balances by currency
  const balancesByCurrency = accounts.reduce((acc, account) => {
    const currency = account.currency;
    acc[currency] = (acc[currency] || 0) + account.balance;
    return acc;
  }, {} as Record<string, number>);

  const currencyOrder = ['UAH', 'USD'];
  const sortedCurrencies = Object.keys(balancesByCurrency).sort(
    (a, b) => currencyOrder.indexOf(a) - currencyOrder.indexOf(b)
  );

  return (
    <div className="mb-6 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-5 shadow-lg">
      <h2 className="text-sm font-medium text-blue-100 mb-3">Загальний баланс</h2>
      <div className="flex flex-wrap gap-4">
        {sortedCurrencies.length === 0 ? (
          <span className="text-white text-2xl font-bold">—</span>
        ) : (
          sortedCurrencies.map(currency => (
            <div key={currency} className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                {balancesByCurrency[currency].toLocaleString('uk-UA')}
              </span>
              <span className="text-lg font-medium text-blue-200">{currency}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}