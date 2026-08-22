'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  MoreHorizontal,
  Wallet,
  CreditCard,
  Folder,
  ChevronDown,
  Check,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Film,
  HeartPulse,
  ShoppingCart,
  DollarSign,
  Briefcase,
  Bus,
  Gamepad2,
  Laptop,
  TrendingUp,
  Gift,
  Coffee,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import {
  transactionsApi,
  type Account,
  type Category,
  type CategoryType,
} from '@/lib/api';

type TransactionMode = 'expense' | 'income' | 'transfer';

interface CategoryVisual {
  Icon: LucideIcon;
  color: string;
  useGradient: boolean;
}

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; color: string }> = {
  продукти: { icon: ShoppingBag, color: '#10B981' }, // emerald
  продукты: { icon: ShoppingBag, color: '#10B981' },
  'кафе та ресторани': { icon: Utensils, color: '#F59E0B' }, // amber
  'кафе та рестораны': { icon: Utensils, color: '#F59E0B' },
  'їжа': { icon: Utensils, color: '#F59E0B' },
  еда: { icon: Utensils, color: '#F59E0B' },
  транспорт: { icon: Car, color: '#0EA5E9' }, // sky
  авто: { icon: Car, color: '#0EA5E9' },
  житло: { icon: Home, color: '#6366F1' }, // indigo
  жилье: { icon: Home, color: '#6366F1' },
  розваги: { icon: Film, color: '#A855F7' }, // purple
  развлечения: { icon: Film, color: '#A855F7' },
  "здоров'я": { icon: HeartPulse, color: '#F43F5E' }, // rose
  здоровя: { icon: HeartPulse, color: '#F43F5E' },
  здоровье: { icon: HeartPulse, color: '#F43F5E' },
  покупки: { icon: ShoppingCart, color: '#EC4899' }, // pink
  зарплата: { icon: DollarSign, color: '#22C55E' }, // green
  фриланс: { icon: Briefcase, color: '#3B82F6' }, // blue
  фріланс: { icon: Briefcase, color: '#3B82F6' },
};

const ICON_BY_KEY: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  car: Car,
  bus: Bus,
  home: Home,
  film: Film,
  'heart-pulse': HeartPulse,
  'dollar-sign': DollarSign,
  briefcase: Briefcase,
  wallet: Wallet,
  laptop: Laptop,
  'trending-up': TrendingUp,
  gift: Gift,
  coffee: Coffee,
  'gamepad-2': Gamepad2,
  folder: Folder,
};

const DEFAULT_ACCENT = '#818CF8';
const DEFAULT_BADGE_GRADIENT = 'linear-gradient(135deg, #818CF8 0%, #C084FC 55%, #F472B6 100%)';

function getLocalDateTimeValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getCategoryVisual(category: Category): CategoryVisual {
  const fromDict = CATEGORY_STYLES[category.name.trim().toLowerCase()];
  const IconFromDb = category.icon ? ICON_BY_KEY[category.icon] : undefined;
  const Icon = fromDict?.icon || IconFromDb || Folder;
  const color = category.color || fromDict?.color || DEFAULT_ACCENT;

  return {
    Icon,
    color,
    useGradient: !category.color && !fromDict?.color,
  };
}

function CategoryBadge({
  category,
  size = 'md',
  selected = false,
}: {
  category: Category;
  size?: 'sm' | 'md';
  selected?: boolean;
}) {
  const { Icon, color, useGradient } = getCategoryVisual(category);
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconDim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const filled = selected || useGradient;

  return (
    <span
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
      style={
        useGradient
          ? { background: DEFAULT_BADGE_GRADIENT, color: '#fff' }
          : filled
            ? { backgroundColor: color, color: '#fff' }
            : { backgroundColor: `${color}22`, color }
      }
    >
      <Icon className={iconDim} />
    </span>
  );
}

interface AddTransactionModalProps {
  open: boolean;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({
  open,
  accounts,
  categories,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [mode, setMode] = useState<TransactionMode>('expense');
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedToAccount, setSelectedToAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(getLocalDateTimeValue());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccountList, setShowAccountList] = useState(false);
  const [showToAccountList, setShowToAccountList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const accountListRef = useRef<HTMLDivElement>(null);
  const toAccountListRef = useRef<HTMLDivElement>(null);
  const categoryListRef = useRef<HTMLDivElement>(null);

  // Reset form whenever the modal is opened
  useEffect(() => {
    if (!open) return;
    
    // Reset all form state when modal opens
    setMode('expense');
    setAmount('');
    setDate(getLocalDateTimeValue());
    setNote('');
    setSelectedCategory('');
    setSelectedToAccount('');
    setError(null);
    setShowAccountList(false);
    setShowToAccountList(false);
    setShowCategoryList(false);
    const firstAccountId = accounts[0]?.id || accounts[0]?._id || '';
    setSelectedAccount(firstAccountId);
  }, [open, accounts]);

  // Filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === (mode as CategoryType));

  // Reset selected category when switching type if it no longer matches
  const handleModeChange = (newMode: TransactionMode) => {
    setMode(newMode);
    setSelectedCategory('');
    setShowCategoryList(false);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Введіть коректну суму');
      return;
    }

    if (!selectedAccount) {
      setError('Оберіть рахунок');
      return;
    }

    if (mode === 'transfer') {
      if (!selectedToAccount) {
        setError('Оберіть рахунок для переводу');
        return;
      }
      if (selectedAccount === selectedToAccount) {
        setError('Оберіть різні рахунки');
        return;
      }
    } else {
      if (!selectedCategory) {
        setError('Оберіть категорію');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'transfer') {
        // Create debit transaction from source account
        await transactionsApi.create({
          account_id: selectedAccount,
          category_id: selectedCategory || '', // Empty for transfer
          amount: numAmount,
          date: date ? new Date(date).toISOString() : undefined,
          note: note ? `Переказ на: ${accounts.find(a => (a.id || a._id) === selectedToAccount)?.name || 'рахунок'}` : undefined,
        });
        
        // Create credit transaction to destination account
        await transactionsApi.create({
          account_id: selectedToAccount,
          category_id: selectedCategory || '', // Empty for transfer
          amount: numAmount,
          date: date ? new Date(date).toISOString() : undefined,
          note: note ? `Переказ з: ${accounts.find(a => (a.id || a._id) === selectedAccount)?.name || 'рахунку'}` : undefined,
        });
      } else {
        await transactionsApi.create({
          account_id: selectedAccount,
          category_id: selectedCategory,
          amount: numAmount,
          date: date ? new Date(date).toISOString() : undefined,
          note: note || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  // Get account icon based on type
  const getAccountIcon = (account: Account) => {
    const type = account.type?.toLowerCase() || '';
    if (type.includes('card') || type.includes('credit')) return <CreditCard className="w-5 h-5" />;
    return <Wallet className="w-5 h-5" />;
  };

  // Visible accounts (first 3)
  const visibleAccounts = accounts.slice(0, 3);
  const hasMoreAccounts = accounts.length > 3;

  // Visible to accounts (first 3)
  const visibleToAccounts = accounts.filter(a => (a.id || a._id) !== selectedAccount).slice(0, 3);
  const hasMoreToAccounts = accounts.filter(a => (a.id || a._id) !== selectedAccount).length > 3;

  // Visible categories (first 7)
  const visibleCategories = filteredCategories.slice(0, 7);
  const hasMoreCategories = filteredCategories.length > 7;

  if (!open) return null;

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
            {mode === 'transfer' ? 'Новий переказ' : 'Нова транзакція'}
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
              Тип операції
            </label>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => handleModeChange('expense')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  mode === 'expense'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Витрата
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('income')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  mode === 'income'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Дохід
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('transfer')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  mode === 'transfer'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Переказ
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

          {/* Account - Interactive Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'transfer' ? 'З рахунку' : 'Рахунок'}
            </label>
            <div className="relative">
              <div className="flex flex-wrap gap-2">
                {visibleAccounts.map((account) => {
                  const accountId = account.id || account._id || '';
                  const isSelected = selectedAccount === accountId;
                  return (
                    <button
                      key={accountId}
                      type="button"
                      onClick={() => {
                        setSelectedAccount(accountId);
                        setShowAccountList(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-w-0 flex-1 min-w-[120px] ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <span className="flex-shrink-0 text-blue-500">{getAccountIcon(account)}</span>
                      <span className="truncate">{account.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    </button>
                  );
                })}
                {hasMoreAccounts && (
                  <button
                    type="button"
                    onClick={() => setShowAccountList(true)}
                    className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all min-w-[80px]"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                    <span>Ще</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Full Account List Dropdown */}
              {showAccountList && (
                <div
                  ref={accountListRef}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden"
                >
                  {accounts.map((account) => {
                    const accountId = account.id || account._id || '';
                    const isSelected = selectedAccount === accountId;
                    return (
                      <button
                        key={accountId}
                        type="button"
                        onClick={() => {
                          setSelectedAccount(accountId);
                          setShowAccountList(false);
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="flex-shrink-0 text-blue-500">{getAccountIcon(account)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{account.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {account.balance.toLocaleString('uk-UA')} {account.currency}
                          </p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* To Account (for transfers) */}
          {mode === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                На рахунок
              </label>
              <div className="relative">
                <div className="flex flex-wrap gap-2">
                  {visibleToAccounts.map((account) => {
                    const accountId = account.id || account._id || '';
                    const isSelected = selectedToAccount === accountId;
                    return (
                      <button
                        key={accountId}
                        type="button"
                        onClick={() => {
                          setSelectedToAccount(accountId);
                          setShowToAccountList(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-w-0 flex-1 min-w-[120px] ${
                          isSelected
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-300 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        <span className="flex-shrink-0 text-green-500">{getAccountIcon(account)}</span>
                        <span className="truncate">{account.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                  {hasMoreToAccounts && (
                    <button
                      type="button"
                      onClick={() => setShowToAccountList(true)}
                      className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all min-w-[80px]"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                      <span>Ще</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Full To Account List Dropdown */}
                {showToAccountList && (
                  <div
                    ref={toAccountListRef}
                    className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden"
                  >
                    {accounts
                      .filter(a => (a.id || a._id) !== selectedAccount)
                      .map((account) => {
                        const accountId = account.id || account._id || '';
                        const isSelected = selectedToAccount === accountId;
                        return (
                          <button
                            key={accountId}
                            type="button"
                            onClick={() => {
                              setSelectedToAccount(accountId);
                              setShowToAccountList(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              isSelected
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="flex-shrink-0 text-green-500">{getAccountIcon(account)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{account.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {account.balance.toLocaleString('uk-UA')} {account.currency}
                              </p>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category - Interactive Grid (hidden for transfers) */}
          {mode !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Категорія
              </label>
              <div className="relative">
                <div className="grid grid-cols-4 gap-2">
                  {visibleCategories.map((category) => {
                    const categoryId = category.id || category._id || '';
                    const isSelected = selectedCategory === categoryId;
                    const { color, useGradient } = getCategoryVisual(category);
                    const accent = useGradient ? DEFAULT_ACCENT : color;
                    return (
                      <button
                        key={categoryId}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(categoryId);
                          setShowCategoryList(false);
                        }}
                        className={`relative flex flex-col items-center justify-start gap-1.5 px-1.5 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[88px] ${
                          isSelected
                            ? 'border-2 shadow-sm text-gray-800 dark:text-gray-100'
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: `${accent}18`,
                                borderColor: accent,
                              }
                            : undefined
                        }
                      >
                        <CategoryBadge category={category} selected={isSelected} />
                        <span className="line-clamp-2 leading-tight text-center w-full px-0.5">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                  {hasMoreCategories && (
                    <button
                      type="button"
                      onClick={() => setShowCategoryList(true)}
                      className="flex flex-col items-center justify-start gap-1.5 px-1.5 py-2.5 rounded-xl text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 transition-all min-h-[88px]"
                    >
                      <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200/80 dark:bg-gray-600/80 text-gray-500 dark:text-gray-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <MoreHorizontal className="w-4 h-4" />
                      </span>
                      <span className="line-clamp-2 leading-tight text-center">Ще</span>
                    </button>
                  )}
                </div>

                {/* Full Category List Modal */}
                {showCategoryList && (
                  <div
                    ref={categoryListRef}
                    className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
                  >
                    {filteredCategories.map((category) => {
                      const categoryId = category.id || category._id || '';
                      const isSelected = selectedCategory === categoryId;
                      return (
                        <button
                          key={categoryId}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(categoryId);
                            setShowCategoryList(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                            isSelected
                              ? 'bg-gray-50 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <CategoryBadge category={category} size="sm" selected={isSelected} />
                          <span className="truncate leading-tight">{category.name}</span>
                          {isSelected && <Check className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Нотатка (необов&#39;язково)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={mode === 'transfer' ? 'Додайте нотатку до переказу...' : 'Додайте нотатку...'}
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
            disabled={
              loading ||
              !amount ||
              Number(amount) <= 0 ||
              !selectedAccount ||
              (mode === 'transfer' ? !selectedToAccount : !selectedCategory)
            }
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              mode === 'expense'
                ? 'bg-red-500 hover:bg-red-600'
                : mode === 'income'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === 'transfer' ? 'Переказ...' : 'Збереження...'}
              </>
            ) : mode === 'transfer' ? (
              <>
                <ArrowRight className="w-5 h-5" />
                Переказати
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