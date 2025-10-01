import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  RefreshCw,
  Calendar
} from 'lucide-react';
import Header from '../components/Header';
import { transactionAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  jarId?: { name: string; icon?: string };
  recipientUPI?: string;
}

interface SummaryItem {
  _id: string;
  totalAmount: number;
  count: number;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState<SummaryItem[]>([]);

  const { state } = useData();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, searchTerm]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await transactionAPI.getTransactions({ limit: 100 });
      if (response.success) {
        setTransactions(response.transactions || []);
        setSummary(Array.isArray(response.summary) ? response.summary : []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      setTransactions([]);
      setSummary([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    if (filter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.jarId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />;
      case 'deposit': return <Plus className="w-5 h-5 text-blue-600" />;
      case 'payment': return <CreditCard className="w-5 h-5 text-red-600" />;
      case 'transfer': return <RefreshCw className="w-5 h-5 text-purple-600" />;
      default: return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
      case 'deposit': return 'text-emerald-600';
      case 'payment':
      case 'expense': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => type === 'income' || type === 'deposit' ? '+' : '-';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groupTransactionsByDate = () => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  };

  const getSummaryStats = () => {
    if (!Array.isArray(summary) || summary.length === 0) {
      return { totalIncome: 0, totalSpent: 0, totalDeposits: 0, transactionCount: 0 };
    }

    const stats = summary.reduce((acc: any, item: SummaryItem) => {
      acc[item._id] = item;
      return acc;
    }, {});

    const transactionCount = summary.reduce((sum, item) => sum + (item.count || 0), 0);

    return {
      totalIncome: stats.income?.totalAmount || 0,
      totalSpent: (stats.payment?.totalAmount || 0) + (stats.expense?.totalAmount || 0),
      totalDeposits: stats.deposit?.totalAmount || 0,
      transactionCount,
    };
  };

  const summaryStats = getSummaryStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <Header showBack />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header title="Transaction History" showBack />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-600">Income</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              ₹{summaryStats.totalIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Deposits</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              ₹{summaryStats.totalDeposits.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Spent</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              ₹{summaryStats.totalSpent.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <History className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-lg font-bold text-purple-600">
              {summaryStats.transactionCount}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="deposit">Deposits</option>
                <option value="payment">Payments</option>
                <option value="expense">Expenses</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>
            <button
              onClick={fetchTransactions}
              disabled={isLoading}
              className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'No Matching Transactions' : 'No Transactions Yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Your transaction history will appear here as you use the app.'}
              </p>
            </div>
          ) : (
            <div>
              {groupTransactionsByDate().map(([date, dayTransactions], index) => (
                <div key={date} className={index > 0 ? 'border-t border-gray-100' : ''}>
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{formatDate(date)}</span>
                      <span className="text-sm text-gray-500">
                        ({dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>

                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-6 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {transaction.jarId ? transaction.jarId.icon : getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>
                              {new Date(transaction.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {transaction.jarId && (
                              <>
                                <span>•</span>
                                <span>{transaction.jarId.name}</span>
                              </>
                            )}
                            {transaction.recipientUPI && (
                              <>
                                <span>•</span>
                                <span>To: {transaction.recipientUPI}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                          {getTransactionSign(transaction.type)}₹{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {filteredTransactions.length > 0 && filteredTransactions.length >= 50 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center mt-8">
            <button
              onClick={() => fetchTransactions()}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Load More Transactions
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TransactionHistory;
