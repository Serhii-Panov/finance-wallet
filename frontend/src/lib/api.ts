/**
 * API client for Finance Wallet backend.
 * Base URL: http://localhost:8000/api
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Types
export type AccountType = 'cash' | 'card' | 'savings';
export type Currency = 'UAH' | 'USD';
export type CategoryType = 'income' | 'expense';

export interface Account {
  id: string;
  _id?: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
}

export interface AccountCreate {
  name: string;
  type?: AccountType;
  currency?: Currency;
  balance?: number;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
}

export interface Transaction {
  id: string;
  _id?: string;
  account_id: string;
  category_id: string;
  amount: number;
  currency: Currency;
  rate_to_base: number | null;
  date: string;
  note: string | null;
}

export interface TransactionCreate {
  account_id: string;
  category_id: string;
  amount: number;
  currency?: Currency;
  rate_to_base?: number;
  date?: string;
  note?: string;
}

interface ApiResponse<T> {
  items: T[];
  total: number;
}

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Accounts API
export const accountsApi = {
  list: () => 
    apiFetch<ApiResponse<Account>>('/accounts/'),
  
  get: (id: string) => 
    apiFetch<Account>(`/accounts/${id}`),
  
  create: (data: AccountCreate) => 
    apiFetch<Account>('/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<AccountCreate>) => 
    apiFetch<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    apiFetch<void>(`/accounts/${id}`, {
      method: 'DELETE',
    }),
};

// Categories API
export const categoriesApi = {
  list: (type?: CategoryType) => {
    const params = type ? `?type=${type}` : '';
    return apiFetch<ApiResponse<Category>>(`/categories/${params}`);
  },
  
  get: (id: string) => 
    apiFetch<Category>(`/categories/${id}`),
  
  create: (data: Omit<Category, 'id'>) => 
    apiFetch<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  initDefaults: () => 
    apiFetch<ApiResponse<Category>>('/categories/init-defaults', {
      method: 'POST',
    }),
  
  update: (id: string, data: Partial<Category>) => 
    apiFetch<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    apiFetch<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Transactions API
export const transactionsApi = {
  list: (filters?: {
    account_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    skip?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiFetch<ApiResponse<Transaction>>(`/transactions/${queryString ? `?${queryString}` : ''}`);
  },
  
  get: (id: string) => 
    apiFetch<Transaction>(`/transactions/${id}`),
  
  create: (data: TransactionCreate) => 
    apiFetch<Transaction>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<TransactionCreate>) => 
    apiFetch<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    apiFetch<void>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
};