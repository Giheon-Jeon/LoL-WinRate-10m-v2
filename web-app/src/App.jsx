import React, { useState, useEffect } from 'react';
import metadata from './data/model_metadata.json';
import GaugeChart from './components/GaugeChart';
import ConfusionMatrixView from './components/ConfusionMatrixView';
import LaneInputTab from './components/LaneInputTab';

// Helper to initialize values to averages
const getInitialAverages = () => {
  const values = {};
  metadata.columns.forEach((col) => {
    if (metadata.stats[col]) {
      const mean = metadata.stats[col].mean;
      if (col.includes('gold')) {
        values[col] = Math.round(mean / 50) * 50;
      } else {
        values[col] = Math.round(mean);
      }
    } else {
      values[col] = 0;
    }
  });
  return values;
};

// Preset generators
const getPresets = () => {
  const avg = getInitialAverages();
  
  // 1. Even Game (초접전)
  const even = { ...avg };
  metadata.columns.forEach((col) => {
    if (col.startsWith('blue_')) {
      const redCol = col.replace('blue_', 'red_');
      if (metadata.columns.includes(redCol)) {
        const midVal = Math.round(metadata.stats[col].mean);
        even[col] = midVal;
        even[redCol] = midVal;
      }
    }
  });
  even.blue_firstBlood = 0;
  even.blue_voidgrubs = 0;
  even.red_voidgrubs = 0;
  even.blue_dragons = 0;
  even.red_dragons = 0;
  even.blue_towers = 0;
  even.red_towers = 0;
  even.blue_kills = 0;
  even.red_kills = 0;

  // 2. Blue Stomp (블루팀 초압도)
  const blueStomp = { ...avg };
  metadata.columns.forEach((col) => {
    if (col.startsWith('blue_')) {
      const stats = metadata.stats[col];
      if (col.includes('gold')) {
        blueStomp[col] = Math.round((stats.mean + stats.std * 1.5) / 50) * 50;
      } else if (col.includes('cs')) {
        blueStomp[col] = Math.round(stats.mean + stats.std * 1.2);
      } else if (col.includes('kills')) {
        blueStomp[col] = Math.round(stats.mean + stats.std * 1.5);
      } else if (col.includes('deaths')) {
        blueStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      }
    } else if (col.startsWith('red_')) {
      const stats = metadata.stats[col];
      if (col.includes('gold')) {
        blueStomp[col] = Math.round((stats.mean - stats.std * 1.2) / 50) * 50;
      } else if (col.includes('cs')) {
        blueStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      } else if (col.includes('kills')) {
        blueStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      } else if (col.includes('deaths')) {
        blueStomp[col] = Math.round(stats.mean + stats.std * 1.5);
      }
    }
  });
  blueStomp.blue_firstBlood = 1;
  blueStomp.blue_voidgrubs = 3;
  blueStomp.red_voidgrubs = 0;
  blueStomp.blue_dragons = 2;
  blueStomp.red_dragons = 0;
  blueStomp.blue_towers = 4;
  blueStomp.red_towers = 0;
  blueStomp.blue_kills = 22;
  blueStomp.red_kills = 5;

  // 3. Red Stomp (레드팀 초압도)
  const redStomp = { ...avg };
  metadata.columns.forEach((col) => {
    if (col.startsWith('red_')) {
      const stats = metadata.stats[col];
      if (col.includes('gold')) {
        redStomp[col] = Math.round((stats.mean + stats.std * 1.5) / 50) * 50;
      } else if (col.includes('cs')) {
        redStomp[col] = Math.round(stats.mean + stats.std * 1.2);
      } else if (col.includes('kills')) {
        redStomp[col] = Math.round(stats.mean + stats.std * 1.5);
      } else if (col.includes('deaths')) {
        redStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      }
    } else if (col.startsWith('blue_')) {
      const stats = metadata.stats[col];
      if (col.includes('gold')) {
        redStomp[col] = Math.round((stats.mean - stats.std * 1.2) / 50) * 50;
      } else if (col.includes('cs')) {
        redStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      } else if (col.includes('kills')) {
        redStomp[col] = Math.max(0, Math.round(stats.mean - stats.std * 1.2));
      } else if (col.includes('deaths')) {
        redStomp[col] = Math.round(stats.mean + stats.std * 1.5);
      }
    }
  });
  redStomp.blue_firstBlood = 0;
  redStomp.blue_voidgrubs = 0;
  redStomp.red_voidgrubs = 3;
  redStomp.blue_dragons = 0;
  redStomp.red_dragons = 2;
  redStomp.blue_towers = 0;
  redStomp.red_towers = 4;
  redStomp.blue_kills = 5;
  redStomp.red_kills = 22;

  return { avg, even, blueStomp, redStomp };
};

const App = () => {
  const presets = getPresets();
  const [values, setValues] = useState(presets.avg);
  const [activeTab, setActiveTab] = useState('general'); // Default to general tab
  const [selectedModel, setSelectedModel] = useState('xgb'); // 'lr', 'rf', 'xgb'
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Run prediction API request (stats-only)
  const fetchPredictions = async (currentValues) => {
    setIsLoading(true);
    try {
      const apiHost = import.meta.env.VITE_API_HOST || '';
      const res = await fetch(`${apiHost}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentValues),
      });
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions);
        setError(null);
      } else {
        setError(data.error || '승패 예측에 실패했습니다.');
      }
    } catch (err) {
      setError('백엔드 예측 서버 연결에 실패했습니다. (Vercel 배포 후 정상 호출됩니다)');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce API calls to prevent flooding during slider drag
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPredictions(values);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [values]);

  const handleValueChange = (key, value) => {
    // Clamp values based on statistics boundaries
    const stats = metadata.stats[key];
    let clampedValue = value;
    if (stats) {
      clampedValue = Math.max(stats.min, Math.min(stats.max, value));
    }
    setValues((prev) => ({ ...prev, [key]: clampedValue }));
  };

  const handleBatchValueChange = (changes) => {
    setValues((prev) => {
      const next = { ...prev };
      Object.entries(changes).forEach(([key, value]) => {
        const stats = metadata.stats[key];
        let clampedValue = value;
        if (stats) {
          clampedValue = Math.max(stats.min, Math.min(stats.max, value));
        }
        next[key] = clampedValue;
      });
      return next;
    });
  };

  const loadPreset = (presetName) => {
    setValues(presets[presetName]);
  };

  // General tab contents (dragons, towers, first blood, kills, voidgrubs)
  const renderGeneralTab = () => {
    const generalFields = [
      { key: 'blue_dragons', label: '블루팀 드래곤', max: 2, step: 1 },
      { key: 'red_dragons', label: '레드팀 드래곤', max: 2, step: 1 },
      { key: 'blue_towers', label: '블루팀 포탑 파괴', max: 9, step: 1 },
      { key: 'red_towers', label: '레드팀 포탑 파괴', max: 9, step: 1 },
      { key: 'blue_voidgrubs', label: '블루팀 공허 유충', max: 3, step: 1 },
      { key: 'red_voidgrubs', label: '레드팀 공허 유충', max: 3, step: 1 },
      { key: 'blue_kills', label: '블루팀 총 킬수', max: 35, step: 1 },
      { key: 'red_kills', label: '레드팀 총 킬수', max: 35, step: 1 },
    ];

    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-lol-greyDark border border-lol-border/30 rounded-lg p-5">
          {/* Objects and Towers grid */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-lol-gold uppercase tracking-wider mb-2 border-b border-lol-border/20 pb-1">
              팀 주요 오브젝트 및 포탑
            </h4>
            {generalFields.slice(0, 6).map((f) => (
              <div key={f.key} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-lol-goldLight/80">{f.label}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={f.max}
                    step={f.step}
                    value={values[f.key] || 0}
                    onChange={(e) => handleValueChange(f.key, Number(e.target.value))}
                    className="accent-lol-gold w-32 md:w-48 h-1 bg-lol-greyLight rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lol-gold font-bold w-6 text-right">{values[f.key] || 0}개</span>
                </div>
              </div>
            ))}
          </div>

          {/* Kills and First Blood */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-lol-gold uppercase tracking-wider mb-2 border-b border-lol-border/20 pb-1">
              팀 교전 및 퍼스트 블러드
            </h4>
            
            {/* Kills fields */}
            {generalFields.slice(6).map((f) => (
              <div key={f.key} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-lol-goldLight/80">{f.label}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={f.max}
                    step={f.step}
                    value={values[f.key] || 0}
                    onChange={(e) => handleValueChange(f.key, Number(e.target.value))}
                    className="accent-lol-gold w-32 md:w-48 h-1 bg-lol-greyLight rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lol-gold font-bold w-8 text-right">{values[f.key] || 0}킬</span>
                </div>
              </div>
            ))}

            {/* First Blood toggle */}
            <div className="flex justify-between items-center text-xs font-semibold mt-2">
              <span className="text-lol-goldLight/80">블루팀 선취점 (First Blood)</span>
              <button
                onClick={() => handleValueChange('blue_firstBlood', values.blue_firstBlood === 1 ? 0 : 1)}
                className={`px-4 py-1.5 rounded font-extrabold uppercase border text-center transition-all ${
                  values.blue_firstBlood === 1
                    ? 'bg-lol-blue/30 border-lol-blueLight text-lol-blueLight shadow-blueGlow'
                    : 'bg-lol-redDark/20 border-lol-redLight/30 text-lol-redLight/80'
                }`}
              >
                {values.blue_firstBlood === 1 ? '블루팀 획득' : '레드팀 획득'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const laneTabs = [
    { id: 'general', title: '공통' },
    { id: 'top', title: '탑 (Top)' },
    { id: 'jungle', title: '정글 (Jng)' },
    { id: 'middle', title: '미드 (Mid)' },
    { id: 'bottom', title: '바텀 (Bot)' },
    { id: 'utility', title: '서폿 (Sup)' },
  ];

  return (
    <div className="min-height-screen bg-lol-obsidian text-lol-goldLight p-4 md:p-8 flex flex-col items-center">
      {/* Header Panel */}
      <div className="w-full max-w-6xl text-center mb-6 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg"
            alt="LoL Logo"
            className="h-8 md:h-10 opacity-90"
          />
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-goldLight">
            롤 승패 판정 시뮬레이터 (Hextech AI)
          </h1>
        </div>
        <p className="text-xs md:text-sm text-lol-goldLight/60 max-w-2xl leading-relaxed">
          Riot Games 상위 티어 경기 데이터를 학습한 AI 모델들을 통해 15분 인게임 지표를 기반으로 실시간 승률을 예측합니다.
        </p>

        {/* Global Preset Bar */}
        <div className="flex flex-wrap gap-2 justify-center mt-6 p-2 bg-lol-greyDark/50 border border-lol-border/20 rounded-lg shadow-hextech">
          <button
            onClick={() => loadPreset('avg')}
            className="px-3 py-1 text-xs font-bold border border-lol-border/50 rounded bg-lol-obsidian hover:border-lol-gold hover:text-lol-gold transition-all"
          >
            기본 평균값 로드
          </button>
          <button
            onClick={() => loadPreset('even')}
            className="px-3 py-1 text-xs font-bold border border-lol-border/50 rounded bg-lol-obsidian hover:border-lol-gold hover:text-lol-gold transition-all"
          >
            초접전 (격차 없음)
          </button>
          <button
            onClick={() => loadPreset('blueStomp')}
            className="px-3 py-1 text-xs font-bold border border-lol-blue/30 text-lol-blueLight rounded bg-lol-blue/10 hover:bg-lol-blue/20 transition-all"
          >
            블루 압도 (Blue Win)
          </button>
          <button
            onClick={() => loadPreset('redStomp')}
            className="px-3 py-1 text-xs font-bold border border-lol-redLight/20 text-lol-redLight rounded bg-lol-redDark/10 hover:bg-lol-redDark/20 transition-all"
          >
            레드 압도 (Red Win)
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Center Columns: Input Fields */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex border-b border-lol-border/30 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
              {laneTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2 md:px-4 py-2.5 text-[11px] md:text-sm font-bold tracking-wide transition-all border-b-2 -mb-0.5 ${
                    activeTab === t.id
                      ? 'border-lol-gold text-lol-gold bg-lol-greyDark/30'
                      : 'border-transparent text-lol-goldLight/50 hover:text-lol-goldLight'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* Active Tab Panel */}
            <div className="bg-lol-obsidian/45 backdrop-blur-md border border-lol-border/30 rounded-lg p-6 shadow-hextech min-h-[350px]">
              {activeTab === 'general' ? (
                renderGeneralTab()
              ) : (
                <LaneInputTab
                  lane={activeTab}
                  laneTitle={laneTabs.find((t) => t.id === activeTab)?.title.split(' ')[0] || ''}
                  values={values}
                  onChange={handleValueChange}
                  onBatchChange={handleBatchValueChange}
                  stats={metadata.stats}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Results */}
        <div className="flex flex-col gap-6">
          <h3 className="text-base font-bold text-lol-gold uppercase tracking-wider">
            실시간 예측 결과
          </h3>

          {isLoading && !predictions && (
            <div className="flex flex-col justify-center items-center h-48 bg-lol-greyDark border border-lol-border/30 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lol-gold" />
              <span className="text-xs text-lol-gold/70 mt-3 font-semibold">모델 예측 계산 중...</span>
            </div>
          )}

          {error && (
            <div className="bg-lol-redDark/20 border border-lol-redLight/30 text-lol-redLight/80 text-xs p-4 rounded-lg leading-relaxed">
              <strong>에러 발생:</strong> {error}
            </div>
          )}

          {/* Gauge Charts for the 3 Models */}
          {predictions ? (
            <div className="flex flex-col gap-4">
              <GaugeChart
                modelName="XGBoost"
                blueRate={predictions.xgboost.blue_win_rate}
                redRate={predictions.xgboost.red_win_rate}
              />
              <GaugeChart
                modelName="Logistic Regression"
                blueRate={predictions.logistic_regression.blue_win_rate}
                redRate={predictions.logistic_regression.red_win_rate}
              />
              <GaugeChart
                modelName="Random Forest"
                blueRate={predictions.random_forest.blue_win_rate}
                redRate={predictions.random_forest.red_win_rate}
              />
            </div>
          ) : (
            !isLoading &&
            !error && (
              <div className="text-center text-xs text-lol-goldLight/40 p-12 border border-dashed border-lol-border/40 rounded-lg">
                수치나 조합을 설정하면 실시간으로 예측 확률이 출력됩니다.
              </div>
            )
          )}
        </div>
      </div>

      {/* Model Performance & Confusion Matrix view */}
      <div className="w-full max-w-6xl mt-12 border-t border-lol-border/30 pt-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-lol-gold uppercase tracking-wider">
            예측 모델 성능 및 오차행렬
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedModel('xgb')}
              className={`px-3 py-1.5 text-xs font-bold border rounded transition-all ${
                selectedModel === 'xgb'
                  ? 'border-lol-gold text-lol-gold bg-lol-greyDark/30'
                  : 'border-lol-border/50 text-lol-goldLight/50'
              }`}
            >
              XGBoost
            </button>
            <button
              onClick={() => setSelectedModel('lr')}
              className={`px-3 py-1.5 text-xs font-bold border rounded transition-all ${
                selectedModel === 'lr'
                  ? 'border-lol-gold text-lol-gold bg-lol-greyDark/30'
                  : 'border-lol-border/50 text-lol-goldLight/50'
              }`}
            >
              Logistic Regression
            </button>
            <button
              onClick={() => setSelectedModel('rf')}
              className={`px-3 py-1.5 text-xs font-bold border rounded transition-all ${
                selectedModel === 'rf'
                  ? 'border-lol-gold text-lol-gold bg-lol-greyDark/30'
                  : 'border-lol-border/50 text-lol-goldLight/50'
              }`}
            >
              Random Forest
            </button>
          </div>
        </div>

        <ConfusionMatrixView
          modelName={
            selectedModel === 'xgb'
              ? 'XGBoost'
              : selectedModel === 'lr'
              ? 'Logistic Regression'
              : 'Random Forest'
          }
          metrics={metadata[selectedModel]}
        />
      </div>
    </div>
  );
};

export default App;
