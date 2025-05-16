import React, { useState, useEffect, useRef } from 'react';
import { addMonths } from 'date-fns';
import { Loader2, User, Mail, Phone, Calendar, CreditCard, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../App';
import { Tooltip } from 'react-tooltip';

interface FormData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  plan: '1month' | '2month' | '3month' | '6month' | 'yearly';
  startDate: string;
  endDate: string;
  paymentMethod: 'cash' | 'online';
  image?: File | null;
  [key: string]: any;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  [key: string]: string | undefined;
}

interface PlanOption {
  id: '1month' | '2month' | '3month' | '6month' | 'yearly';
  name: string;
  price: number;
  months: number;
}

const plans: PlanOption[] = [
  {
    id: '1month',
    name: '1 Month',
    price: 1500,
    months: 1
  },
  {
    id: '2month',
    name: '2 Months',
    price: 2500,
    months: 2
  },
  {
    id: '3month',
    name: '3 Months',
    price: 3500,
    months: 3
  },
  {
    id: '6month',
    name: '6 Months',
    price: 5000,
    months: 6
  },
  {
    id: 'yearly',
    name: '1 Year',
    price: 8000,
    months: 12
  }
];

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    dob: '',
    plan: '1month',
    startDate: new Date().toISOString().split('T')[0],
    endDate: addMonths(new Date(), 1).toISOString().split('T')[0],
    paymentMethod: 'online',
    image: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedPlan, setSelectedPlan] = useState<'1month' | '2month' | '3month' | '6month' | 'yearly'>('1month');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailExists(false);
        setErrors(prev => ({ ...prev, email: undefined }));
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/check-email?email=${encodeURIComponent(formData.email)}`);
        if (!response.ok) {
          throw new Error('Failed to check email');
        }
        const data = await response.json();
        console.log('Email check response:', data); // Debug log
        setEmailExists(data.exists);
        if (data.exists) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        } else {
          setErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailExists(false);
        setErrors(prev => ({ ...prev, email: undefined }));
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  const handlePlanSelect = (plan: PlanOption) => {
    const startDate = new Date();
    const endDate = addMonths(startDate, plan.months);
    setSelectedPlan(plan.id);
    setFormData(prev => ({
      ...prev,
      plan: plan.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }
    }

    // Date of birth validation
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (emailExists) {
      toast.error('This email is already registered. Please use a different email.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formDataToSend.append('image', value);
        } else if (key !== 'image') {
          formDataToSend.append(key, value as string);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-800 bg-opacity-50 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 relative">
        {/* Centered Error Message */}
        {emailExists && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/70">
            <div className="bg-gray-800 p-6 rounded-xl border-2 border-red-500 max-w-md mx-4 transform transition-all duration-300 scale-100">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="text-red-500" size={48} />
                </div>
                <h3 className="text-xl font-bold text-red-500 mb-2">Email Already Registered</h3>
                <p className="text-gray-300 mb-4">
                  This email address is already registered in our system. Please use a different email address or try logging in.
                </p>
                <button
                  onClick={() => {
                    setEmailExists(false);
                    setFormData(prev => ({ ...prev, email: '' }));
                  }}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300 flex items-center justify-center mx-auto"
                >
                  <X className="mr-2" size={18} />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl font-bold text-center text-yellow-500 mb-6 sm:mb-8">Join Gym</h2>
        
        {/* Price Selection Section */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
            <CreditCard className="mr-2 text-yellow-500" size={20} />
            Select Your Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                className={`p-4 sm:p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  selectedPlan === plan.id
                    ? 'bg-yellow-500 text-black shadow-lg'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <div className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{plan.name}</div>
                <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{formatPrice(plan.price)}</div>
                <div className="text-xs sm:text-sm opacity-80">{plan.months} months access</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
          {/* Personal Information Section */}
          <div className="space-y-4 sm:space-y-6 border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <User className="mr-2 text-yellow-500" size={20} />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-white mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 sm:py-3 rounded-lg bg-gray-700 text-white border ${
                      errors.name ? 'border-red-500' : 'border-gray-600'
                    } focus:outline-none focus:border-yellow-500 transition-colors`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="mr-1" size={14} />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 sm:py-3 rounded-lg bg-gray-700 text-white border ${
                      emailExists ? 'border-red-500' : 'border-gray-600'
                    } focus:outline-none focus:border-yellow-500 transition-colors`}
                    placeholder="Enter your email"
                  />
                  {isCheckingEmail && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {emailExists && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {emailExists && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="mr-1" size={14} />
                    This email is already registered
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 sm:py-3 rounded-lg bg-gray-700 text-white border ${
                      errors.phone ? 'border-red-500' : 'border-gray-600'
                    } focus:outline-none focus:border-yellow-500 transition-colors`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="mr-1" size={14} />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className={`w-full pl-10 pr-3 py-2 sm:py-3 rounded-lg bg-gray-700 text-white border ${
                      errors.dob ? 'border-red-500' : 'border-gray-600'
                    } focus:outline-none focus:border-yellow-500 transition-colors`}
                  />
                </div>
                {errors.dob && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="mr-1" size={14} />
                    {errors.dob}
                  </p>
                )}
              </div>
            </div>
            {/* Profile Image Upload - enhanced */}
            <div className="md:col-span-2 mt-4">
              <label className="block text-white mb-2">Profile Image (optional)</label>
              <div className="relative flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-14 w-14 rounded-full object-cover border-2 border-yellow-500 shadow"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                        aria-label="Remove image"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 w-14 flex items-center justify-center rounded-full bg-gray-700 border-2 border-gray-600">
                      <ImageIcon className="text-gray-400" size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="block w-full pl-10 pr-3 py-2 sm:py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                  <span className="text-xs text-gray-400 ml-2">Max size: 5MB. JPEG, PNG, or GIF recommended.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="space-y-4 sm:space-y-6 border-b border-gray-700 pb-6 mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <CreditCard className="mr-2 text-yellow-500" size={20} />
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                className={`p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                  formData.paymentMethod === 'online'
                    ? 'bg-yellow-500 text-black shadow-lg'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Online Payment
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                className={`p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                  formData.paymentMethod === 'cash'
                    ? 'bg-yellow-500 text-black shadow-lg'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Cash Payment
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={isLoading || emailExists}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                emailExists 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Processing...
                </>
              ) : emailExists ? (
                <>
                  <AlertCircle className="mr-2" size={20} />
                  Email Already Registered
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;