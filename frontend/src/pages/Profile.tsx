import { useEffect, useState } from 'react';
import { userApi, remixApi, playlistApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import RemixCard from '../components/ui/RemixCard';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [remixes, setRemixes] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    userApi.profile().then((r) => {
      setProfile(r.data);
      setBio(r.data.bio || '');
      setDisplayName(r.data.displayName || '');
    });
    remixApi.mine().then((r) => setRemixes(r.data));
    playlistApi.list().then((r) => setPlaylists(r.data));
  }, []);

  const save = async () => {
    await userApi.update({ bio, displayName });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="bg-jamit-card rounded-xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-jamit-green/20 flex items-center justify-center text-3xl text-jamit-green font-bold">
            {user?.displayName?.[0]?.toUpperCase()}
          </div>
          <div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-white/20 focus:border-jamit-green outline-none"
            />
            <p className="text-jamit-muted text-sm">{user?.email}</p>
          </div>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-jamit-hover border border-white/10 outline-none resize-none"
        />
        <button onClick={save} className="px-6 py-2 rounded-full bg-jamit-green text-black font-semibold text-sm">
          Save profile
        </button>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">Your Remixes ({remixes.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {remixes.map((r) => (
            <RemixCard key={r._id} remix={r} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Playlists ({playlists.length})</h2>
        <div className="space-y-2">
          {playlists.map((p) => (
            <div key={p._id} className="bg-jamit-card rounded-lg p-4 flex justify-between">
              <span>{p.name}</span>
              <span className="text-jamit-muted text-sm">{p.songs?.length || 0} songs</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
