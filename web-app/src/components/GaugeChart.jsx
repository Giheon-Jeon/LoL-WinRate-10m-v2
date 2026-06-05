import React from 'react';

const GaugeChart = ({ blueRate, redRate, modelName }) => {
  const roundedBlue = Math.round(blueRate * 10) / 10;
  const roundedRed = Math.round(redRate * 10) / 10;

  return (
    <div className="flex flex-col bg-lol-greyDark border border-lol-border/40 p-5 rounded-lg shadow-hextech hover:shadow-hextechGlow transition-all duration-300">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lol-goldLight font-bold text-lg tracking-wide uppercase">{modelName}</h4>
        <span className="text-xs text-lol-gold/70 px-2 py-0.5 border border-lol-gold/30 rounded bg-lol-obsidian">
          15 Min Snap
        </span>
      </div>

      {/* Win rate visual gauge bar */}
      <div className="relative h-6 w-full bg-lol-greyLight rounded-full overflow-hidden border border-lol-border/50 flex">
        {/* Blue Team bar */}
        <div
          className="h-full bg-gradient-to-r from-lol-blue to-lol-blueLight transition-all duration-700 ease-out relative shadow-blueGlow"
          style={{ width: `${blueRate}%` }}
        >
          {blueRate > 15 && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white tracking-wider">
              BLUE
            </span>
          )}
        </div>
        
        {/* Red Team bar */}
        <div
          className="h-full bg-gradient-to-r from-lol-redDark to-lol-redLight transition-all duration-700 ease-out relative shadow-redGlow flex-1"
        >
          {redRate > 15 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white tracking-wider">
              RED
            </span>
          )}
        </div>

        {/* Dynamic center indicator */}
        <div
          className="absolute h-full w-1 bg-lol-gold shadow-hextechGlow transition-all duration-700 ease-out"
          style={{ left: `${blueRate}%` }}
        />
      </div>

      {/* Numerical rates */}
      <div className="flex justify-between items-center mt-3">
        <div className="text-left">
          <span className="text-2xl font-extrabold text-lol-blueLight tracking-tight">{roundedBlue}%</span>
          <span className="text-xs text-lol-goldLight/50 block font-semibold">블루팀 승률</span>
        </div>
        <div className="text-center">
          <span className="text-sm text-lol-gold font-semibold tracking-wider">VS</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-lol-redLight tracking-tight">{roundedRed}%</span>
          <span className="text-xs text-lol-goldLight/50 block font-semibold">레드팀 승률</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;
