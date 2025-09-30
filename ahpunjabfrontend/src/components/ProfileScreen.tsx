import React, { useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

export default function ProfileScreen() {
  const [formData, setFormData] = useState({
    inchargeName: '',
    email: '',
    mobile: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Profile updated:', formData);
    // Handle profile update logic here
  };

  const handleClose = () => {
    console.log('Close profile');
    // Handle close logic here
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Mobile Device Frame */}
      <div className="relative w-full max-w-sm h-[800px] bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>

        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col">
          {/* Status Bar */}
          <div className="h-12 bg-white flex items-center justify-between px-8 pt-2">
            <span className="text-sm font-semibold">9:41</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-3 border border-black rounded-sm"></div>
              <div className="w-4 h-3 border border-black rounded-sm"></div>
              <div className="w-5 h-3 border-2 border-black rounded-sm relative">
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-2 bg-black"></div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200"
            >
              <X size={24} className="text-gray-700" />
            </button>

            <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>

            <button
              onClick={handleSubmit}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200"
            >
              <Check size={24} className="text-green-600" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center py-8 bg-white">
              <div className="relative">
                <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow-md">
                  <svg
                    width="70"
                    height="70"
                    viewBox="0 0 99 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M49.0863 0C39.5705 0.0186268 30.2654 2.88782 22.3043 8.2581C14.3432 13.6284 8.0697 21.268 4.24797 30.2463C0.426243 39.2246 -0.778777 49.1543 0.779686 58.8256C2.33815 68.497 6.59283 77.4928 13.0255 84.7172C17.6198 89.848 23.1958 93.9427 29.4022 96.7434C35.6085 99.5441 42.3107 100.99 49.0863 100.99C55.8618 100.99 62.564 99.5441 68.7703 96.7434C74.9767 93.9427 80.5527 89.848 85.147 84.7172C91.5797 77.4928 95.8344 68.497 97.3928 58.8256C98.9513 49.1543 97.7463 39.2246 93.9245 30.2463C90.1028 21.268 83.8293 13.6284 75.8682 8.2581C67.9071 2.88782 58.602 0.0186268 49.0863 0ZM49.0863 90.985C38.9228 90.9691 29.1617 86.8921 21.8567 79.6119C24.0745 74.0494 27.8474 69.2917 32.6958 65.9434C37.5442 62.5951 43.2494 60.8073 49.0863 60.8073C54.9231 60.8073 60.6283 62.5951 65.4767 65.9434C70.3251 69.2917 74.098 74.0494 76.3158 79.6119C69.0108 86.8921 59.2497 90.9691 49.0863 90.985ZM39.2738 40.4378C39.2738 38.4383 39.8493 36.4838 40.9275 34.8213C42.0057 33.1588 43.5382 31.863 45.3312 31.0979C47.1242 30.3327 49.0971 30.1325 51.0006 30.5226C52.904 30.9127 54.6524 31.8755 56.0247 33.2893C57.397 34.7032 58.3315 36.5045 58.7102 38.4655C59.0888 40.4266 58.8945 42.4592 58.1518 44.3065C57.4091 46.1538 56.1514 47.7327 54.5378 48.8435C52.9241 49.9543 51.027 50.5472 49.0863 50.5472C46.4838 50.5472 43.988 49.4821 42.1478 47.5863C40.3076 45.6904 39.2738 43.119 39.2738 40.4378Z"
                      fill="black"
                    />
                  </svg>
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors">
                  <Camera size={20} className="text-white" />
                </button>
              </div>

              <button className="mt-4 text-blue-600 text-sm font-medium hover:underline active:text-blue-800">
                Edit Profile Picture
              </button>
            </div>

            {/* Form Section */}
            <div className="px-6 py-6 space-y-5 bg-gray-50">
              {/* Incharge Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Incharge Name
                </label>
                <input
                  type="text"
                  name="inchargeName"
                  value={formData.inchargeName}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  className="w-full h-12 px-4 bg-white rounded-lg border border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>

              {/* Divider */}
              <div className="pt-4 border-t border-gray-300"></div>

              {/* Change Password Link */}
              <button className="w-full text-left text-blue-600 text-sm font-medium hover:underline active:text-blue-800 py-2">
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Home Indicator (iOS style) */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
      </div>
    </div>
  );
}