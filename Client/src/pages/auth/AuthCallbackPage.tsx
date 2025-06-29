import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userDataParam = searchParams.get('user');
        const error = searchParams.get('error');

        console.log('🔍 OAuth Callback - Received data:', {
          hasToken: !!token,
          hasUserData: !!userDataParam,
          error
        });

        if (error) {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          showToast('OAuth authentication failed', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setStatus('error');
          setMessage('No authentication token received.');
          showToast('No authentication token received', 'error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // If we have user data from URL, use it directly
        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            setToken(token);
            setUser(userData);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('OAuth token saved to localStorage:', localStorage.getItem('token'));
            console.log('OAuth user saved to localStorage:', localStorage.getItem('user'));
            setStatus('success');
            setMessage('Authentication successful! Redirecting to dashboard...');
            showToast('Successfully logged in with OAuth!', 'success');
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          } catch (parseError) {
            // Fall back to token-based login
          }
        }

        // Fallback: Login with the received token
        console.log('🔍 OAuth Callback - Using token-based login');
        await loginWithToken(token);
        
        setToken(token);
        localStorage.setItem('token', token);
        console.log('OAuth token saved to localStorage (fallback):', localStorage.getItem('token'));
        // Optionally, fetch user from backend here if needed
        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');
        showToast('Successfully logged in with OAuth!', 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        showToast('OAuth authentication failed', 'error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, loginWithToken, navigate, showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800">
            {status === 'loading' && (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>

        {status === 'error' && (
          <div className="mt-8">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage; 