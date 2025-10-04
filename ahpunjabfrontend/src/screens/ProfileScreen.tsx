import { useState } from 'react';
import { FloatingLabelField } from '../components/FloatingLabelField';
import { PrimaryButton } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { validateEmail, validatePhone } from '../utils/validation';
import { Camera, User, Mail, Phone, Lock, ArrowLeft} from 'lucide-react';
import { MapPicker } from '../components/MapPicker';

export default function ProfileScreen() {
  const [formData, setFormData] = useState({
    inchargeName: 'Dr. Rajdeep Sandhu',
    email: 'rajdeep.sandhu@ahpunjab.gov.in',
    mobile: '9834562107',
    latitude:"30.4681",
    longitude: "72.6503"
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    <div className="ProfileScreen w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <ScreenHeader title="Edit Profile" onBack={handleBack} />

      {/* Scrollable Content - Takes remaining space, scrolls internally */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center py-8 bg-white">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <User size={64} className="text-yellow-600" />
            </div>
            <button className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 active:scale-95">
              <Camera size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Section - Added extra bottom padding for button clearance */}
        <div className="px-6 py-6 space-y-6 pb-32">

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

          {/* Institute Details Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Institute Details</h2>
            {/* Location Selection - Accordion Style */}
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              title="Update Location"
              onLocationSelect={(lat, lng) => {
                handleInputChange('latitude', lat.toString())
                handleInputChange('longitude', lng.toString())
              }}
            />
            {/* <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
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
            </button> */}
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Security</h2>

            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
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

      {/* Save Button - Fixed at bottom of ProfileScreen */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-100 w-full px-6 pt-6"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <PrimaryButton onClick={handleSave}>
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}