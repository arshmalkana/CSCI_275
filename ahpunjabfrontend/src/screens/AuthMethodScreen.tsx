import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingLabelField from '../components/FloatingLabelField';
import { ArrowLeft, Lock, Fingerprint } from 'lucide-react';
import authService from '../services/authService';
import webauthnService from '../services/webauthnService';

export default function AuthMethodScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, hasPasskey, fullName } = location.state || {};

  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to username screen if no username in state
  if (!username) {
    navigate('/username', { replace: true });
    return null;
  }

  const handlePasskeyLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await webauthnService.loginWithPasskey(username, rememberMe);
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Passkey login error:', err);
      setError(err.message || 'Passkey authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await authService.login(username, password, rememberMe);
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Password login error:', err);
      setError(err.message || 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUser = () => {
    navigate('/username', { replace: true });
  };

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 pt-safe-top px-6 pt-6 pb-4">
        <button
          onClick={handleChangeUser}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-['Poppins']"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="space-y-6 pb-32">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1 font-['Poppins']">
              Welcome back{fullName && ','}
            </h2>
            {fullName && (
              <p className="text-xl text-gray-700 font-semibold font-['Poppins'] mb-2">
                {fullName}
              </p>
            )}
            <button
              onClick={handleChangeUser}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-['Poppins']"
            >
              Not {username}?
            </button>
          </div>

          {/* Passkey Login (if available) */}
          {hasPasskey && !showPassword && (
            <div className="space-y-4">
              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMePasskey"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="rememberMePasskey" className="text-sm text-gray-700 font-['Poppins']">
                  Keep me signed in for 90 days
                </label>
              </div>

              <button
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins'] flex items-center justify-center gap-3"
              >
                <Fingerprint size={24} />
                {isLoading ? 'Authenticating...' : 'Continue with Passkey'}
              </button>

              <button
                onClick={() => setShowPassword(true)}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-['Poppins'] py-2"
              >
                Use password instead?
              </button>
            </div>
          )}

          {/* Password Login (if no passkey or user chose password) */}
          {(!hasPasskey || showPassword) && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <FloatingLabelField
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={error}
                autoComplete="current-password"
                autoFocus
              />

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-700 font-['Poppins']">
                  Keep me signed in for 90 days
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-['Poppins']">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins']"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              {hasPasskey && showPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 font-['Poppins'] py-2"
                >
                  ← Back to passkey
                </button>
              )}
            </form>
          )}

          {/* Forgot Password Link */}
          {(!hasPasskey || showPassword) && (
            <div className="text-center">
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-['Poppins']"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Passkey Suggestion for Password Users */}
          {!hasPasskey && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800 font-['Poppins'] mb-2">
                💡 <strong>Set up a passkey</strong> for faster and more secure login
              </p>
              <p className="text-xs text-blue-700 font-['Poppins']">
                After signing in, go to Profile → Manage Passkeys
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}