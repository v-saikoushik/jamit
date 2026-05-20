import { NavLink } from 'react-router-dom';
import {
  Home, Upload, Disc3, Sparkles, Users, User, LogOut, Music2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/remix', icon: Disc3, label: 'Remix Studio' },
  { to: '/discover', icon: Sparkles, label: 'Discover' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-jamit-dark border-r border-white/5 p-4 shrink-0">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Music2 className="w-8 h-8 text-jamit-green" />
        <span className="text-xl font-bold tracking-tight">Jamit</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-jamit-hover text-white'
                  : 'text-jamit-muted hover:text-white hover:bg-jamit-hover/50'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-jamit-green/20 flex items-center justify-center text-jamit-green font-semibold">
            {user?.displayName?.[0]?.toUpperCase() || 'J'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-jamit-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-jamit-muted hover:text-white hover:bg-jamit-hover rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
