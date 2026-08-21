'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Category } from '@/lib/api';
import type { TransactionDisplay } from './TransactionList';

interface CategoryChartProps {
  transactions: TransactionDisplay[];
  categories: Category[];
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'
];

export function CategoryChart({ transactions, categories }: CategoryChartProps) {
  const chartData = useMemo(() => {
    // 1. Фильтруем только расходы
    const expenses = transactions.filter((tx) => tx.category?.type === 'expense');

    // 2. Группируем суммы по id категории
    const categoryTotals: Record<string, { name: string; value: number }> = {};

    expenses.forEach((tx) => {
      const catName = tx.category?.name || 'Без категории';
      const amount = Math.abs(tx.amount);

      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { name: catName, value: 0 };
      }
      categoryTotals[catName].value += amount;
    });

    return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6 text-center text-gray-400">
        Нет данных о расходах для отображения диаграммы
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Структура расходов</h2>
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