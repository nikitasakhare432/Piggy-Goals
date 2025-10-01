import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Lock, 
  Unlock, 
  CreditCard, 
  Edit3, 
  Trash2,
  ArrowUpRight,
  History,
  Target
} from 'lucide-react';
import Header from '../components/Header';
import { jarAPI, paymentAPI, transactionAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const JarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateJar, removeJar } = useData();
  const { state: authState, updateUser } = useAuth();
  
  const [jar, setJar] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    recipientUPI: '',
    description: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    goalAmount: '',
    icon: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJarDetails();
    fetchJarTransactions();
  }, [id]);

  const fetchJarDetails = async () => {
    try {
      const response = await jarAPI.getJar(id!);
      if (response.success) {
        setJar(response.jar);
        setEditData({
          name: response.jar.name,
          goalAmount: response.jar.goalAmount.toString(),
          icon: response.jar.icon,
        });
      }
    } catch (error: any) {
      toast.error('Failed to load jar details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJarTransactions = async () => {
    try {
      const response = await transactionAPI.getTransactions({ jarId: id });
      if (response.success) {
        setTransactions(response.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch jar transactions');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await jarAPI.depositToJar(jar._id, parseFloat(depositAmount));
      if (response.success) {
        setJar(response.jar);
        updateJar(response.jar);
        updateUser({
          ...authState.user!,
          income: response.user.income,
          totalSaved: response.user.totalSaved,
        });
        toast.success(response.message);
        setShowDepositModal(false);
        setDepositAmount('');
        fetchJarTransactions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData.amount || !paymentData.recipientUPI) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await paymentAPI.simulateUPIPayment({
        jarId: jar._id,
        amount: parseFloat(paymentData.amount),
        recipientUPI: paymentData.recipientUPI,
        description: paymentData.description,
      });

      if (response.success) {
        setJar({ ...jar, currentAmount: response.jar.currentAmount });
        updateJar({ ...jar, currentAmount: response.jar.currentAmount });
        toast.success(response.message);
        setShowPaymentModal(false);
        setPaymentData({ amount: '', recipientUPI: '', description: '' });
        fetchJarTransactions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockToggle = async () => {
    setIsSubmitting(true);
    try {
      const response = await jarAPI.lockJar(jar._id, !jar.locked);
      if (response.success) {
        setJar(response.jar);
        updateJar(response.jar);
        toast.success(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update lock status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editData.name || !editData.goalAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await jarAPI.updateJar(jar._id, {
        name: editData.name,
        goalAmount: parseFloat(editData.goalAmount),
        icon: editData.icon,
      });

      if (response.success) {
        setJar(response.jar);
        updateJar(response.jar);
        toast.success('Jar updated successfully');
        setShowEditModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update jar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this jar? Any saved money will be returned to your income.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await jarAPI.deleteJar(jar._id);
      if (response.success) {
        removeJar(jar._id);
        toast.success(response.message);
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete jar');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!jar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <Header showBack />
        <div className="text-center py-20">
          <p className="text-gray-600">Jar not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header
        title={jar.name}
        showBack
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Jar Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{jar.icon}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{jar.name}</h1>
              {jar.locked ? (
                <Lock className="w-6 h-6 text-amber-500" />
              ) : (
                <Unlock className="w-6 h-6 text-emerald-500" />
              )}
            </div>
            {jar.isCompleted && (
              <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                <span>🎉</span>
                <span>Goal Achieved!</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {jar.progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-emerald-500 h-4 rounded-full transition-all duration-500 relative"
                style={{ width: `${Math.min(jar.progress, 100)}%` }}
              >
                {jar.progress > 10 && (
                  <div className="absolute right-2 top-0 h-full flex items-center">
                    <span className="text-xs text-white font-medium">
                      {jar.progress.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Saved</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{jar.currentAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Goal</p>
                <p className="text-xl font-semibold text-gray-700">
                  ₹{jar.goalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Money</span>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={jar.locked || jar.currentAmount === 0}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Now</span>
            </button>

            <button
              onClick={handleLockToggle}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                jar.locked
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {jar.locked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Lock</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <History className="w-5 h-5 mr-2" />
              Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-600">
                Start by adding money to your jar or making payments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {transaction.type === 'deposit' ? (
                        <Plus className="w-5 h-5 text-emerald-600" />
                      ) : transaction.type === 'payment' ? (
                        <ArrowUpRight className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Target className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {transaction.recipientUPI && (
                        <p className="text-xs text-gray-500">
                          To: {transaction.recipientUPI}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit'
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}
                      ₹{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Money to {jar.name}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Available Income: ₹{authState.user?.income?.toLocaleString()}
              </p>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-600">₹</span>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={isSubmitting || !depositAmount}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Add Money'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Make Payment from {jar.name}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Available Balance: ₹{jar.currentAmount.toLocaleString()}
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-600">₹</span>
                  <input
                    type="text"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      amount: e.target.value.replace(/[^\d.]/g, '')
                    })}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <input
                  type="email"
                  value={paymentData.recipientUPI}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    recipientUPI: e.target.value
                  })}
                  placeholder="Recipient UPI ID (e.g., user@paytm)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    description: e.target.value
                  })}
                  placeholder="Description (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isSubmitting || !paymentData.amount || !paymentData.recipientUPI}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Edit Jar
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jar Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-600">₹</span>
                  <input
                    type="text"
                    value={editData.goalAmount}
                    onChange={(e) => setEditData({
                      ...editData,
                      goalAmount: e.target.value.replace(/[^\d.]/g, '')
                    })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  value={editData.icon}
                  onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editData.name || !editData.goalAmount}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JarDetails;