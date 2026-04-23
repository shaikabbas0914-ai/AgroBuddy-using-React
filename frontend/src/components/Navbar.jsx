import React from 'react';
import { Leaf, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Leaf className="logo-icon" size={28} />
        <h2>AgroBuddy</h2>
      </div>
      <div className="navbar-actions">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
