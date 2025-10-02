import React, { useState } from 'react'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ForgetPasswordScreen from './screens/ForgetPasswordScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';

const screens = {
  Home: <HomeScreen />,
  Login: <LoginScreen />,
  Register: <RegisterScreen />,
  ForgetPassword: <ForgetPasswordScreen />,
  ChangePassword: <ChangePasswordScreen />,
  Notifications: <NotificationsScreen />,
  Profile: <ProfileScreen />,
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<keyof typeof screens | null>(null);

  return (
    <div className="h-full w-full overflow-hidden bg-gray-100 font-sans">
      {!activeScreen ? (
        <div className="p-6 overflow-y-auto h-full">
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
        <div className="relative w-full h-full overflow-hidden">
          {/* Back button overlay */}
          <button
            onClick={() => setActiveScreen(null)}
            className="absolute top-4 left-4 z-50 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-400 transition"
          >
            ⬅ Back
          </button>

          {/* Screen fills the whole page */}
          <div className="w-full h-full overflow-hidden">{screens[activeScreen]}</div>
        </div>
      )}
    </div>
  );
}
