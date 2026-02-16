// src/logic/index.js

export const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const getNextPowerOfTwo = (n) => {
  if (n === 0) return 0;
  let count = 1;
  while (count < n) count *= 2;
  return count;
};

const getRoundName = (pairCount) => {
    if (pairCount === 1) return "FINAL";
    if (pairCount === 2) return "SEMI FINAL";
    if (pairCount === 4) return "QUARTER FINAL";
    return `ROUND OF ${pairCount * 2}`;
};

export const validateSetup = (teams) => {
  const names = teams.map(t => t.name.trim().toLowerCase());
  if (names.some(n => n === '')) return "Nama tim tidak boleh kosong!";
  if (new Set(names).size !== names.length) return "Nama tim tidak boleh sama!";
  if (teams.length < 2) return "Minimal butuh 2 tim!";
  return null;
};

// --- LEAGUE ---
export const generateLeagueSchedule = (teams, doubleLeg) => {
  let list = [...teams];
  if (list.length % 2 !== 0) list.push({ id: 'bye', name: 'Bye' });
  const totalRounds = list.length - 1;
  const matches = [];
  const half = list.length / 2;
  let matchCounter = 1;

  for (let round = 0; round < totalRounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[list.length - 1 - i];
      if (home.id !== 'bye' && away.id !== 'bye') {
        matches.push({
          id: crypto.randomUUID(),
          matchNumber: matchCounter++,
          round: round + 1, stage: `Matchday ${round + 1}`,
          homeId: home.id, awayId: away.id,
          homeScore: '', awayScore: '', isPlayed: false,
          type: 'league'
        });
      }
    }
    list.splice(1, 0, list.pop());
  }

  if (doubleLeg) {
    const count = matches.length;
    for (let i = 0; i < count; i++) {
      const m = matches[i];
      matches.push({
        ...m, id: crypto.randomUUID(),
        matchNumber: matchCounter++,
        round: totalRounds + m.round, stage: `Matchday ${totalRounds + m.round}`,
        homeId: m.awayId, awayId: m.homeId,
        homeScore: '', awayScore: '', isPlayed: false,
      });
    }
  }
  return matches.sort((a, b) => a.round - b.round);
};

export const calculateLeagueStandings = (teams, matches, settings) => {
  const standings = teams.filter(t => t.id !== 'bye').map(t => ({
    ...t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: []
  }));
  matches.filter(m => m.isPlayed).forEach(m => {
    const h = standings.find(t => t.id === m.homeId);
    const a = standings.find(t => t.id === m.awayId);
    if (!h || !a) return;
    const hs = parseInt(m.homeScore); const as = parseInt(m.awayScore);
    h.played++; a.played++;
    h.gf += hs; h.ga += as; h.gd += (hs - as); a.gf += as; a.ga += hs; a.gd += (as - hs);
    if (hs > as) { h.won++; a.lost++; h.points += settings.winPoints; h.form.push('W'); a.form.push('L'); } 
    else if (hs < as) { a.won++; h.lost++; a.points += settings.winPoints; a.form.push('W'); h.form.push('L'); } 
    else { h.drawn++; a.drawn++; h.points += settings.drawPoints; a.points += settings.drawPoints; h.form.push('D'); a.form.push('D'); }
  });
  return standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
};

// --- CUP ---
export const generateCupBracket = (teams, settings) => {
  const targetSize = getNextPowerOfTwo(teams.length); 
  const pool = [...teams];
  
  // Isi slot sisa dengan dummy object
  while (pool.length < targetSize) {
    pool.push({ id: `bye-${crypto.randomUUID()}`, name: 'BYE_INTERNAL', isBye: true });
  }

  const roundName = getRoundName(targetSize / 2);
  const matches = [];
  let matchCounter = 1;

  for (let i = 0; i < targetSize; i += 2) {
    const home = pool[i];
    const away = pool[i+1];
    const isByeMatch = home.isBye || away.isBye;
    
    // Auto win logic (System Internal)
    let played = false, hScore = '', aScore = '';
    if (isByeMatch) {
        played = true; 
        if (away.isBye) { hScore = '3'; aScore = '0'; }
        else { hScore = '0'; aScore = '3'; }
    }

    matches.push({
      id: crypto.randomUUID(), matchNumber: matchCounter++,
      round: 1, roundName: roundName,
      homeId: home.id, awayId: away.id,
      homeScore: hScore, awayScore: aScore,
      homePen: '', awayPen: '',
      isPlayed: played, isByeMatch: isByeMatch,
      leg: 1, locked: played
    });

    if (settings.cupDoubleLeg && !isByeMatch) {
       matches.push({
        id: crypto.randomUUID(), matchNumber: matchCounter, 
        round: 1, roundName: roundName + " (Leg 2)",
        homeId: away.id, awayId: home.id,
        homeScore: '', awayScore: '', homePen: '', awayPen: '',
        isPlayed: false, leg: 2, locked: false
      });
    }
  }
  return matches;
};

export const proceedCupRound = (currentMatches, allTeams, settings) => {
  const realMatches = currentMatches.filter(m => !m.isByeMatch);
  if (realMatches.some(m => !m.isPlayed)) return { error: "Selesaikan semua skor dulu!" };

  const winners = [];
  const processedPairs = new Set();
  
  const resolveWinner = (m, m2) => {
      let hScore = parseInt(m.homeScore), aScore = parseInt(m.awayScore);
      let hPen = parseInt(m.homePen || 0), aPen = parseInt(m.awayPen || 0);
      
      if (m2) { 
          const aggH = hScore + parseInt(m2.awayScore);
          const aggA = aScore + parseInt(m2.homeScore);
          const penH = parseInt(m2.awayPen || 0); 
          const penA = parseInt(m2.homePen || 0);
          
          if (aggH > aggA) return m.homeId;
          if (aggA > aggH) return m.awayId;
          if (penH > penA) return m.homeId;
          if (penA > penH) return m.awayId;
          return null; 
      } else { 
          if (hScore > aScore) return m.homeId;
          if (aScore > hScore) return m.awayId;
          if (hPen > aPen) return m.homeId;
          if (aPen > hPen) return m.awayId;
          return null;
      }
  };

  for (let m of currentMatches) {
      if (processedPairs.has(m.id)) continue;
      
      if (m.isByeMatch) {
          winners.push(m.homeId.includes('bye') ? m.awayId : m.homeId);
          continue;
      }

      if (settings.cupDoubleLeg && m.leg === 1) {
          const leg2 = currentMatches.find(x => x.round === m.round && x.leg === 2 && x.homeId === m.awayId);
          if (!leg2) continue; 
          processedPairs.add(m.id); processedPairs.add(leg2.id);
          const w = resolveWinner(m, leg2);
          if (!w) return { error: "Ada match agregat seri. Isi penalti!" };
          winners.push(w);
      } else if (!settings.cupDoubleLeg) {
          if (m.leg === 2) continue;
          const w = resolveWinner(m, null);
          if (!w) return { error: "Ada match seri. Isi penalti!" };
          winners.push(w);
      }
  }

  const realWinners = winners.filter(w => !w.includes('bye'));

  if (realWinners.length === 1) return { winner: realWinners[0] };

  // FIX: Odd Winners Handling
  // Jika winner ganjil, tambah "Ghost Bye" biar pairing pas
  if (realWinners.length % 2 !== 0) {
      realWinners.push(`bye-auto-${crypto.randomUUID()}`);
  }

  const nextRoundMatches = [];
  const nextRoundNum = currentMatches[0].round + 1;
  const nextRoundName = getRoundName(realWinners.length / 2);
  let lastMatchNum = Math.max(...currentMatches.map(m => m.matchNumber || 0));

  for (let i = 0; i < realWinners.length; i += 2) {
    const homeId = realWinners[i];
    const awayId = realWinners[i+1];
    
    // Cek apakah salah satu peserta adalah Bye (ID mengandung 'bye')
    const isByeMatch = homeId.includes('bye') || awayId.includes('bye');

    let played = false, hScore = '', aScore = '';
    if(isByeMatch) {
        played = true;
        // Logic auto win buat bracket
        if(awayId.includes('bye')) { hScore='3'; aScore='0'; } 
        else { hScore='0'; aScore='3'; }
    }

    lastMatchNum++;
    nextRoundMatches.push({
      id: crypto.randomUUID(), matchNumber: lastMatchNum,
      round: nextRoundNum, roundName: nextRoundName,
      homeId: homeId, awayId: awayId,
      homeScore: hScore, awayScore: aScore,
      homePen: '', awayPen: '',
      isPlayed: played, leg: 1, locked: played, isByeMatch: isByeMatch
    });
    
    if (settings.cupDoubleLeg && !isByeMatch) { 
        nextRoundMatches.push({
            id: crypto.randomUUID(), matchNumber: lastMatchNum,
            round: nextRoundNum, roundName: nextRoundName + " (Leg 2)",
            homeId: awayId, awayId: homeId,
            homeScore: '', awayScore: '', homePen: '', awayPen: '',
            isPlayed: false, leg: 2, locked: false, isByeMatch: false
        }); 
    }
  }

  return { nextMatches: nextRoundMatches };
};