import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sprout, FlaskConical, Bug } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/crop" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Sprout size={20} />
          <span>Crop Recommendation</span>
        </NavLink>
        <NavLink to="/fertilizer" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <FlaskConical size={20} />
          <span>Fertilizer Suggestion</span>
        </NavLink>
        <NavLink to="/disease" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Bug size={20} />
          <span>Disease Detection</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
