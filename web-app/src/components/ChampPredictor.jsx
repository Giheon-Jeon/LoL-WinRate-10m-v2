import React, { useState, useEffect } from 'react';
import champMetadata from '../data/champ_metadata.json';

const roles = [
  { id: 'top', title: '탑 (Top)' },
  { id: 'jungle', title: '정글 (Jungle)' },
  { id: 'mid', title: '미드 (Mid)' },
  { id: 'bot', title: '원딜 (Bot)' },
  { id: 'sup', title: '서폿 (Sup)' },
];

const defaultBlue = ['Aatrox', 'LeeSin', 'Ahri', 'Ezreal', 'Alistar'];
const defaultRed = ['Darius', 'Elise', 'Syndra', 'Jinx', 'Thresh'];

const ChampPredictor = ({ blueChamps, setBlueChamps, redChamps, setRedChamps }) => {
  const [champData, setChampData] = useState({});
  const [activeSlot, setActiveSlot] = useState(null); // { team: 'blue'|'red', index: 0-4 }
  const [searchTerm, setSearchTerm] = useState('');

  const [version, setVersion] = useState('14.24.1'); // Fallback version containing Ambessa/Aurora/Mel

  // Fetch Korean champion metadata from Riot DataDragon using dynamic latest version
  useEffect(() => {
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then((res) => res.json())
      .then((versions) => {
        const latest = versions[0] || '14.24.1';
        setVersion(latest);
        return fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/ko_KR/champion.json`);
      })
      .then((res) => res.json())
      .then((json) => {
        setChampData(json.data);
      })
      .catch((err) => {
        console.error('DataDragon fetch failed, using fallback:', err);
        fetch('https://ddragon.leagueoflegends.com/cdn/14.24.1/data/ko_KR/champion.json')
          .then((res) => res.json())
          .then((json) => setChampData(json.data))
          .catch((err2) => console.error('Fallback fetch failed too:', err2));
      });
  }, []);

  const getChampNameKo = (id) => {
    return champData[id]?.name || id;
  };

  const getChampImgUrl = (id) => {
    // If it's a valid champion ID, load from DataDragon
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`;
  };

  const handleSelectChamp = (champId) => {
    if (!activeSlot) return;

    if (activeSlot.team === 'blue') {
      const newChamps = [...blueChamps];
      newChamps[activeSlot.index] = champId;
      setBlueChamps(newChamps);
    } else {
      const newChamps = [...redChamps];
      newChamps[activeSlot.index] = champId;
      setRedChamps(newChamps);
    }
    setActiveSlot(null);
    setSearchTerm('');
  };

  // Filter champion list based on search term (checks both English ID and Korean name)
  const filteredChamps = champMetadata.champions.filter((c) => {
    const koName = getChampNameKo(c);
    return (
      c.toLowerCase().includes(searchTerm.toLowerCase()) ||
      koName.includes(searchTerm)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 5 vs 5 Selection Layout */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Blue Team Selection */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-lol-blueLight animate-pulse" />
            <h4 className="text-sm font-extrabold text-lol-blueLight uppercase tracking-wider">
              블루팀 조합 선택 (Blue Team)
            </h4>
          </div>

          <div className="flex flex-col gap-2.5">
            {roles.map((role, idx) => {
              const champId = blueChamps[idx];
              const isSelected = activeSlot?.team === 'blue' && activeSlot?.index === idx;

              return (
                <div
                  key={role.id}
                  onClick={() => setActiveSlot({ team: 'blue', index: idx })}
                  className={`flex items-center gap-4 p-2.5 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-lol-blueLight bg-lol-blue/20 shadow-blueGlow'
                      : 'border-lol-border/40 bg-lol-greyDark hover:border-lol-blue/60'
                  }`}
                >
                  <img
                    src={getChampImgUrl(champId)}
                    alt={champId}
                    onError={(e) => { e.target.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png` }}
                    className="h-10 w-10 rounded-md border border-lol-border/50"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] text-lol-goldLight/40 block font-bold uppercase">{role.title}</span>
                    <span className="text-sm font-bold text-lol-goldLight">{getChampNameKo(champId)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VS Indicator */}
        <div className="md:col-span-1 text-center py-4">
          <span className="text-xl font-extrabold text-lol-gold/50 tracking-widest block">VS</span>
        </div>

        {/* Red Team Selection */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-lol-redLight animate-pulse" />
            <h4 className="text-sm font-extrabold text-lol-redLight uppercase tracking-wider">
              레드팀 조합 선택 (Red Team)
            </h4>
          </div>

          <div className="flex flex-col gap-2.5">
            {roles.map((role, idx) => {
              const champId = redChamps[idx];
              const isSelected = activeSlot?.team === 'red' && activeSlot?.index === idx;

              return (
                <div
                  key={role.id}
                  onClick={() => setActiveSlot({ team: 'red', index: idx })}
                  className={`flex items-center gap-4 p-2.5 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-lol-redLight bg-lol-redDark/20 shadow-redGlow'
                      : 'border-lol-border/40 bg-lol-greyDark hover:border-lol-redLight/40'
                  }`}
                >
                  <img
                    src={getChampImgUrl(champId)}
                    alt={champId}
                    onError={(e) => { e.target.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/Aatrox.png` }}
                    className="h-10 w-10 rounded-md border border-lol-border/50"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] text-lol-goldLight/40 block font-bold uppercase">{role.title}</span>
                    <span className="text-sm font-bold text-lol-goldLight">{getChampNameKo(champId)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Champion Picker Modal/Overlay */}
      {activeSlot && (
        <div className="bg-lol-greyDark border border-lol-gold/30 rounded-lg p-5 mt-4 shadow-hextechGlow">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-lol-gold uppercase tracking-wider">
              {activeSlot.team === 'blue' ? '블루팀' : '레드팀'}{' '}
              {roles[activeSlot.index].title} 챔피언 변경
            </h4>
            <button
              onClick={() => setActiveSlot(null)}
              className="text-xs text-lol-goldLight/60 hover:text-lol-gold font-bold px-2 py-0.5 border border-lol-border/50 rounded"
            >
              닫기
            </button>
          </div>

          {/* Search box */}
          <input
            type="text"
            placeholder="챔피언 검색 (한글 또는 영어)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-lol-obsidian border border-lol-border text-lol-goldLight text-sm font-semibold px-4 py-2 rounded focus:outline-none focus:border-lol-gold mb-4"
          />

          {/* Grid list of champions */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-56 overflow-y-auto pr-1">
            {filteredChamps.map((c) => (
              <div
                key={c}
                onClick={() => handleSelectChamp(c)}
                className="flex flex-col items-center p-1.5 rounded bg-lol-obsidian border border-lol-border/30 hover:border-lol-gold/50 cursor-pointer transition-all"
              >
                <img
                  src={getChampImgUrl(c)}
                  alt={c}
                  loading="lazy"
                  className="h-9 w-9 rounded-md border border-lol-border/40 mb-1"
                />
                <span className="text-[10px] font-bold text-lol-goldLight/80 text-center truncate w-full">
                  {getChampNameKo(c)}
                </span>
              </div>
            ))}
            {filteredChamps.length === 0 && (
              <div className="col-span-full text-center text-xs text-lol-goldLight/40 py-4">
                검색된 챔피언이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampPredictor;
