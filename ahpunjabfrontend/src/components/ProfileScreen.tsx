import { useState } from 'react';
import { FloatingLabelField } from './FloatingLabelField';
import { ArrowLeft, Camera, User, Mail, Phone, Lock } from 'lucide-react';

export default function ProfileScreen() {
  const [formData, setFormData] = useState({
    inchargeName: 'Dr. Gurmeet Singh',
    email: 'gurmeet.singh@ahpunjab.gov.in',
    mobile: '9876543210'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  };

  const handleSave = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.inchargeName.trim()) {
      newErrors.inchargeName = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validatePhone(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Profile updated:', formData);
      // Handle profile update logic here
    }
  };

  const handleBack = () => {
    console.log('Navigate back');
  };

  const handleChangePassword = () => {
    console.log('Navigate to change password');
  };

  return (
    <div className="ProfileScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Edit Profile</h1>

        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1  bg-gray-50 pb-10">

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center py-8 bg-white">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <User size={64} className="text-yellow-600" />
            </div>
            <button className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105">
              <Camera size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-6 py-6 space-y-6">

          {/* Personal Information Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Personal Information</h2>

            {/* Incharge Name */}
            <FloatingLabelField
              field="inchargeName"
              label="Full Name"
              type="text"
              required
              value={formData.inchargeName}
              error={errors.inchargeName}
              onChange={handleInputChange}
              icon={<User size={20} />}
            />

            {/* Email Address */}
            <FloatingLabelField
              field="email"
              label="Email Address"
              type="email"
              required
              value={formData.email}
              error={errors.email}
              onChange={handleInputChange}
              icon={<Mail size={20} />}
            />

            {/* Mobile */}
            <FloatingLabelField
              field="mobile"
              label="Mobile Number"
              type="tel"
              required
              value={formData.mobile}
              error={errors.mobile}
              onChange={handleInputChange}
              icon={<Phone size={20} />}
            />
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Security</h2>

            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 font-['Poppins']">Change Password</p>
                  <p className="text-xs text-gray-500 font-['Poppins']">Update your password</p>
                </div>
              </div>
              <ArrowLeft size={20} className="text-gray-400 rotate-180" />
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-['Poppins'] leading-relaxed">
              Your profile information is used across the AH Punjab system. Make sure to keep it up to date for better communication.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="p-6 fixed bottom-0 bg-white border-t border-gray-100">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}