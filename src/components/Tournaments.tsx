import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Clock, 
  RefreshCw, 
  Zap, 
  Coins, 
  User, 
  Star 
} from 'lucide-react';
import { 
  fetchDailyTournamentStandings, 
  getDailyTournamentDateKey, 
  TournamentStanding 
} from '../utils/firebaseDb';
import { playClickSound } from '../utils/audio';

interface TournamentsProps {
  userId: string | null;
  username: string;
  avatar: string;
  soundEnabled: boolean;
}

export default function Tournaments({ userId, username, avatar, soundEnabled }: TournamentsProps) {
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const dateKey = getDailyTournamentDateKey();

  // Load standings
  const loadStandings = async () => {
    try {
      const data = await fetchDailyTournamentStandings(dateKey);
      setStandings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, [dateKey]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    playClickSound(soundEnabled);
    loadStandings();
  };

  // Countdown timer calculation (until end of UTC day)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setUTCHours(24, 0, 0, 0); // Next UTC midnight

      const diffMs = nextReset.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hrs = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');

      setTimeLeft(`${hrs}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine user's rank
  const userStanding = standings.find(s => s.userId === userId);
  const userRankIndex = standings.findIndex(s => s.userId === userId);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;

  return (
    <div className="w-full bg-[#001c55]/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl select-none text-white flex flex-col gap-4">
      
      {/* Tournament Card Header */}
      <div className="flex items-center justify-between border-b border-amber-500/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-[0_3px_10px_rgba(234,179,8,0.25)]">
            <Crown className="w-5 h-5 text-[#070e27]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Daily Spin Tournament</h3>
            <p className="text-[9px] text-amber-400 uppercase tracking-wider font-bold">UTC Date: {dateKey}</p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          id="tournament-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-[#030712]/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Countdown and Entry info banner */}
      <div className="bg-[#030712]/95 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between text-left">
        <div>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Tournament Resets In</p>
          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-base font-black text-amber-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{timeLeft || 'Calculating...'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Top Reward</p>
          <div className="flex items-center gap-1 mt-0.5 justify-end font-mono text-sm font-black text-white">
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>1,000 Coins</span>
          </div>
        </div>
      </div>

      {/* Standings List */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold tracking-widest px-1">
          <span>RANK & USER</span>
          <span>SPIN SCORE</span>
        </div>

        {loading ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Synchronizing stand records...</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 font-bold">No competitors today yet!</p>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Be the first to spin and secure #1 rank!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-500/20">
            {standings.map((participant, index) => {
              const rank = index + 1;
              const isMe = participant.userId === userId;
              
              return (
                <div
                  key={participant.userId}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/50 shadow-[0_2px_8px_rgba(245,158,11,0.15)]'
                      : 'bg-[#030712]/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    <div className="w-6 text-center font-black font-mono text-xs">
                      {rank === 1 ? (
                        <span className="text-yellow-400">#1</span>
                      ) : rank === 2 ? (
                        <span className="text-slate-300">#2</span>
                      ) : rank === 3 ? (
                        <span className="text-amber-600">#3</span>
                      ) : (
                        <span className="text-slate-500">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                      {participant.avatar}
                    </div>

                    {/* Username */}
                    <div className="flex flex-col">
                      <span className={`text-xs font-black truncate max-w-[140px] ${isMe ? 'text-amber-300' : 'text-slate-200'}`}>
                        {participant.username}
                        {isMe && <span className="ml-1 text-[7px] bg-amber-500 text-[#070e27] px-1 rounded-full uppercase tracking-wider">Me</span>}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs font-black text-white">{participant.score.toLocaleString()}</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules Footer */}
      <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-left text-[10px] text-slate-400 leading-relaxed font-mono">
        <p className="font-extrabold text-amber-500 mb-0.5">🏆 LEADER RULES:</p>
        <p>• Gain <span className="text-white">+1 Tournament Score</span> for every wheel spin completed.</p>
        <p>• Top 1 wins <span className="text-amber-400 font-bold">1,000 Coins + 10 Spins</span>.</p>
        <p>• Top 2-3 win <span className="text-slate-300 font-bold">500 Coins + 5 Spins</span>.</p>
      </div>
    </div>
  );
}
