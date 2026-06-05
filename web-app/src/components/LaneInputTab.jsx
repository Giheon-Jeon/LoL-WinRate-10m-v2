import React from 'react';

const LaneInputTab = ({ lane, laneTitle, values, onChange, onBatchChange, stats }) => {
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

  const applyPreset = (strength) => {
    const changes = {};
    const fieldsList = ['gold', 'cs', 'kills', 'deaths'];

    fieldsList.forEach((field) => {
      const bKey = `blue_${lane}_${field}`;
      const rKey = `red_${lane}_${field}`;
      
      const bMean = stats[bKey]?.mean || 0;
      const bStd = stats[bKey]?.std || 1;
      const rMean = stats[rKey]?.mean || 0;
      const rStd = stats[rKey]?.std || 1;

      let bVal = bMean;
      let rVal = rMean;

      const isNegativeField = field === 'deaths';

      if (strength === 'blue_stomp') {
        bVal = isNegativeField ? bMean - bStd * 0.8 : bMean + bStd * 1.3;
        rVal = isNegativeField ? rMean + rStd * 1.3 : rMean - rStd * 0.9;
      } else if (strength === 'blue_lead') {
        bVal = isNegativeField ? bMean - bStd * 0.4 : bMean + bStd * 0.6;
        rVal = isNegativeField ? rMean + rStd * 0.6 : rMean - rStd * 0.4;
      } else if (strength === 'red_lead') {
        bVal = isNegativeField ? bMean + bStd * 0.6 : bMean - bStd * 0.4;
        rVal = isNegativeField ? rMean - rStd * 0.4 : rMean + rStd * 0.6;
      } else if (strength === 'red_stomp') {
        bVal = isNegativeField ? bMean + bStd * 1.3 : bMean - bStd * 0.9;
        rVal = isNegativeField ? rMean - rStd * 0.8 : rMean + rStd * 1.3;
      } else {
        // Even
        bVal = bMean;
        rVal = rMean;
      }

      // Round to 50 for gold, 1 for other fields
      const bRounded = field === 'gold' ? Math.round(bVal / 50) * 50 : Math.round(bVal);
      const rRounded = field === 'gold' ? Math.round(rVal / 50) * 50 : Math.round(rVal);

      changes[bKey] = bRounded;
      changes[rKey] = rRounded;
    });

    onBatchChange(changes);
  };

  const presetButtons = [
    { id: 'blue_stomp', label: '블루 압도 🔵🔥', style: 'border-lol-blue/30 text-lol-blueLight bg-lol-blue/10 hover:bg-lol-blue/20' },
    { id: 'blue_lead', label: '블루 우세 🔵', style: 'border-lol-blue/20 text-lol-blueLight/80 hover:text-lol-blueLight bg-lol-blue/5' },
    { id: 'even', label: '대등 ⚖️', style: 'border-lol-border text-lol-goldLight/70 hover:text-lol-gold' },
    { id: 'red_lead', label: '레드 우세 🔴', style: 'border-lol-redLight/10 text-lol-redLight/80 hover:text-lol-redLight bg-lol-redDark/5' },
    { id: 'red_stomp', label: '레드 압도 🔴🔥', style: 'border-lol-redLight/20 text-lol-redLight bg-lol-redDark/10 hover:bg-lol-redDark/20' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Lane Advantage Quick Buttons */}
      <div className="flex flex-col gap-2 p-3.5 bg-lol-greyDark/50 border border-lol-border/20 rounded-lg shadow-hextech">
        <span className="text-[11px] font-extrabold text-lol-gold uppercase tracking-wider">라인전 구도 퀵 설정</span>
        <div className="flex flex-wrap gap-2">
          {presetButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => applyPreset(btn.id)}
              className={`px-3 py-1.5 text-xs font-bold border rounded transition-all cursor-pointer ${btn.style}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

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
