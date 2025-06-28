import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
