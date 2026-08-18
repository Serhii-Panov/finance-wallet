'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingCart, Coffee, Car, Gamepad2, Heart, Shirt, 
  Phone, Home as HomeIcon, BookOpen, Gift, MoreHorizontal,
  Briefcase, Laptop, TrendingUp, PlusCircle,
  Wallet, CreditCard, PiggyBank, Check
} from 'lucide-react';
import { 
  accountsApi, 
  categoriesApi, 
  transactionsApi, 
  type Account, 
  type Category,
  type CategoryType 
} from '@/lib/api';

// Icon mapping for categories
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'shopping-cart': ShoppingCart,
  'coffee': Coffee,
  'car': Car,
  'gamepad-2': Gamepad2,
  'heart-pulse': Heart,
  'shirt': Shirt,
  'phone': Phone,
  'home': HomeIcon,
  'book-open': BookOpen,
  'gift': Gift,
  'more-horizontal': MoreHorizontal,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
};

// Account type icons
const accountIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'cash': Wallet,
  'card': CreditCard,
  'savings': PiggyBank,
};

export default function Home() {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<CategoryType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [note, setNote] = useState('');
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  // Load accounts and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          accountsApi.list(),
          categoriesApi.list(),
        ]);
        
        setAccounts(accountsData.items);
        setCategories(categoriesData.items);
        
        console.log("Categories data:", categoriesData.items);
        
        // Auto-select first account
        if (accountsData.items.length > 0 && !selectedAccount) {
          const firstId = accountsData.items[0].id || accountsData.items[0]._id;
          if (firstId) {
            setSelectedAccount(firstId);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Не вдалося завантажити дані. Перевірте підключення до сервера.');
      }
    };
    
    loadData();
  }, []);
  
  // Auto-focus on amount input
  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);
  
  // Debug: Log form state changes
  useEffect(() => {
    console.log("Form State:", { amount, selectedCategoryId: selectedCategory, selectedAccountId: selectedAccount, loading });
  }, [amount, selectedCategory, selectedAccount, loading]);
  
  const filteredCategories = categories.filter(c => c.type === transactionType);
  
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
      
      // Re-focus on amount input
      amountInputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  }, [amount, selectedCategory, selectedAccount, note]);
  
  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };
  
  const formatBalance = (balance: number, currency: string) => {
    return `${balance.toLocaleString('uk-UA')} ${currency}`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-md mx-auto px-4 py-6 pb-8">
        {/* Header */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Нова транзакція
        </h1>
        
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Категорія
          </label>
          <div className="grid grid-cols-4 gap-2">
            {filteredCategories.map((category, index) => {
              const IconComponent = category.icon ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;
              const categoryId = category.id || category._id;
              const isSelected = selectedCategory === categoryId;
              
              return (
                <button
                  key={categoryId || index}
                  onClick={() => setSelectedCategory(categoryId || null)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-md scale-95'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ 
                      backgroundColor: isSelected 
                        ? 'rgba(255,255,255,0.2)' 
                        : `${category.color}20` 
                    }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: isSelected ? 'white' : category.color || undefined }}
                    />
                  </div>
                  <span className="text-xs text-center truncate w-full">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Account selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Рахунок
          </label>
          <select
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-gray-900 dark:text-white appearance-none"
          >
            {accounts.map((account, index) => {
              const IconComponent = accountIcons[account.type] || Wallet;
              const accountId = account.id || account._id;
              return (
                <option key={accountId || index} value={accountId}>
                  {account.name} — {formatBalance(account.balance, account.currency)}
                </option>
              );
            })}
          </select>
        </div>
        
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
      </main>
    </div>
  );
}