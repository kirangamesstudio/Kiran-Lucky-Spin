import { useState, useEffect, useMemo } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Star, Medal, Zap, RefreshCw, Loader } from 'lucide-react';
import { fetchGlobalLeaderboard } from '../utils/firebaseDb';

interface LeaderboardProps {
  userCoins: number;
  username: string;
  avatar: string;
  level: number;
}

// Fallback competitive mock players if database yields no records or is loading
const MOCK_PLAYERS = [
  { rank: 1, username: 'SpinMaster_Aarav', avatar: '🦁', coins: 15400, level: 24, isUser: false },
  { rank: 2, username: 'Lucky_Kiran', avatar: '⚡', coins: 12100, level: 19, isUser: false },
  { rank: 3, username: 'CoinHoarder99', avatar: '🐉', coins: 9500, level: 15, isUser: false },
  { rank: 4, username: 'Prisha_Queen', avatar: '👑', coins: 8200, level: 13, isUser: false },
  { rank: 5, username: 'Vihaan_Rider', avatar: '🏎️', coins: 6900, level: 11, isUser: false },
  { rank: 6, username: 'Ananya_Dreamer', avatar: '🌸', coins: 5400, level: 9, isUser: false },
  { rank: 7, username: 'Siddharth_Pro', avatar: '🎮', coins: 4100, level: 7, isUser: false },
  { rank: 8, username: 'Aditi_Lucky', avatar: '🦄', coins: 3200, level: 6, isUser: false },
  { rank: 9, username: 'Rohan_Spins', avatar: '🐺', coins: 2100, level: 4, isUser: false },
];

export default function Leaderboard({
  userCoins,
  username,
  avatar,
  level,
}: LeaderboardProps) {
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalLeaderboard();
      setOnlinePlayers(data);
    } catch (e) {
      console.warn('[Leaderboard] Failed to fetch online leaderboard, using mock data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [userCoins]);

  // Dynamically inject the user and sort based on coins
  const sortedLeaderboard = useMemo(() => {
    let list: LeaderboardEntry[] = [];

    if (onlinePlayers && onlinePlayers.length > 0) {
      // Map online players to leaderboard entry format
      list = onlinePlayers.map((p, idx) => ({
        rank: idx + 1,
        username: p.username || 'Anonymous',
        avatar: p.avatar || '👤',
        coins: p.coins ?? 0,
        level: p.level ?? 1,
        isUser: p.username === username,
      }));
    } else {
      // Map mock players
      list = MOCK_PLAYERS.map((p) => ({ ...p }));
    }
    
    // Check if the current user exists in the list already. If not, append them!
    const userExists = list.some((e) => e.isUser || e.username === username);
    if (!userExists) {
      list.push({
        rank: list.length + 1,
        username: username || 'Guest Player',
        avatar: avatar || '👑',
        coins: userCoins,
        isUser: true,
        level: level,
      });
    }

    // Sort descending by coins
    list.sort((a, b) => b.coins - a.coins);

    // Re-assign ranks
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [onlinePlayers, userCoins, username, avatar, level]);

  const userRankEntry = sortedLeaderboard.find((e) => e.isUser);

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/25 rounded-3xl p-5 shadow-xl select-none text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-amber-500/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Global Leaderboard</h3>
              <button
                id="leaderboard-refresh-btn"
                onClick={loadLeaderboard}
                disabled={loading}
                className="p-1 hover:bg-slate-800/50 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                {loading ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Real-time multiplayer standings</p>
          </div>
        </div>
        
        {userRankEntry && (
          <div className="text-right">
            <p className="text-[9px] text-slate-400 uppercase font-mono tracking-widest">Your Rank</p>
            <p className="text-sm font-extrabold text-amber-400">#{userRankEntry.rank}</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/20">
        {sortedLeaderboard.map((player, idx) => {
          return (
            <div
              key={`${player.username}-${idx}`}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                player.isUser
                  ? 'bg-gradient-to-r from-amber-500/15 to-amber-600/5 border-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.15)]'
                  : 'bg-[#030712]/65 border-slate-800'
              }`}
            >
              {/* Rank and Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-6 flex items-center justify-center font-bold font-mono">
                  {player.rank === 1 ? (
                    <Medal className="w-5 h-5 text-yellow-400" />
                  ) : player.rank === 2 ? (
                    <Medal className="w-5 h-5 text-slate-300" />
                  ) : player.rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-600" />
                  ) : (
                    <span className="text-xs text-slate-400">#{player.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-lg select-none">
                  {player.avatar}
                </div>

                {/* Username and Level */}
                <div className="flex flex-col">
                  <span className={`text-xs font-bold leading-none ${player.isUser ? 'text-amber-300' : 'text-slate-200'}`}>
                    {player.username}
                    {player.isUser && <span className="ml-1.5 text-[8px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-500" /> Lvl {player.level}
                  </span>
                </div>
              </div>

              {/* Coins tally */}
              <div className="flex items-center gap-1.5 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-white font-mono">
                    {player.coins.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Coins</span>
                </div>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating note */}
      <p className="text-[9px] text-slate-500 text-center mt-3 font-mono">
        Updates automatically upon virtual coin changes. Keep spinning!
      </p>
    </div>
  );
}
