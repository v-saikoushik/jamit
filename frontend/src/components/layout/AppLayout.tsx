import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import AudioPlayer from '../player/AudioPlayer';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-jamit-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28 px-4 md:px-8 pt-6">
        <Outlet />
      </main>
      <MobileNav />
      <AudioPlayer />
    </div>
  );
}
