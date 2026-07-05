import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Leaf } from 'lucide-react';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // MFA states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      if (res.data.mfaRequired) {
        setMfaRequired(true);
        setTempToken(res.data.tempToken);
      } else {
        setIsAuthenticated(true);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Google login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.google && isLogin && !mfaRequired) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id',
          callback: handleGoogleLoginSuccess
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      } catch (e) {
        console.error('Google button render error:', e);
      }
    }
  }, [isLogin, mfaRequired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.mfaRequired) {
          setMfaRequired(true);
          setTempToken(response.data.tempToken);
        } else {
          setIsAuthenticated(true);
          navigate('/dashboard');
        }
      } else {
        await api.post('/auth/register', { email, password });
        setIsLogin(true);
        setError('Registration successful! Check your email for the verification link.');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/login-mfa', { code: mfaCode, tempToken });
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Verification failed. Invalid code.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <div className="auth-header">
          <Leaf className="logo-icon" size={48} color="var(--color-green)" />
          <h1>AgroBuddy</h1>
          <p>Smart Farming Assistant</p>
        </div>
        
        {mfaRequired ? (
          <form onSubmit={handleMfaSubmit}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Enter MFA Code</h3>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-dark-gray)', marginBottom: '1.5rem' }}>
              Please enter the 6-digit code from your authenticator app.
            </p>
            <InputField
              label="Authenticator Code"
              type="text"
              placeholder="123456"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
            />
            {error && <p className="auth-message error">{error}</p>}
            
            <Button 
              text={loading ? 'Verifying...' : 'Verify & Login'} 
              type="submit" 
              className="w-full mt-4" 
              disabled={loading}
            />
            <p className="auth-switch">
              <span onClick={() => { setMfaRequired(false); setError(''); }}>
                Back to Login
              </span>
            </p>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <InputField
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              {error && <p className={`auth-message ${error.includes('successful') ? 'success' : 'error'}`}>{error}</p>}
              
              <Button 
                text={loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')} 
                type="submit" 
                className="w-full mt-4" 
                disabled={loading}
              />
            </form>

            {isLogin && (
              <>
                <div className="or-divider">
                  <span>OR</span>
                </div>
                <div id="googleBtn" className="google-login-btn"></div>
              </>
            )}

            <p className="auth-switch">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Sign up' : 'Login'}
              </span>
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Login;
