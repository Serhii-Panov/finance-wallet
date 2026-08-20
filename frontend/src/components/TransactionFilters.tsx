'use client';

import { Search } from 'lucide-react';
import { Account, CategoryType } from '@/lib/api';

export type DatePeriod = 'all' | 'month' | 'prev_month';

export interface FilterState {
  search: string;
  type: CategoryType | 'all';
  accountId: string | 'all';
  period: DatePeriod;
}

interface TransactionFiltersProps {
  accounts: Account[];
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export function TransactionFilters({
  accounts,
  filters,
  onChange,
}: TransactionFiltersProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-4 mb-6 space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Пошук за нотаткою або категорією..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Тип */}
        <select
          value={filters.type}
          onChange={(e) =>
            onChange({ ...filters, type: e.target.value as FilterState['type'] })
          }
          className="p-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">Усі типии</option>
          <option value="expense">Витрати</option>
          <option value="income">Доходи</option>
        </select>

        {/* Рахунок */}
        <select
          value={filters.accountId}
          onChange={(e) => onChange({ ...filters, accountId: e.target.value })}
          className="p-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">Усі рахунки</option>
          {accounts.map((acc) => (
            <option key={acc.id || acc._id} value={acc.id || acc._id}>
              {acc.name} ({acc.currency})
            </option>
          ))}
        </select>

        {/* Період */}
        <select
          value={filters.period}
          onChange={(e) =>
            onChange({ ...filters, period: e.target.value as DatePeriod })
          }
          className="p-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">За весь час</option>
          <option value="month">Цей місяць</option>
          <option value="prev_month">Минулий місяць</option>
        </select>
      </div>
    </div>
  );
}