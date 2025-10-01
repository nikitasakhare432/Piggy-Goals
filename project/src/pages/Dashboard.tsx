import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Landmark, 
  History, 
  TrendingUp, 
  Target,
  Lock,
  Unlock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { bankAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { state: authState, updateUser } = useAuth();
  const { state: dataState } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncIncome = async () => {
    setIsSyncing(true);
    try {
      const response = await bankAPI.syncIncome();
      if (response.success) {
        updateUser({
          ...authState.user!,
          income: response.user.income
        });
        toast.success(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync income');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalGoalAmount = dataState.jars.reduce((sum, jar) => sum + jar.goalAmount, 0);
  const totalCurrentAmount = dataState.jars.reduce((sum, jar) => sum + jar.currentAmount, 0);
  const averageProgress = dataState.jars.length > 0 
    ? (totalCurrentAmount / totalGoalAmount) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {authState.user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Track your savings goals and manage your finances
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{authState.user?.income?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Saved</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{authState.user?.totalSaved?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-lg">🏺</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jars</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataState.jars.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="text-lg">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageProgress.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {!dataState.bankAccount && (
            <Link
              to="/link-bank"
              className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-center group"
            >
              <Landmark className="w-8 h-8 text-gray-400 group-hover:text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Link Bank</h3>
              <p className="text-sm text-gray-600">Connect your bank account</p>
            </Link>
          )}

          {dataState.bankAccount && (
            <button
              onClick={handleSyncIncome}
              disabled={isSyncing}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-center group disabled:opacity-50"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {isSyncing ? 'Syncing...' : 'Sync Income'}
              </h3>
              <p className="text-sm text-gray-600">Add ₹25,000 from bank</p>
            </button>
          )}

          <Link
            to="/create-jar"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-center group"
          >
            <Plus className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Create Jar</h3>
            <p className="text-sm text-gray-600">Start a new savings goal</p>
          </Link>

          <Link
            to="/transactions"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-center group"
          >
            <History className="w-8 h-8 text-gray-600 group-hover:text-emerald-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">History</h3>
            <p className="text-sm text-gray-600">View all transactions</p>
          </Link>
        </motion.div>

        {/* Savings Jars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Savings Jars</h2>
            <Link
              to="/create-jar"
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Jar</span>
            </Link>
          </div>

          {dataState.jars.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">🏺</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Savings Jars Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first savings jar to start working towards your financial goals.
              </p>
              <Link
                to="/create-jar"
                className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Jar</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataState.jars.map((jar, index) => (
                <motion.div
                  key={jar._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link
                    to={`/jar/${jar._id}`}
                    className="block bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{jar.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                            {jar.name}
                          </h3>
                          {jar.locked && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-amber-600 font-medium">Locked</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!jar.locked && (
                        <Unlock className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">
                          {jar.progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(jar.progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-600">Saved</p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{jar.currentAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Goal</p>
                        <p className="text-sm font-medium text-gray-700">
                          ₹{jar.goalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {jar.isCompleted && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">🎉</div>
                          <span className="text-sm font-medium text-emerald-800">
                            Goal Achieved!
                          </span>
                        </div>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        {dataState.transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <Link
                to="/transactions"
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                View All
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {dataState.transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {transaction.jarId ? (
                        <span className="text-sm">{transaction.jarId.icon}</span>
                      ) : (
                        <div className="text-sm">💰</div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' || transaction.type === 'deposit'
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' || transaction.type === 'deposit' ? '+' : '-'}
                      ₹{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;