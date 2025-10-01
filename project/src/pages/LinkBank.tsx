import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Landmark, CreditCard, Shield, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import { bankAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const LinkBank: React.FC = () => {
  const [formData, setFormData] = useState({
    bankName: '',
    upiId: '',
    cardNumber: '',
    cvv: '',
    expiry: '',
    currentBalance: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const { state, setBankAccount, fetchBankAccount } = useData();

  useEffect(() => {
    if (state.bankAccount) {
      setFormData({
        bankName: state.bankAccount.bankName,
        upiId: state.bankAccount.upiId,
        cardNumber: `****-****-****-${state.bankAccount.cardLast4}`,
        cvv: '',
        expiry: state.bankAccount.expiry || '',
        currentBalance: state.bankAccount.currentBalance.toString(),
      });
      setIsEditing(true);
    }
  }, [state.bankAccount]);

  const bankOptions = [
    'SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOI', 'Canara', 'Union', 'IDBI'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cardLast4 = formData.cardNumber.replace(/\D/g, '').slice(-4);
      
      const response = await bankAPI.linkBank({
        bankName: formData.bankName,
        upiId: formData.upiId,
        cardLast4,
        cvv: formData.cvv,
        expiry: formData.expiry,
        currentBalance: parseFloat(formData.currentBalance),
      });

      if (response.success) {
        setBankAccount(response.bankAccount);
        toast.success(isEditing ? 'Bank account updated successfully!' : 'Bank account linked successfully!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to link bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with dashes
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1-');
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'expiry') {
      // Format expiry as MM/YY
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 2) {
        formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
      }
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'currentBalance') {
      // Only allow numbers
      const numericValue = value.replace(/[^\d.]/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header title={isEditing ? 'Update Bank Account' : 'Link Bank Account'} showBack />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditing ? 'Update Your Bank Account' : 'Secure Bank Linking'}
            </h1>
            <p className="text-gray-600">
              {isEditing 
                ? 'Update your bank account information safely and securely'
                : 'Connect your bank account to sync income and manage payments'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bank
              </label>
              <select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Choose your bank</option>
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="email"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="yourname@paytm"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234-5678-9012-3456"
                    maxLength={19}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-600">₹</span>
                  <input
                    type="text"
                    name="currentBalance"
                    value={formData.currentBalance}
                    onChange={handleChange}
                    placeholder="50000"
                    required
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="password"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={formData.expiry}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 font-mono"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Secure & Encrypted</h3>
                  <p className="text-sm text-blue-700">
                    Your banking information is encrypted and stored securely. We use industry-standard 
                    security measures to protect your data.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.bankName || !formData.upiId || !formData.currentBalance}
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Updating...' : 'Linking...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Account' : 'Link Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {isEditing && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel Changes
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default LinkBank;