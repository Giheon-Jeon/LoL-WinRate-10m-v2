import React from 'react';

const LaneInputTab = ({ lane, laneTitle, values, onChange, stats }) => {
  const getFieldInfo = (team, field) => {
    const key = `${team}_${lane}_${field}`;
    const defaultStats = { min: 0, max: 15, mean: 2 };
    if (field === 'gold') {
      defaultStats.min = 2000;
      defaultStats.max = 12000;
      defaultStats.mean = 6000;
    } else if (field === 'cs') {
      defaultStats.min = 0;
      defaultStats.max = 180;
      defaultStats.mean = 110;
    }
    return {
      key,
      val: values[key] !== undefined ? values[key] : Math.round(defaultStats.mean),
      min: stats[key]?.min !== undefined ? Math.floor(stats[key].min) : defaultStats.min,
      max: stats[key]?.max !== undefined ? Math.ceil(stats[key].max) : defaultStats.max,
    };
  };

  const fields = [
    { name: 'gold', label: '골드 (Gold)', step: 50, unit: 'G' },
    { name: 'cs', label: 'CS (미니언 수)', step: 1, unit: '개' },
    { name: 'kills', label: '킬 (Kills)', step: 1, unit: '킬' },
    { name: 'deaths', label: '데스 (Deaths)', step: 1, unit: '데스' },
  ];

  // Calculate live differences
  const blueGold = values[`blue_${lane}_gold`] || 0;
  const redGold = values[`red_${lane}_gold`] || 0;
  const goldDiff = blueGold - redGold;

  const blueCS = values[`blue_${lane}_cs`] || 0;
  const redCS = values[`red_${lane}_cs`] || 0;
  const csDiff = blueCS - redCS;

  const blueKills = values[`blue_${lane}_kills`] || 0;
  const redKills = values[`red_${lane}_kills`] || 0;

  const blueDeaths = values[`blue_${lane}_deaths`] || 0;
  const redDeaths = values[`red_${lane}_deaths`] || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Dynamic Gold/CS Diff Alert Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-lol-greyDark border border-lol-border/20 rounded p-3 text-center">
          <span className="text-[10px] text-lol-goldLight/50 block font-semibold">라인 골드 격차</span>
          <span className={`text-sm font-extrabold ${goldDiff >= 0 ? 'text-lol-blueLight' : 'text-lol-redLight'}`}>
            {goldDiff >= 0 ? `블루 +${goldDiff} G` : `레드 +${Math.abs(goldDiff)} G`}
          </span>
        </div>
        <div className="bg-lol-greyDark border border-lol-border/20 rounded p-3 text-center">
          <span className="text-[10px] text-lol-goldLight/50 block font-semibold">CS 격차</span>
          <span className={`text-sm font-extrabold ${csDiff >= 0 ? 'text-lol-blueLight' : 'text-lol-redLight'}`}>
            {csDiff >= 0 ? `블루 +${csDiff} 개` : `레드 +${Math.abs(csDiff)} 개`}
          </span>
        </div>
        <div className="bg-lol-greyDark border border-lol-border/20 rounded p-3 text-center">
          <span className="text-[10px] text-lol-goldLight/50 block font-semibold">블루 KDA</span>
          <span className="text-sm font-extrabold text-lol-blueLight">
            {((blueKills + 1) / (blueDeaths + 1)).toFixed(2)}
          </span>
        </div>
        <div className="bg-lol-greyDark border border-lol-border/20 rounded p-3 text-center">
          <span className="text-[10px] text-lol-goldLight/50 block font-semibold">레드 KDA</span>
          <span className="text-sm font-extrabold text-lol-redLight">
            {((redKills + 1) / (redDeaths + 1)).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Blue Team Inputs */}
        <div className="flex-1 bg-gradient-to-b from-lol-blue/10 to-lol-obsidian border border-lol-blue/30 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-lol-blueLight animate-pulse" />
            <h4 className="text-sm font-bold text-lol-blueLight uppercase tracking-wider">
              블루팀 {laneTitle} 라이너
            </h4>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map((f) => {
              const info = getFieldInfo('blue', f.name);
              return (
                <div key={info.key} className="flex flex-col">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1 text-lol-goldLight/80">
                    <label htmlFor={info.key}>{f.label}</label>
                    <span className="text-lol-blueLight font-bold">
                      {info.val.toLocaleString()}{f.unit}
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <input
                      id={info.key}
                      type="range"
                      min={info.min}
                      max={info.max}
                      step={f.step}
                      value={info.val}
                      onChange={(e) => onChange(info.key, Number(e.target.value))}
                      className="flex-1 accent-lol-blueLight h-1.5 bg-lol-greyLight rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={info.min}
                      max={info.max}
                      value={info.val}
                      onChange={(e) => onChange(info.key, Number(e.target.value))}
                      className="w-20 bg-lol-obsidian border border-lol-border/50 text-lol-blueLight text-xs font-bold text-center py-1 rounded focus:outline-none focus:border-lol-blueLight"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Team Inputs */}
        <div className="flex-1 bg-gradient-to-b from-lol-redDark/10 to-lol-obsidian border border-lol-redLight/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-lol-redLight animate-pulse" />
            <h4 className="text-sm font-bold text-lol-redLight uppercase tracking-wider">
              레드팀 {laneTitle} 라이너
            </h4>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map((f) => {
              const info = getFieldInfo('red', f.name);
              return (
                <div key={info.key} className="flex flex-col">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1 text-lol-goldLight/80">
                    <label htmlFor={info.key}>{f.label}</label>
                    <span className="text-lol-redLight font-bold">
                      {info.val.toLocaleString()}{f.unit}
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <input
                      id={info.key}
                      type="range"
                      min={info.min}
                      max={info.max}
                      step={f.step}
                      value={info.val}
                      onChange={(e) => onChange(info.key, Number(e.target.value))}
                      className="flex-1 accent-lol-redLight h-1.5 bg-lol-greyLight rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={info.min}
                      max={info.max}
                      value={info.val}
                      onChange={(e) => onChange(info.key, Number(e.target.value))}
                      className="w-20 bg-lol-obsidian border border-lol-border/50 text-lol-redLight text-xs font-bold text-center py-1 rounded focus:outline-none focus:border-lol-redLight"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaneInputTab;
