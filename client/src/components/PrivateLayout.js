import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from './TopNav';

// Layout is now a vertical stack (header above content) rather than the
// previous side-by-side flex row with a fixed 64-unit sidebar. Content gets the
// full window width, which gives the dashboard grids and charts more room.

const FullScreenLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-sage-600 border-t-transparent"
      role="status"
      aria-label="Loading your account"
    />
  </div>
);

const PrivateLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PrivateLayout;
