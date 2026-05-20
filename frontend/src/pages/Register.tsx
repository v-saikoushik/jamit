import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, displayName);
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-jamit-black px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Music2 className="w-10 h-10 text-jamit-green" />
          <h1 className="text-3xl font-bold">Jamit</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-jamit-card rounded-2xl p-8 border border-white/5 space-y-4">
          <h2 className="text-xl font-semibold">Create account</h2>
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-jamit-hover border border-white/10 focus:border-jamit-green outline-none"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-jamit-hover border border-white/10 focus:border-jamit-green outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-jamit-hover border border-white/10 focus:border-jamit-green outline-none"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-jamit-green text-black font-semibold hover:bg-jamit-green-hover disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign up'}
          </button>
          <p className="text-center text-sm text-jamit-muted">
            Have an account? <Link to="/login" className="text-jamit-green hover:underline">Log in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
