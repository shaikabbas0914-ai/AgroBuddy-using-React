import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await api.post('/auth/login', { email, password });
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        await api.post('/auth/register', { email, password });
        setIsLogin(true);
        setError('Registration successful! Please login.');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Will show generic errors from backend
      } else {
        setError('An error occurred. Please try again.');
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

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </Card>
    </div>
  );
};

export default Login;
