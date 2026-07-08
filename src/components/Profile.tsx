import { useState } from 'react';
import { UserProfile, Transaction } from '../types';
import { Sparkles, Trophy, Edit3, Save, Coins, Flame, User, Check, Trash2, ShieldCheck, Star, ShieldAlert, LogOut, Key } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ProfileProps {
  profile: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (newProfile: Partial<UserProfile>) => void;
  onReset: () => void;
  isAnonymous?: boolean;
  onSignOut?: () => void;
  onShowAuth?: () => void;
}

const AVAILABLE_AVATARS = [
  '🦁', '⚡', '🐉', '👑', '🏎️', '🌸', '🎮', '🦄', '🐺', '🦊', '🐼', '🐯', '🌟', '🎸'
];

export default function Profile({
  profile,
  transactions,
  onUpdateProfile,
  onReset,
  isAnonymous = true,
  onSignOut,
  onShowAuth,
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSave = () => {
    if (!tempUsername.trim()) return;
    onUpdateProfile({
      username: tempUsername.trim(),
      avatar: selectedAvatar,
    });
    setIsEditing(false);
    playClickSound(profile.soundEnabled);
  };

  const nextLevelXp = profile.level * 100;
  const xpPercentage = Math.min((profile.xp / nextLevelXp) * 100, 100);

  return (
    <div className="w-full flex flex-col gap-5 text-white select-none">
      
      {/* 1. Main Profile Badge Card */}
      <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Floating background graphic */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          
          {/* Avatar frame */}
          <div className="relative mb-3 group">
            <div className="w-20 h-20 rounded-full bg-[#030712] border-2 border-amber-500 flex items-center justify-center text-4xl shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
              {profile.avatar}
            </div>
            
            {!isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  playClickSound(profile.soundEnabled);
                }}
                className="absolute bottom-0 right-0 p-1.5 bg-amber-500 rounded-full border border-slate-950 text-slate-950 hover:scale-105 active:scale-95 transition-all"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Edit form vs display */}
          {isEditing ? (
            <div className="w-full flex flex-col items-center gap-3 mt-1">
              <div className="w-full max-w-xs relative">
                <input
                  type="text"
                  maxLength={18}
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-amber-500/35 rounded-xl text-center text-sm text-white focus:outline-none focus:border-amber-400 font-bold"
                  placeholder="Enter username"
                />
              </div>

              {/* Avatar Selector Grid */}
              <div className="w-full max-w-xs flex flex-col gap-1.5 text-left">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Select Avatar Emoji:</span>
                <div className="flex flex-wrap gap-1.5 justify-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  {AVAILABLE_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setSelectedAvatar(emoji);
                        playClickSound(profile.soundEnabled);
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-lg hover:bg-slate-800 active:scale-90 transition-all ${
                        selectedAvatar === emoji ? 'bg-amber-500/20 border border-amber-500 scale-110' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full max-w-xs mt-1">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTempUsername(profile.username);
                    setSelectedAvatar(profile.avatar);
                    playClickSound(profile.soundEnabled);
                  }}
                  className="flex-1 py-2 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
                {profile.username}
                {isAnonymous ? (
                  <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">Guest</span>
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">
                {isAnonymous ? 'Offline Guest Session' : 'Secured Cloud Account'}
              </p>

              {/* Account Security CTA Call to Actions */}
              {isAnonymous ? (
                <div className="mt-3.5 max-w-xs bg-red-500/5 border border-red-500/15 p-3 rounded-2xl flex flex-col gap-2 text-left">
                  <div className="flex gap-2 text-red-400 items-start">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[10px] leading-tight font-medium">Protect your progress! Guest profiles can be wiped on browser cache resets. Connect a permanent account to save your balance cloud-side.</span>
                  </div>
                  <button
                    id="profile-connect-btn"
                    onClick={onShowAuth}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-[9px] rounded-lg tracking-wider flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <Key className="w-3 h-3" />
                    SECURE ACCOUNT NOW
                  </button>
                </div>
              ) : (
                <div className="mt-3.5 max-w-xs bg-emerald-500/5 border border-emerald-500/15 p-2.5 rounded-2xl flex items-center justify-between gap-5 text-left">
                  <span className="text-[10px] text-slate-400 font-mono leading-tight">Your coins and standing are protected cloud-side.</span>
                  <button
                    id="profile-logout-btn"
                    onClick={() => {
                      playClickSound(profile.soundEnabled);
                      if (onSignOut) onSignOut();
                    }}
                    className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:border-red-500/30 text-red-400 text-[9px] font-bold rounded-lg flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                  >
                    <LogOut className="w-3 h-3" />
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Level Progress Indicator */}
          <div className="w-full mt-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> Level {profile.level}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {profile.xp} / {nextLevelXp} XP
              </span>
            </div>
            
            {/* XP bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Dashboard Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#001c55]/90 border border-amber-500/25 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Virtual Balance</p>
            <p className="text-base font-black text-white font-mono">{profile.coins.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#001c55]/90 border border-amber-500/25 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Flame className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">Spins Left</p>
            <p className="text-base font-black text-white font-mono">{profile.spinsRemaining}</p>
          </div>
        </div>
      </div>

      {/* 3. Virtual Transaction Ledger */}
      <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl">
        <h4 className="text-sm font-extrabold text-white mb-3.5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Virtual Wallet History
        </h4>

        {transactions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 bg-[#030712]/50 border border-slate-800/80 rounded-xl"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">{tx.label}</p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <span className={`text-xs font-black font-mono ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Danger Zone */}
      <div className="w-full bg-red-500/5 border border-red-500/25 rounded-2xl p-4 flex flex-col gap-2.5">
        <div>
          <h4 className="text-xs font-extrabold text-red-400 uppercase tracking-wider">Danger Zone</h4>
          <p className="text-[10px] text-slate-400">Reset local virtual progress data forever.</p>
        </div>

        {showConfirmReset ? (
          <div className="flex flex-col gap-2 bg-slate-950 p-2.5 rounded-xl border border-red-500/30">
            <p className="text-[10px] text-red-400 font-bold">Are you absolutely sure? All local coins, level progress, and custom state will be wiped!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-400 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-1.5 bg-red-600 text-white text-xs font-extrabold rounded-lg"
              >
                Yes, Wipe Progress
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setShowConfirmReset(true);
              playClickSound(profile.soundEnabled);
            }}
            className="py-2.5 bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset All Game Data
          </button>
        )}
      </div>
    </div>
  );
}
