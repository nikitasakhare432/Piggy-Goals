import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Plus, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import { jarAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateJar: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    goalAmount: '',
    icon: '🏺',
    allocationPercentage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { addJar } = useData();

  const jarIcons = [
    '🏺', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '🏖️',
    '🎯', '📱', '💻', '🎮', '👕', '🍕', '🎪', '🎨'
  ];

  const jarTemplates = [
    { name: 'Emergency Fund', icon: '🆘', goalAmount: 50000 },
    { name: 'Vacation', icon: '🏖️', goalAmount: 30000 },
    { name: 'New Car', icon: '🚗', goalAmount: 200000 },
    { name: 'Home Down Payment', icon: '🏠', goalAmount: 500000 },
    { name: 'Wedding', icon: '💍', goalAmount: 100000 },
    { name: 'Education', icon: '🎓', goalAmount: 75000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await jarAPI.createJar({
        name: formData.name,
        goalAmount: parseFloat(formData.goalAmount),
        icon: formData.icon,
        allocationPercentage: formData.allocationPercentage 
          ? parseFloat(formData.allocationPercentage) 
          : undefined,
      });

      if (response.success) {
        addJar(response.jar);
        toast.success('Savings jar created successfully! 🎉');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create jar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'goalAmount' || name === 'allocationPercentage') {
      // Only allow numbers and decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTemplateSelect = (template: typeof jarTemplates[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      icon: template.icon,
      goalAmount: template.goalAmount.toString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Header title="Create New Jar" showBack />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Your Savings Jar
            </h1>
            <p className="text-gray-600">
              Set a goal and start saving for what matters most to you
            </p>
          </div>

          {/* Quick Templates */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {jarTemplates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group"
                >
                  <div className="text-xl mb-1">{template.icon}</div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    ₹{template.goalAmount.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jar Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="What are you saving for?"
                required
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/50 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose an Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {jarIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      formData.icon === icon
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-600">₹</span>
                <input
                  type="text"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  placeholder="10000"
                  required
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              {formData.goalAmount && (
                <p className="text-sm text-gray-600 mt-1">
                  Goal: ₹{parseFloat(formData.goalAmount || '0').toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Allocation (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="allocationPercentage"
                  value={formData.allocationPercentage}
                  onChange={handleChange}
                  placeholder="10"
                  max="100"
                  className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
                <span className="absolute right-3 top-3.5 text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automatically allocate a percentage of your income to this jar
              </p>
            </div>

            {formData.goalAmount && formData.allocationPercentage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h4 className="font-medium text-emerald-900 mb-2">Projection</h4>
                <p className="text-sm text-emerald-800">
                  At {formData.allocationPercentage}% allocation, you'll reach your goal of{' '}
                  ₹{parseFloat(formData.goalAmount).toLocaleString()} in approximately{' '}
                  <span className="font-semibold">
                    {Math.ceil(
                      parseFloat(formData.goalAmount) / 
                      ((25000 * parseFloat(formData.allocationPercentage)) / 100)
                    )} months
                  </span>
                  {' '}(assuming ₹25,000 monthly income)
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.goalAmount}
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Jar...
                </>
              ) : (
                <>
                  Create Savings Jar
                  <Plus className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateJar;