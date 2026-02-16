// src/components/bracket/Bracket.jsx
import React from 'react';

const CARD_HEIGHT_CLASS = "h-28"; 
const CARD_WIDTH_CLASS = "w-72";  
const CARD_HEIGHT_REM = 7; 

// --- SUB-COMPONENT: KARTU MATCH ---
const MatchCard = ({ match, teams, settings }) => {
    const hTeam = teams.find(t => t.id === match.homeId);
    const aTeam = teams.find(t => t.id === match.awayId);
    
    const isReady = hTeam && aTeam;
    const leg2 = settings.cupDoubleLeg ? match.leg2Data : null;
    const isPlayed = match.isPlayed && (settings.cupDoubleLeg ? leg2?.isPlayed : true);
    
    const hScore1 = parseInt(match.homeScore)||0; const aScore1 = parseInt(match.awayScore)||0;
    const hScore2 = leg2 ? (parseInt(leg2.awayScore)||0) : 0;
    const aScore2 = leg2 ? (parseInt(leg2.homeScore)||0) : 0;
    const aggH = hScore1 + hScore2; const aggA = aScore1 + aScore2;
    const penInputExists = match.homePen !== '' || match.awayPen !== '' || (leg2 && (leg2.homePen !== '' || leg2.awayPen !== ''));
    const isAggTied = aggH === aggA && isPlayed;
    const hasPen = isAggTied && penInputExists;
    const hPen = hasPen ? parseInt(match.homePen || leg2?.awayPen || 0) : 0;
    const aPen = hasPen ? parseInt(match.awayPen || leg2?.homePen || 0) : 0;

    let hWin = false, aWin = false;
    if (isReady && isPlayed) {
        if (aggH > aggA) hWin = true;
        else if (aggA > aggH) aWin = true;
        else if (hasPen) { if (hPen > aPen) hWin = true; else aWin = true; }
    }

    // --- VISUAL CONNECTOR (GARIS PERTAMA) ---
    // Panjang w-8 (2rem). Posisi tepat di kanan kartu.
    const RightConnector = () => (
        <div className="absolute right-[-2rem] top-1/2 -translate-y-1/2 w-8 h-[2px] bg-slate-600 z-0"></div>
    );

    const CardWrapper = ({ children }) => (
        <div className={`${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS} relative flex items-center justify-center z-10`}>
            {children}
            <RightConnector />
        </div>
    );

    // TIPE 1: AUTO LOLOS (BYE)
    if (match.isByeMatch) {
        const realTeam = match.homeId.includes('bye') ? aTeam : hTeam;
        return (
            <CardWrapper>
                <div className="w-full h-full bg-slate-900/30 border border-slate-700 border-dashed rounded-xl p-3 opacity-60 flex flex-col justify-center relative">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-2">Lolos Otomatis</span>
                    <div className="font-bold text-slate-300 text-sm truncate flex items-center gap-2">
                        {realTeam?.name || '...'}
                        <span className="text-[10px] bg-emerald-900 text-emerald-400 px-1.5 py-0.5 rounded-full shadow">✔</span>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    // TIPE 2: WAITING
    if (!isReady) {
        return (
            <CardWrapper>
                <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col relative opacity-50">
                     <div className="px-4 py-2 border-b border-slate-900 text-[10px] text-slate-600 font-bold flex justify-between items-center h-8 shrink-0">
                        <span>MATCH {match.matchNumber}</span>
                        <span className="text-yellow-700 bg-yellow-900/10 px-2 py-0.5 rounded">WAITING</span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-center gap-3">
                         <div className="h-2 w-24 bg-slate-900 rounded animate-pulse"></div>
                         <div className="h-2 w-24 bg-slate-900 rounded animate-pulse"></div>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    // TIPE 3: MATCH AKTIF
    return (
        <CardWrapper>
            <div className={`w-full h-full rounded-xl overflow-hidden border transition-all relative flex flex-col ${match.locked ? 'bg-slate-950 border-slate-900 grayscale' : 'bg-slate-900 border-slate-600 shadow-xl'}`}>
                <div className="bg-black/30 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-500 border-b border-white/5 h-8 shrink-0">
                    <span className="font-bold tracking-wider">MATCH {match.matchNumber}</span>
                    {settings.cupDoubleLeg && <span className="bg-slate-800 px-1.5 rounded text-[9px]">2-LEG</span>}
                </div>
                <div className="flex-1 flex flex-col justify-center py-1 relative font-medium"> 
                    <div className={`flex justify-between items-center px-4 py-2 ${hWin ? 'bg-emerald-500/10' : ''}`}>
                        <span className={`text-xs truncate w-32 ${hWin ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>{hTeam.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                            <span className={`w-5 text-center ${hWin ? 'text-white' : 'text-slate-400'}`}>{match.homeScore}</span>
                            {leg2 && <><span className="text-slate-600">/</span><span className="text-slate-500 w-5 text-center">{leg2.awayScore}</span></>}
                            {hasPen && <span className="text-yellow-500 text-[10px] ml-1 bg-yellow-900/30 px-1 rounded border border-yellow-700/50">({hPen})</span>}
                        </div>
                    </div>
                    <div className={`flex justify-between items-center px-4 py-2 ${aWin ? 'bg-emerald-500/10' : ''}`}>
                        <span className={`text-xs truncate w-32 ${aWin ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>{aTeam.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                            <span className={`w-5 text-center ${aWin ? 'text-white' : 'text-slate-400'}`}>{match.awayScore}</span>
                            {leg2 && <><span className="text-slate-600">/</span><span className="text-slate-500 w-5 text-center">{leg2.homeScore}</span></>}
                            {hasPen && <span className="text-yellow-500 text-[10px] ml-1 bg-yellow-900/30 px-1 rounded border border-yellow-700/50">({aPen})</span>}
                        </div>
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};

// --- PAIRING COMPONENT (TIANG & GARIS KEDUA) ---
const MatchPair = ({ topMatch, bottomMatch, teams, settings, hasNextRound, gapVal }) => {
    return (
        <div className="flex flex-col relative"> 
            <MatchCard match={topMatch} teams={teams} settings={settings} />
            <div style={{ height: gapVal }}></div>
            {bottomMatch && <MatchCard match={bottomMatch} teams={teams} settings={settings} />}

            {hasNextRound && bottomMatch && (
                <>
                    {/* TIANG VERTIKAL 
                        Posisi: right-[-2rem].
                        Ini pas banget di ujung garis pertama (RightConnector) yang panjangnya 2rem.
                    */}
                    <div className="absolute right-[-2rem] border-r-2 border-slate-600"
                        style={{ top: `${CARD_HEIGHT_REM / 2}rem`, bottom: `${CARD_HEIGHT_REM / 2}rem`, width: '1rem' }}></div>
                    
                    {/* GARIS HORIZONTAL KE KANAN (GARIS KEDUA)
                        Posisi: right-[-4rem].
                        Panjang: w-8 (2rem).
                        Ini nyambung dari Tiang (-2rem) sampai ke awal kartu ronde berikutnya (-4rem).
                        Total Jarak = 4rem (Sesuai dengan gap-16).
                    */}
                    <div className="absolute right-[-4rem] top-1/2 -translate-y-[1px] w-8 h-[2px] bg-slate-600"></div>
                </>
            )}
        </div>
    );
};

const Bracket = ({ matches, teams, settings, cupWinner, zoomLevel = 1 }) => {
    const rounds = {};
    matches.forEach(m => { if (!rounds[m.round]) rounds[m.round] = []; rounds[m.round].push(m); });
    const roundKeys = Object.keys(rounds).sort((a, b) => a - b);

    const visualData = {};
    roundKeys.forEach(r => {
        const ms = rounds[r];
        const leg1Matches = ms.filter(m => (!settings.cupDoubleLeg || m.leg === 1));
        leg1Matches.sort((a,b) => a.matchNumber - b.matchNumber);
        visualData[r] = leg1Matches.map(m => {
            const leg2 = settings.cupDoubleLeg ? ms.find(x => x.leg === 2 && x.homeId === m.awayId) : null;
            return { ...m, leg2Data: leg2 };
        });
    });

    const BASE_GAP_REM = 2;

    return (
        <div className="w-full h-full overflow-auto custom-scrollbar bg-slate-900 relative">
            {/* CONTAINER GAP UTAMA: gap-16 (4rem) */}
            <div className="flex items-start gap-16 min-w-max p-10 pb-24 origin-top-left transition-transform duration-200 ease-out"
                 style={{ transform: `scale(${zoomLevel})` }}>
                
                {roundKeys.map((rNum, rIdx) => {
                    const currentMatches = visualData[rNum];
                    const roundName = currentMatches[0].roundName.split(' (')[0];
                    const isLastRound = rIdx === roundKeys.length - 1;
                    const pairs = [];
                    for (let i = 0; i < currentMatches.length; i += 2) { pairs.push({ top: currentMatches[i], bottom: currentMatches[i + 1] }); }

                    let currentGap = BASE_GAP_REM;
                    for(let i=0; i<rIdx; i++) currentGap = currentGap * 2 + CARD_HEIGHT_REM;

                    let topOffset = 0;
                    let prevGap = BASE_GAP_REM;
                    for(let i=0; i<rIdx; i++) { topOffset += (CARD_HEIGHT_REM + prevGap) / 2; prevGap = prevGap * 2 + CARD_HEIGHT_REM; }

                    return (
                        <div key={rNum} className="flex flex-col relative" style={{ paddingTop: `${topOffset}rem` }}>
                            <div className="absolute -top-10 left-0 w-full text-center">
                                <span className="bg-slate-950 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded border border-slate-800 uppercase tracking-widest shadow">{roundName}</span>
                            </div>
                            <div className="flex flex-col" style={{ gap: `${currentGap}rem` }}>
                                {pairs.map((pair, idx) => {
                                    // FINAL MATCH (Single)
                                    if (!pair.bottom) { 
                                        return (
                                            <div key={pair.top.id} className="relative flex items-center">
                                                <MatchCard match={pair.top} teams={teams} settings={settings} />
                                                {/* Garis Pemenang */}
                                                {cupWinner && <div className="absolute -right-8 w-8 h-[2px] bg-yellow-500 animate-pulse shadow-[0_0_10px_orange]"></div>}
                                            </div>
                                        );
                                    }
                                    // NORMAL MATCH (Pair)
                                    return <MatchPair key={idx} topMatch={pair.top} bottomMatch={pair.bottom} teams={teams} settings={settings} hasNextRound={!isLastRound} gapVal={`${currentGap}rem`} />;
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* KOLOM JUARA */}
                {cupWinner && (
                    <div className="flex flex-col justify-center pl-0 animate-scale-in" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 p-1 rounded-2xl shadow-[0_0_80px_rgba(234,179,8,0.3)]">
                            <div className="bg-slate-950 p-6 rounded-xl border border-yellow-500/30 text-center w-64 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                <div className="relative z-10">
                                    <div className="text-6xl mb-2 drop-shadow-lg filter">🏆</div>
                                    <div className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Champion</div>
                                    <div className="text-2xl font-black text-white uppercase leading-tight tracking-tight">{cupWinner}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bracket;