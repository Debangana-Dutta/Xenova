import React, { useState } from 'react';
import { Menu, X, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SidebarContent } from './Sidebar';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost p-2"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sage-600 text-white">
              <Sparkles size={13} />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Xenova</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {user?.initials || '--'}
            </div>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {menuOpen && (
            <div className="animate-fade-in absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="btn-ghost w-full justify-start px-2 py-1.5 text-sm hover:text-red-500"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile slide-out drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="animate-slide-in-left absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white dark:bg-zinc-950">
            <button
              onClick={() => setDrawerOpen(false)}
              className="btn-ghost absolute right-2 top-4 p-2"
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
