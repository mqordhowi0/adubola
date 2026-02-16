// src/App.jsx
import React, { useState, useRef } from 'react';
import { useCompetition } from './hooks/useCompetition';
import Bracket from './components/bracket/Bracket';
import League from './components/league/League';

const styles = `
  .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #020617; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; border: 3px solid #020617; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
  @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .animate-scale-in { animation: scale-in 0.3s ease-out; }
  .animate-fade-in { animation: fade-in 0.5s ease-out; }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
`;

function App() {
  const comp = useCompetition();
  const bracketContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        bracketContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => alert(err.message));
    } else {
        document.exitFullscreen();
        setIsFullscreen(false);
        setZoomLevel(1);
    }
  };

  const handleZoom = (delta) => {
      setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.4), 2.5));
  };

  React.useEffect(() => {
      const handleFsChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
          if(!document.fullscreenElement) setZoomLevel(1);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!comp || !comp.teams || !comp.matches) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono animate-pulse">Loading Stadium...</div>;
  }

  const isPenaltyNeeded = (match) => {
      if (comp.compType !== 'cup' || !match.isPlayed || match.isByeMatch) return false;
      const hScore = parseInt(match.homeScore)||0;
      const aScore = parseInt(match.awayScore)||0;
      if (comp.settings.cupDoubleLeg) {
          if (match.leg === 1) return false;
          const leg1 = comp.matches.find(m => m.round === match.round && m.leg === 1 && m.homeId === match.awayId);
          if (!leg1) return false;
          const aggH = (parseInt(leg1.homeScore)||0) + aScore;
          const aggA = (parseInt(leg1.awayScore)||0) + hScore;
          return aggH === aggA;
      } 
      return hScore === aScore;
  };

  const groupedMatches = comp.matches.reduce((acc, m) => {
      const hTeam = comp.teams.find(t => t.id === m.homeId);
      const aTeam = comp.teams.find(t => t.id === m.awayId);
      const isGhostMatch = (m.homeId && m.homeId.includes('bye')) && (m.awayId && m.awayId.includes('bye'));
      const isReady = !m.isByeMatch && !isGhostMatch && hTeam && aTeam;
      if (isReady) {
          if (!acc[m.roundName]) acc[m.roundName] = [];
          acc[m.roundName].push(m);
      }
      return acc;
  }, {});

  const hasPlayableMatches = Object.keys(groupedMatches).length > 0;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
      <style>{styles}</style>
      
      {/* HEADER UTAMA APLIKASI */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 p-3 shadow-lg z-20 relative">
         <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
             <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                    ⚽ AduBola <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs md:text-sm border border-emerald-400/20">Manager</span>
                </h1>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all
                    ${comp.isSaved ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-900/20 border-amber-500/30 text-amber-400 animate-pulse'}`}>
                    <span className={`w-2 h-2 rounded-full ${comp.isSaved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {comp.isSaved ? 'All Saved' : 'Unsaved Changes'}
                </div>
             </div>
             <div className="flex flex-wrap justify-center gap-2">
                <button onClick={comp.saveData} className="px-4 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg font-bold hover:bg-blue-600 hover:text-white text-xs transition flex items-center gap-2">💾 SAVE</button>
                <label className="px-4 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg font-bold hover:bg-slate-700 hover:text-white text-xs transition cursor-pointer flex items-center gap-2">📂 LOAD <input type="file" hidden onChange={comp.loadData} /></label>
                {comp.mode === 'active' && <button onClick={comp.reset} className="px-4 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg font-bold hover:bg-red-600 hover:text-white text-xs transition flex items-center gap-2">🛑 RESET</button>}
             </div>
         </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <div className="h-full max-w-[1800px] mx-auto p-2 md:p-4 lg:p-6">
            {comp.mode === 'setup' ? (
                // --- SETUP MODE ---
                <div className="h-full overflow-y-auto custom-scrollbar pb-20">
                    <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto mt-4 md:mt-10">
                        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                            <div className="flex justify-between mb-4 items-center">
                                <h2 className="font-bold text-white text-lg">Daftar Tim ({comp.teams.length})</h2>
                                <div className="flex gap-2">
                                    <button onClick={comp.randomizeTeams} className="text-xs bg-purple-600/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded hover:bg-purple-600 hover:text-white transition">Acak Posisi</button>
                                    <button onClick={comp.addTeam} className="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-600 hover:text-white transition">+ Tambah Tim</button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {comp.teams.map((t, i) => (
                                    <div key={t.id} className="flex relative group">
                                        <span className="bg-slate-800 px-3 py-2 rounded-l-lg text-slate-500 text-sm border-y border-l border-slate-700 font-mono w-10 text-center flex items-center justify-center">{i + 1}</span>
                                        <input value={t.name} onChange={e => comp.updateTeamName(i, e.target.value)} className="w-full bg-slate-950 border border-slate-700 px-3 text-slate-200 focus:border-emerald-500 outline-none text-sm rounded-r-lg placeholder-slate-600" placeholder={`Nama Tim ${i + 1}`}/>
                                        <button onClick={() => comp.removeTeam(i)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-900 transition">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit shadow-xl">
                            <h2 className="font-bold text-white text-lg mb-4">Pengaturan</h2>
                            
                            {/* INPUT NAMA KOMPETISI */}
                            <div className="mb-6">
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">Nama Liga / Cup</label>
                                <input 
                                    type="text" 
                                    value={comp.competitionName} 
                                    onChange={e => comp.setCompetitionName(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-emerald-400 font-bold outline-none focus:border-emerald-500 placeholder-slate-700 transition"
                                    placeholder="Contoh: Premier League 2026"
                                />
                            </div>

                            <div className="flex bg-slate-950 p-1 rounded-lg mb-4 border border-slate-800">
                                <button onClick={() => comp.setCompType('league')} className={`flex-1 py-2 text-xs font-bold rounded transition ${comp.compType === 'league' ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>LIGA</button>
                                <button onClick={() => comp.setCompType('cup')} className={`flex-1 py-2 text-xs font-bold rounded transition ${comp.compType === 'cup' ? 'bg-slate-800 text-white shadow ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>CUP (Gugur)</button>
                            </div>
                            
                            {comp.compType === 'league' ? (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">WIN POINTS</label><input type="number" value={comp.settings.winPoints} onChange={e => comp.setSettings({...comp.settings, winPoints: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-emerald-400 font-bold outline-none focus:border-emerald-500"/></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">DRAW POINTS</label><input type="number" value={comp.settings.drawPoints} onChange={e => comp.setSettings({...comp.settings, drawPoints: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-center text-slate-400 font-bold outline-none focus:border-slate-500"/></div>
                                    </div>
                                    <label className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:bg-slate-900 transition"><input type="checkbox" checked={comp.settings.doubleLeg} onChange={e => comp.setSettings({...comp.settings, doubleLeg: e.target.checked})} className="accent-emerald-500 w-4 h-4"/><span className="text-sm font-bold text-slate-400">Home & Away (2x Ketemu)</span></label>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <label className="flex items-center gap-3 p-3 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:bg-slate-900 transition"><input type="checkbox" checked={comp.settings.cupDoubleLeg} onChange={e => comp.setSettings({...comp.settings, cupDoubleLeg: e.target.checked})} className="accent-emerald-500 w-4 h-4"/><div><span className="text-sm font-bold block text-slate-300">2 Leg (Home & Away)</span><span className="text-[10px] text-slate-600 block">Total gol kandang + tandang</span></div></label>
                                    <div className="p-3 bg-blue-900/10 border border-blue-900/20 rounded text-xs text-blue-400 leading-relaxed">ℹ️ Jika jumlah tim ganjil, sistem otomatis membuat bracket <strong>"Lolos Otomatis" (Bye)</strong> untuk menggenapkan slot.</div>
                                </div>
                            )}
                            <button onClick={comp.startCompetition} className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 font-bold rounded-lg shadow-lg text-white transition transform active:scale-[0.98]">GENERATE BRACKET 🔥</button>
                        </div>
                    </div>
                </div>
            ) : (
                // --- ACTIVE MODE ---
                <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 h-full grid-rows-[55%_45%] lg:grid-rows-1">
                     
                     {/* KIRI: VISUALISASI (Bracket/League) */}
                     <div className="lg:col-span-2 h-full overflow-hidden flex flex-col min-h-0 animate-fade-in">
                        {comp.compType === 'league' ? (
                            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                                {/* HEADER KHUSUS LIGA (Agar konsisten) */}
                                <div className="flex justify-between items-center p-4 bg-slate-950/50 border-b border-white/5 z-10">
                                    <h2 className="text-lg font-black text-emerald-400 uppercase tracking-widest truncate">{comp.competitionName}</h2>
                                    <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-900 rounded-full border border-slate-700">STANDINGS</span>
                                </div>
                                <div className="flex-1 p-1 overflow-hidden">
                                    <League teams={comp.teams} matches={comp.matches} settings={comp.settings} />
                                </div>
                            </div>
                        ) : (
                            // WRAPPER BRACKET DENGAN HEADER BARU
                            <div ref={bracketContainerRef} className={`relative group bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-2xl'}`}>
                                
                                {/* HEADER TOOLBAR (SEJAJAR DENGAN NAMA) */}
                                <div className="flex justify-between items-center p-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
                                    {/* Nama Kompetisi */}
                                    <h2 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest truncate max-w-[50%]">
                                        {comp.competitionName}
                                    </h2>

                                    {/* Tombol Kontrol */}
                                    <div className="flex items-center gap-2">
                                         {/* Zoom Controls (Hanya saat Fullscreen) */}
                                         {isFullscreen && (
                                             <div className="flex items-center bg-slate-900 rounded-full border border-slate-700 mr-2 p-0.5">
                                                <button onClick={() => handleZoom(-0.2)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full font-bold text-sm">－</button>
                                                <span className="text-[10px] font-mono text-slate-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                                                <button onClick={() => handleZoom(0.2)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-full font-bold text-sm">＋</button>
                                             </div>
                                         )}
                                         
                                         {/* Fullscreen Toggle */}
                                         <button onClick={toggleFullscreen} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-700 hover:text-white transition font-bold border border-slate-600 flex items-center gap-1 shadow-sm">
                                            {isFullscreen ? '↙ MINIMIZE' : '↗ FULLSCREEN'}
                                         </button>
                                         
                                         {/* Undo */}
                                         {comp.history.length > 0 && !isFullscreen && (
                                             <button onClick={comp.undoLastRound} className="text-xs text-white px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition font-bold border border-slate-500 shadow-sm ml-1">
                                                 ↩ UNDO
                                             </button>
                                         )}
                                    </div>
                                </div>

                                {/* Konten Bracket (Akan otomatis ada di bawah header karena flex-col) */}
                                <div className="flex-1 overflow-hidden p-1">
                                    <Bracket matches={comp.matches} teams={comp.teams} settings={comp.settings} cupWinner={comp.cupWinner} updateScore={comp.updateScore} zoomLevel={zoomLevel} />
                                </div>
                            </div>
                        )}
                     </div>

                     {/* KANAN: INPUT LIST */}
                     <div className="bg-slate-900 rounded-2xl border border-slate-800 h-full flex flex-col shadow-xl overflow-hidden min-h-0 animate-fade-in" style={{animationDelay: '0.1s'}}>
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-10 shrink-0">
                            <h3 className="font-bold text-white text-sm">INPUT SKOR</h3>
                            {comp.compType === 'cup' && !comp.cupWinner && <button onClick={comp.nextCupRound} className="text-[10px] bg-yellow-600 text-white px-3 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20 active:translate-y-0.5 transition flex items-center gap-1">LANJUT BABAK »</button>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-950/30">
                            {hasPlayableMatches ? (
                                Object.entries(groupedMatches).map(([stage, ms]) => (
                                    <div key={stage}>
                                        <div className="sticky top-0 z-10 flex justify-center mb-4">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-full shadow tracking-widest">{stage}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {ms.map(m => {
                                                const hName = comp.teams.find(t => t.id === m.homeId)?.name || '...';
                                                const aName = comp.teams.find(t => t.id === m.awayId)?.name || '...';
                                                const showPen = isPenaltyNeeded(m);
                                                return (
                                                    <div key={m.id} className={`p-4 rounded-xl border transition-all ${m.locked ? 'bg-slate-950 border-slate-900 opacity-50 grayscale' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                                                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                                            <span className="text-[9px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 tracking-wider">{m.leg ? `LEG ${m.leg}` : 'MATCH'}</span>
                                                            {m.locked && <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1">🔒 LOCKED</span>}
                                                        </div>
                                                        <div className="flex items-center justify-between gap-3 relative">
                                                            <div className="flex-1 text-right flex flex-col justify-center overflow-hidden">
                                                                 <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] uppercase mb-0.5 self-end">Home</span>
                                                                 <span className={`text-sm truncate ${m.locked ? 'text-slate-500' : 'text-slate-200 font-bold'}`}>{hName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-slate-800 shrink-0">
                                                                <input type="number" min="0" readOnly={m.locked} value={m.homeScore} onChange={e => comp.updateScore(m.id, 'homeScore', e.target.value)} className="w-9 h-9 text-center bg-transparent text-emerald-400 font-bold focus:outline-none placeholder-slate-700 text-lg font-mono"/>
                                                                <span className="text-slate-600 text-sm font-bold">:</span>
                                                                <input type="number" min="0" readOnly={m.locked} value={m.awayScore} onChange={e => comp.updateScore(m.id, 'awayScore', e.target.value)} className="w-9 h-9 text-center bg-transparent text-emerald-400 font-bold focus:outline-none placeholder-slate-700 text-lg font-mono"/>
                                                            </div>
                                                            <div className="flex-1 text-left flex flex-col justify-center overflow-hidden">
                                                                 <span className="text-[8px] font-black text-rose-600 tracking-[0.2em] uppercase mb-0.5 self-start">Away</span>
                                                                 <span className={`text-sm truncate ${m.locked ? 'text-slate-500' : 'text-slate-200 font-bold'}`}>{aName}</span>
                                                            </div>
                                                        </div>
                                                        {showPen && (
                                                            <div className="mt-4 pt-3 border-t border-dashed border-slate-800 flex flex-col items-center gap-2 animate-fade-in bg-slate-950/30 p-2 rounded-lg">
                                                                <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest">Adu Penalti</span>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1"><span className="text-[9px] text-emerald-700 font-bold">H</span><input type="number" min="0" placeholder="0" readOnly={m.locked} value={m.homePen === undefined ? '' : m.homePen} onChange={e => {if(e.target.value >= 0) comp.updateScore(m.id, 'homePen', e.target.value)}} className="w-10 h-7 text-center text-sm bg-black border border-yellow-700/30 rounded text-yellow-500 font-bold focus:border-yellow-500 outline-none"/></div>
                                                                    <span className="text-slate-600 text-xs">-</span>
                                                                    <div className="flex items-center gap-1"><input type="number" min="0" placeholder="0" readOnly={m.locked} value={m.awayPen === undefined ? '' : m.awayPen} onChange={e => {if(e.target.value >= 0) comp.updateScore(m.id, 'awayPen', e.target.value)}} className="w-10 h-7 text-center text-sm bg-black border border-yellow-700/30 rounded text-yellow-500 font-bold focus:border-yellow-500 outline-none"/><span className="text-[9px] text-rose-700 font-bold">A</span></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-700 py-10 opacity-60">
                                    <span className="text-5xl mb-4 grayscale">🏟️</span>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{comp.cupWinner ? 'Turnamen Selesai' : 'Siap Bertanding'}</p>
                                </div>
                            )}
                        </div>
                     </div>
                  </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;