import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ isAuthenticated, setIsAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container">
      <Navbar setIsAuthenticated={setIsAuthenticated} />
      <Sidebar />
      <main className="main-content" style={{ marginTop: '70px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
