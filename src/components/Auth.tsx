import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  auth 
} from '../utils/firebase';
import { Mail, Lock, LogIn, UserPlus, Play, AlertCircle, Sparkles, X } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface AuthProps {
  soundEnabled?: boolean;
  onAuthSuccess: () => void;
  onClose?: () => void;
}

export default function Auth({ soundEnabled = true, onAuthSuccess, onClose }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    playClickSound(soundEnabled);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error('[Auth Error]', err);
      let cleanMsg = err.message || 'Authentication failed. Please check credentials.';
      if (err.code === 'auth/weak-password') cleanMsg = 'Password should be at least 6 characters.';
      if (err.code === 'auth/email-already-in-use') cleanMsg = 'Email is already registered.';
      if (err.code === 'auth/invalid-credential') cleanMsg = 'Invalid email or password.';
      setError(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    playClickSound(soundEnabled);
    try {
      await signInAnonymously(auth);
      onAuthSuccess();
    } catch (err: any) {
      console.error('[Guest Auth Error]', err);
      setError('Failed to log in as Guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#001c55]/95 border border-amber-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none text-white animate-fade-in">
      {/* Close button if provided */}
      {onClose && (
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-full hover:scale-105 transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Decorative vector */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Accent */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-[0_4px_12px_rgba(245,158,11,0.3)] mb-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-[#070e27]" />
        </div>
        <h3 className="text-lg font-black tracking-wide text-white">
          {isSignUp ? 'Create Lucky Account' : 'Connect to Spin Server'}
        </h3>
        <p className="text-[10px] text-slate-400 font-medium">
          Save your spin stats, access multiplayers, and join tournaments
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-[11px] text-red-300 font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Auth Input Form */}
      <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
            <Mail className="w-4 h-4" />
          </span>
          <input
            id="auth-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
            <Lock className="w-4 h-4" />
          </span>
          <input
            id="auth-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            placeholder="Enter password (min 6 chars)"
            required
          />
        </div>

        {/* Action Button */}
        <button
          id="auth-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
        >
          {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {loading ? 'Please wait...' : isSignUp ? 'SIGN UP WITH EMAIL' : 'LOG IN TO ACCOUNT'}
        </button>
      </form>

      {/* Switch Form trigger */}
      <div className="mt-4 text-center">
        <button
          id="auth-toggle-mode-btn"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            playClickSound(soundEnabled);
          }}
          className="text-[11px] text-amber-400 font-bold hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
        </button>
      </div>

      {/* Or Separator Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="px-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Or Play Instantly</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* Guest Mode Trigger Button */}
      <button
        id="auth-guest-btn"
        onClick={handleGuestLogin}
        disabled={loading}
        className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold rounded-xl text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        {loading ? 'Entering...' : 'PLAY INSTANTLY AS GUEST'}
      </button>

      <p className="text-[9px] text-slate-500 text-center mt-4 leading-relaxed font-mono">
        Secured by Firebase Cloud Network. All balances and spin records are dynamically protected.
      </p>
    </div>
  );
}
