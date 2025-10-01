import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { jarAPI, bankAPI, transactionAPI } from '../services/api';

interface Jar {
  _id: string;
  name: string;
  icon: string;
  goalAmount: number;
  currentAmount: number;
  locked: boolean;
  progress: number;
  isCompleted: boolean;
  createdAt: string;
}

interface BankAccount {
  _id: string;
  bankName: string;
  upiId: string;
  cardLast4: string;
  currentBalance: number;
  isVerified: boolean;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  jarId?: { name: string; icon: string };
  recipientUPI?: string;
  status: string;
  createdAt: string;
}

interface DataState {
  jars: Jar[];
  bankAccount: BankAccount | null;
  transactions: Transaction[];
  isLoading: boolean;
}

type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_JARS'; payload: Jar[] }
  | { type: 'ADD_JAR'; payload: Jar }
  | { type: 'UPDATE_JAR'; payload: Jar }
  | { type: 'REMOVE_JAR'; payload: string }
  | { type: 'SET_BANK_ACCOUNT'; payload: BankAccount | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction };

const initialState: DataState = {
  jars: [],
  bankAccount: null,
  transactions: [],
  isLoading: false,
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_JARS':
      return { ...state, jars: action.payload };
    case 'ADD_JAR':
      return { ...state, jars: [action.payload, ...state.jars] };
    case 'UPDATE_JAR':
      return {
        ...state,
        jars: state.jars.map(jar =>
          jar._id === action.payload._id ? action.payload : jar
        ),
      };
    case 'REMOVE_JAR':
      return {
        ...state,
        jars: state.jars.filter(jar => jar._id !== action.payload),
      };
    case 'SET_BANK_ACCOUNT':
      return { ...state, bankAccount: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    default:
      return state;
  }
};

const DataContext = createContext<{
  state: DataState;
  fetchJars: () => Promise<void>;
  fetchBankAccount: () => Promise<void>;
  fetchTransactions: (filters?: any) => Promise<void>;
  addJar: (jar: Jar) => void;
  updateJar: (jar: Jar) => void;
  removeJar: (jarId: string) => void;
  setBankAccount: (account: BankAccount | null) => void;
}>({
  state: initialState,
  fetchJars: async () => {},
  fetchBankAccount: async () => {},
  fetchTransactions: async () => {},
  addJar: () => {},
  updateJar: () => {},
  removeJar: () => {},
  setBankAccount: () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { state: authState } = useAuth();

  const fetchJars = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await jarAPI.getJars();
      if (response.success) {
        dispatch({ type: 'SET_JARS', payload: response.jars });
      }
    } catch (error) {
      console.error('Failed to fetch jars:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchBankAccount = async () => {
    if (!authState.isAuthenticated) return;
    
    try {
      const response = await bankAPI.getBankAccount();
      if (response.success) {
        dispatch({ type: 'SET_BANK_ACCOUNT', payload: response.bankAccount });
      } else {
        dispatch({ type: 'SET_BANK_ACCOUNT', payload: null });
      }
    } catch (error) {
      dispatch({ type: 'SET_BANK_ACCOUNT', payload: null });
    }
  };

  const fetchTransactions = async (filters = {}) => {
    if (!authState.isAuthenticated) return;
    
    try {
      const response = await transactionAPI.getTransactions(filters);
      if (response.success) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: response.transactions });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const addJar = (jar: Jar) => {
    dispatch({ type: 'ADD_JAR', payload: jar });
  };

  const updateJar = (jar: Jar) => {
    dispatch({ type: 'UPDATE_JAR', payload: jar });
  };

  const removeJar = (jarId: string) => {
    dispatch({ type: 'REMOVE_JAR', payload: jarId });
  };

  const setBankAccount = (account: BankAccount | null) => {
    dispatch({ type: 'SET_BANK_ACCOUNT', payload: account });
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchJars();
      fetchBankAccount();
      fetchTransactions({ limit: 10 });
    }
  }, [authState.isAuthenticated]);

  return (
    <DataContext.Provider
      value={{
        state,
        fetchJars,
        fetchBankAccount,
        fetchTransactions,
        addJar,
        updateJar,
        removeJar,
        setBankAccount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};