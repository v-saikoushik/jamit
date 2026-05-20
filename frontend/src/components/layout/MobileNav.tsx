import { NavLink } from 'react-router-dom';
import { Home, Upload, Disc3, Sparkles, Users } from 'lucide-react';

const items = [
  { to: '/', icon: Home },
  { to: '/upload', icon: Upload },
  { to: '/remix', icon: Disc3 },
  { to: '/discover', icon: Sparkles },
  { to: '/community', icon: Users },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-20 left-0 right-0 flex justify-around bg-jamit-dark/95 border-t border-white/5 py-2 z-40 backdrop-blur">
      {items.map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `p-2 rounded-lg ${isActive ? 'text-jamit-green' : 'text-jamit-muted'}`
          }
        >
          <Icon className="w-6 h-6" />
        </NavLink>
      ))}
    </nav>
  );
}
