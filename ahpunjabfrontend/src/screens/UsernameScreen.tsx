import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {FloatingLabelField} from '../components/FloatingLabelField';
import { User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function UsernameScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
    }
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user has passkeys
      const response = await fetch(`${API_BASE_URL}/v1/auth/check-passkey?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (data.success) {
        // Store username for Step 2 and future logins
        localStorage.setItem('rememberedUsername', username);

        // Navigate to auth method screen with state
        navigate('/auth-method', {
          state: {
            username,
            hasPasskey: data.hasPasskey,
            fullName: data.fullName
          }
        });
      } else {
        setError('Failed to check user status');
      }
    } catch (err) {
      console.error('Check passkey error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 pt-safe-top px-6 pt-12 pb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-['Poppins']">
            AH Punjab Reporting
          </h1>
          <p className="text-sm text-gray-600 font-['Poppins']">
            Animal Husbandry Department
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <form onSubmit={handleNext} className="space-y-6 pb-32">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 font-['Poppins']">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-600 font-['Poppins']">
              Enter your username to continue
            </p>
          </div>

          <FloatingLabelField
          field="username"
            label="Username"
            type="text"
            value={username}
            onChange={(field: string, value: string) => setUsername(value)}
            icon={<User size={20} />}
            error={error}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-['Poppins']">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Fixed Bottom Button */}
      <div
        className="flex-shrink-0 px-6 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="submit"
          onClick={handleNext}
          disabled={isLoading || !username.trim()}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins'] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}