import { useEffect, useState } from 'react';
import { communityApi } from '../lib/api';
import RemixCard from '../components/ui/RemixCard';

export default function Community() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    communityApi.feed().then((r) => setFeed(r.data.remixes || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center h-64">
        <div className="w-8 h-8 border-2 border-jamit-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Community Feed</h1>
      <p className="text-jamit-muted">Discover public remixes from creators worldwide.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {feed.map((r) => (
          <RemixCard key={r._id} remix={r} onLike={load} />
        ))}
      </div>
      {!feed.length && <p className="text-jamit-muted">No remixes in the feed yet.</p>}
    </div>
  );
}
