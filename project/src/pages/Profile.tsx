import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, X, Shield, Smartphone } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile: React.FC = () => {
  const { state: authState, updateUser } = useAuth();
  const { state: dataState } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    profileImage: authState.user?.profileImage || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      name: authState.user?.name || '',
      profileImage: authState.user?.profileImage || '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authAPI.updateProfile({
        name: formData.name.trim(),
        profileImage: formData.profileImage,
      });

      if (response.success) {
        updateUser(response.user);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: authState.user?.name || '',
      profileImage: authState.user?.profileImage || '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const profileStats = [
    {
      label: 'Total Saved',
      value: `₹${authState.user?.totalSaved?.toLocaleString() || 0}`,
      icon: '💰',
      color: 'text-emerald-600',
    },
    {
      label: 'Active Jars',
      value: dataState.jars.length.toString(),
      icon: '🏺',
      color: 'text-blue-600',
    },
    {
      label: 'Available Income',
      value: `₹${authState.user?.income?.toLocaleString() || 0}`,
      icon: '💵',
      color: 'text-purple-600',
    },
    {
      label: 'Completed Goals',
      value: dataState.jars.filter(jar => jar.isCompleted).length.toString(),
      icon: '🎯',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header title="Profile" showBack />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-emerald-500 focus:outline-none pb-1"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {authState.user?.name}
                  </h1>
                )}
                <p className="text-gray-600 flex items-center mt-1">
                  <Smartphone className="w-4 h-4 mr-2" />
                  {authState.user?.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !formData.name.trim()}
                    className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Image URL Input (only when editing) */}
          {isEditing && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image URL (Optional)
              </label>
              <input
                type="url"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleChange}
                placeholder="https://example.com/profile.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {profileStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 bg-gray-50 rounded-xl"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emerald-600" />
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Phone Number</span>
              <span className="font-medium text-gray-900">{authState.user?.phone}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900">
                {new Date(authState.user?.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Bank Account</span>
              <span className="font-medium text-gray-900">
                {dataState.bankAccount ? (
                  <span className="text-emerald-600">
                    {dataState.bankAccount.bankName} •••• {dataState.bankAccount.cardLast4}
                  </span>
                ) : (
                  <span className="text-gray-400">Not linked</span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-gray-600">Account Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
          </div>
        </motion.div>

        {/* Savings Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Your Savings Journey
          </h2>

          {dataState.jars.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">🏺</div>
              </div>
              <p className="text-gray-600">No savings jars created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dataState.jars.map((jar) => (
                <div
                  key={jar._id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{jar.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{jar.name}</h3>
                      <p className="text-sm text-gray-600">
                        ₹{jar.currentAmount.toLocaleString()} of ₹{jar.goalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {jar.progress.toFixed(0)}%
                    </p>
                    {jar.isCompleted && (
                      <span className="text-xs text-emerald-600 font-medium">Completed!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;