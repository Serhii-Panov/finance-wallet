'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Category, CategoryType } from '@/lib/api';
import type { TransactionDisplay } from './TransactionList';

interface CategoryChartProps {
  transactions: TransactionDisplay[];
  categories: Category[];
  type: CategoryType;
}

// Green palette for income
const INCOME_COLORS = [
  '#10B981', '#22C55E', '#16A34A', '#15803D',
  '#4ADE80', '#34D399', '#059669', '#065F46',
];

// Mixed red/blue palette for expenses
const EXPENSE_COLORS = [
  '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#6366F1', '#DC2626',
];

export function CategoryChart({ transactions, categories, type }: CategoryChartProps) {
  const COLORS = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS;

  const chartData = useMemo(() => {
    // Filter transactions by the specified type
    const filtered = transactions.filter((tx) => tx.category?.type === type);

    // Group totals by category name
    const categoryTotals: Record<string, { name: string; value: number }> = {};

    filtered.forEach((tx) => {
      const catName = tx.category?.name || 'Без категорії';
      const amount = Math.abs(tx.amount);

      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { name: catName, value: 0 };
      }
      categoryTotals[catName].value += amount;
    });

    return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  }, [transactions, type]);

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6 text-center text-gray-400">
        {type === 'income'
          ? 'Немає даних про доходи для відображення діаграми'
          : 'Немає даних про витрати для відображення діаграми'}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        {type === 'income' ? 'Структура доходів' : 'Структура витрат'}
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${Number(value || 0).toFixed(2)} ₴`, 'Сума']}
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.75rem' }}
              itemStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}