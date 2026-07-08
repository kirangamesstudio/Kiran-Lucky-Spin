import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SECTORS } from '../data/sectors';
import { WheelSector } from '../types';
import { playTickSound, playCoinSound, triggerHapticFeedback, playFanfareSound } from '../utils/audio';
import { Coins, HelpCircle, Flame, Star, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import ConfettiCanvas from './ConfettiCanvas';

interface SpinWheelProps {
  coins: number;
  spinsRemaining: number;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onSpinComplete: (sector: WheelSector) => void;
  onAdRequest: () => void;
  onBuySpins: () => void;
  onCloseResultModal?: () => void;
}

export default function SpinWheel({
  coins,
  spinsRemaining,
  soundEnabled,
  hapticEnabled,
  onSpinComplete,
  onAdRequest,
  onBuySpins,
  onCloseResultModal,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lightsPhase, setLightsPhase] = useState(0);
  const [resultSector, setResultSector] = useState<WheelSector | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const spinAngleRef = useRef(0);
  const lastTickAngleRef = useRef(0);
  const activeSectorRef = useRef<number>(-1);

  // Blinking outer lights animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLightsPhase((prev) => (prev + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Selection based on weights
  const selectRandomSector = (): WheelSector => {
    const totalWeight = SECTORS.reduce((sum, s) => sum + s.weight, 0);
    let randomNum = Math.random() * totalWeight;
    for (const sector of SECTORS) {
      if (randomNum < sector.weight) {
        return sector;
      }
      randomNum -= sector.weight;
    }
    return SECTORS[0];
  };

  // Redraw canvas whenever the spin angle or lights phase changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16; // space for lights

    ctx.clearRect(0, 0, size, size);

    // Save context for rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(spinAngleRef.current);

    const numSectors = SECTORS.length;
    const arc = (2 * Math.PI) / numSectors;

    // 1. Draw sectors
    SECTORS.forEach((sector, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fill();

      // Golden sector dividers
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Select gold or white color
      ctx.fillStyle = sector.textColor;
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      
      // Draw label slightly offset from outer edge
      const labelText = sector.label;
      ctx.fillText(labelText, radius - 24, 0);
      ctx.restore();
    });

    // Outer gold boundary rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // 2. Draw outer bezel with lights (does NOT rotate with wheel)
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius + 15, 0, 2 * Math.PI);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bulbs (lights) around the rim
    const numBulbs = 24;
    for (let i = 0; i < numBulbs; i++) {
      const angle = (i * 2 * Math.PI) / numBulbs;
      const bulbX = center + (radius + 8) * Math.cos(angle);
      const bulbY = center + (radius + 8) * Math.sin(angle);

      // Blinking pattern
      const isLit = (i + lightsPhase) % 3 === 0;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isLit ? '#FFD700' : '#451A03';
      
      if (isLit) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }

    // 3. Center Pin (Golden Core)
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = 'radial-gradient(circle, #FFE066 0%, #D4AF37 70%, #996515 100%)';
    
    // Create actual canvas gradient for rich premium look
    const grad = ctx.createRadialGradient(center, center, 2, center, center, 24);
    grad.addColorStop(0, '#FFE066');
    grad.addColorStop(0.6, '#D4AF37');
    grad.addColorStop(1, '#664614');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core central gold icon/text "K" for Kiran Games Studio
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', center, center);

  }, [lightsPhase]);

  // Handle the physical tick sounds as the wheel spins
  const checkTick = (currentAngle: number) => {
    const numSectors = SECTORS.length;
    const arc = (2 * Math.PI) / numSectors;

    // The arrow is at the top (angle = -Math.PI / 2, or 1.5 * Math.PI)
    const pointerAngle = 1.5 * Math.PI;
    const normalizedAngle = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    let relativeAngle = pointerAngle - normalizedAngle;
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const sectorIndex = Math.floor(relativeAngle / arc) % numSectors;

    if (sectorIndex !== activeSectorRef.current) {
      activeSectorRef.current = sectorIndex;
      playTickSound(soundEnabled);
      triggerHapticFeedback(hapticEnabled);
    }
  };

  const spin = () => {
    if (isSpinning || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setResultSector(null);

    // 1. Pick a random sector based on weights
    const sector = selectRandomSector();
    const sectorIdx = SECTORS.findIndex((s) => s.id === sector.id);

    // 2. Calculate sector angle parameters
    const arc = (2 * Math.PI) / SECTORS.length;
    const targetSectorCenter = (sectorIdx + 0.5) * arc;
    
    // Pointer is at 1.5 * Math.PI
    const pointerAngle = 1.5 * Math.PI;
    
    // Calculate ending angle
    let finalWheelAngle = pointerAngle - targetSectorCenter;
    // Ensure finalWheelAngle is positive and clean
    finalWheelAngle = ((finalWheelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // 3. Add random rotation offsets (5 to 8 full loops) for suspense
    const extraLoops = 6 + Math.floor(Math.random() * 3);
    const targetAngle = spinAngleRef.current + (extraLoops * 2 * Math.PI) + finalWheelAngle;

    // 4. Physical easing spin loop
    const startAngle = spinAngleRef.current;
    const angleDiff = targetAngle - startAngle;
    const duration = 4800; // 4.8 seconds
    const startTime = performance.now();

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Quintic ease-out physical simulation
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);
      const easedProgress = easeOut(progress);

      const currentAngle = startAngle + angleDiff * easedProgress;
      spinAngleRef.current = currentAngle;

      checkTick(currentAngle);

      // Redraw
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          const size = canvas.width;
          const center = size / 2;
          const radius = center - 16;
          ctx.clearRect(0, 0, size, size);

          // Rotate
          ctx.translate(center, center);
          ctx.rotate(currentAngle);

          // Draw Sectors
          SECTORS.forEach((sec, i) => {
            const angle = i * arc;
            ctx.beginPath();
            ctx.fillStyle = sec.color;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + arc);
            ctx.closePath();
            ctx.fill();

            // Divider
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
            ctx.stroke();

            // Text Label
            ctx.save();
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = sec.textColor;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillText(sec.label, radius - 24, 0);
            ctx.restore();
          });

          // Outer Gold Rim
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.restore();

          // Outer bezel with lights
          ctx.beginPath();
          ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 14;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(center, center, radius + 15, 0, 2 * Math.PI);
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Blinking Bulbs
          const numBulbs = 24;
          for (let i = 0; i < numBulbs; i++) {
            const angle = (i * 2 * Math.PI) / numBulbs;
            const bulbX = center + (radius + 8) * Math.cos(angle);
            const bulbY = center + (radius + 8) * Math.sin(angle);
            const isLit = (i + lightsPhase) % 3 === 0;

            ctx.beginPath();
            ctx.arc(bulbX, bulbY, 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = isLit ? '#FFD700' : '#451A03';
            ctx.fill();
          }

          // Central core
          const grad = ctx.createRadialGradient(center, center, 2, center, center, 24);
          grad.addColorStop(0, '#FFE066');
          grad.addColorStop(0.6, '#D4AF37');
          grad.addColorStop(1, '#664614');
          ctx.beginPath();
          ctx.arc(center, center, 24, 0, 2 * Math.PI);
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(center, center, 24, 0, 2 * Math.PI);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('K', center, center);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // SPIN COMPLETED!
        setIsSpinning(false);
        setResultSector(sector);
        setShowResultModal(true);
        playCoinSound(soundEnabled);
        playFanfareSound(soundEnabled);
        triggerHapticFeedback(hapticEnabled);
        onSpinComplete(sector);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm px-4 select-none">
      
      {/* Dynamic Wheel Anchor Block */}
      <div className="relative w-full aspect-square flex items-center justify-center py-6">
        
        {/* Glow behind the wheel */}
        <div className="absolute inset-4 rounded-full bg-amber-500/15 blur-[40px] animate-pulse pointer-events-none" />

        {/* 12 o'clock Gold Pointer/Indicator */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
          {/* Custom SVG premium pointer */}
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 42L34 12C34 5.37258 26.3888 0 17 0C7.61116 0 0 5.37258 0 12L17 42Z" fill="url(#pointer-gradient)" />
            <circle cx="17" cy="12" r="5" fill="#FFFFFF" />
            <defs>
              <linearGradient id="pointer-gradient" x1="17" y1="0" x2="17" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF2A3" />
                <stop offset="0.4" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* HTML5 Canvas element */}
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] cursor-pointer"
          onClick={spin}
        />
      </div>

      {/* Action panel underneath */}
      <div className="w-full flex flex-col items-center gap-4 mt-2">
        {/* Spins Counter Card */}
        <div className="flex items-center justify-between w-full bg-[#001c55]/85 border border-amber-500/25 px-4 py-2.5 rounded-2xl shadow-inner">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Virtual Spins</p>
              <p className="text-sm font-extrabold text-white">{spinsRemaining} Remaining</p>
            </div>
          </div>
          
          <button
            id="get-spins-btn"
            onClick={onBuySpins}
            disabled={isSpinning}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#070e27] text-xs font-bold rounded-xl border border-yellow-300/40 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            Get More
          </button>
        </div>

        {/* Big Premium Spin Button */}
        <button
          id="spin-action-btn"
          onClick={spin}
          disabled={isSpinning || spinsRemaining <= 0}
          className="w-full py-4 rounded-2xl font-extrabold text-lg uppercase tracking-wider relative overflow-hidden shadow-[0_6px_20px_rgba(245,158,11,0.3)] disabled:shadow-none disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-500 select-none group transition-all"
          style={{
            background: spinsRemaining > 0 && !isSpinning
              ? 'linear-gradient(to bottom, #FFE066 0%, #D4AF37 50%, #B45309 100%)'
              : undefined,
            border: spinsRemaining > 0 && !isSpinning ? '1px solid #FFE066' : undefined,
            color: spinsRemaining > 0 && !isSpinning ? '#0A1128' : undefined,
          }}
        >
          {spinsRemaining > 0 && !isSpinning && (
            <span className="absolute inset-0 bg-white/25 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          )}
          
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 animate-pulse" />
            <span>{isSpinning ? 'Spinning...' : 'SPIN WHEEL!'}</span>
          </div>
        </button>

        {/* Free Spins Alert if empty */}
        {spinsRemaining === 0 && !isSpinning && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl w-full text-center"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium text-left">
              Out of virtual spins! Tap <strong>"Get More"</strong> or watch a simulated rewarded ad to claim free spins!
            </p>
          </motion.div>
        )}
      </div>

      {/* Result Backdrop and Modal */}
      <AnimatePresence>
        {showResultModal && resultSector && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <ConfettiCanvas />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#001c55] to-[#040814] border border-amber-500/40 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden z-20"
            >
              {/* Golden confetti beams */}
              <div className="absolute top-0 inset-x-0 h-40 bg-radial from-amber-500/20 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-12 w-28 h-28 opacity-15"
                >
                  <Star className="w-full h-full text-amber-400 fill-amber-400" />
                </motion.div>

                {/* Animated Gold Trophy/Icon Box */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 p-[2px] flex items-center justify-center mb-4 shadow-[0_4px_15px_rgba(245,158,11,0.5)]"
                >
                  <div className="w-full h-full rounded-full bg-[#0a1128] flex items-center justify-center">
                    <Coins className="w-10 h-10 text-amber-400" />
                  </div>
                </motion.div>

                <p className="text-amber-400 font-bold uppercase tracking-widest text-xs font-mono mb-1">
                  Congratulations!
                </p>
                <h3 className="text-2xl font-black text-white mb-2 tracking-wide">
                  YOU WON!
                </h3>

                {/* Display reward details */}
                <div className="my-4 px-6 py-4 bg-[#030712] rounded-2xl border border-amber-500/20 flex flex-col items-center">
                  <span className="text-sm text-slate-400 font-mono">REWARD</span>
                  <span className="text-3xl font-extrabold text-gradient bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600">
                    {resultSector.label}
                  </span>
                  {resultSector.type === 'multiplier' && (
                    <span className="text-[10px] text-amber-400/80 mt-1 uppercase font-bold tracking-wider">
                      Level multiplier boost active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 px-4 mb-6 leading-relaxed">
                  Virtual items have been successfully added to your local profile wallet! Keep spinning to rise on the global leaderboard!
                </p>

                {/* Confirm Button */}
                <button
                  id="claim-reward-btn"
                  onClick={() => {
                    setShowResultModal(false);
                    if (onCloseResultModal) {
                      onCloseResultModal();
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#070e27] font-bold rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                >
                  AWESOME!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
