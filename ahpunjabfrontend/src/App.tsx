import React, { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import ForgetPasswordScreen from './components/ForgetPasswordScreen';
import NotificationsScreen from './components/NotificationsScreen';
import HomeScreen from './components/HomeScreen';

const screens = {
  Home: <HomeScreen />,
  Login: <LoginScreen />,
  Register: <RegisterScreen />,
  ForgetPassword: <ForgetPasswordScreen />,
  ChangePassword: <ChangePasswordScreen />,
  Notifications: <NotificationsScreen />,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<keyof typeof screens | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {!activeScreen ? (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select a Screen</h2>
          <div className="flex flex-wrap gap-4">
            {Object.keys(screens).map((screenKey) => (
              <button
                key={screenKey}
                onClick={() => setActiveScreen(screenKey as keyof typeof screens)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                {screenKey}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative w-screen h-screen">
          {/* Back button overlay */}
          <button
            onClick={() => setActiveScreen(null)}
            className="absolute top-4 left-4 z-10 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-400 transition"
          >
            ⬅ Back
          </button>

          {/* Screen fills the whole page */}
          <div className="w-full h-full">{screens[activeScreen]}</div>
        </div>
      )}
    </div>
  );
}
