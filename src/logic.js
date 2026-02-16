// src/logic.js

export const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export const validateSetup = (teams) => {
    if (teams.length < 2) return "Minimal 2 tim untuk memulai!";
    const emptyName = teams.find(t => !t.name.trim());
    if (emptyName) return "Semua nama tim harus diisi!";
    return null;
};

// --- LEAGUE LOGIC (Tetap sama) ---
export const generateLeagueSchedule = (teams, doubleLeg) => {
    const schedule = [];
    const n = teams.length;
    const ghost = n % 2 !== 0;
    const players = [...teams];
    if (ghost) players.push({ id: 'bye', name: 'BYE', isBye: true });

    const totalRounds = (players.length - 1) * (doubleLeg ? 2 : 1);
    const half = players.length / 2;
    const roundsInLeg = players.length - 1;

    let matchId = 1;

    for (let r = 0; r < totalRounds; r++) {
        const roundMatches = [];
        const isLeg2 = r >= roundsInLeg;
        for (let i = 0; i < half; i++) {
            let home = players[i];
            let away = players[players.length - 1 - i];
            if (isLeg2) [home, away] = [away, home];

            if (!home.isBye && !away.isBye) {
                roundMatches.push({
                    id: crypto.randomUUID(),
                    matchNumber: matchId++,
                    stage: `Week ${r + 1}`,
                    homeId: home.id, awayId: away.id,
                    homeScore: '', awayScore: '',
                    isPlayed: false, locked: false,
                    leg: isLeg2 ? 2 : 1
                });
            }
        }
        schedule.push(...roundMatches);
        players.splice(1, 0, players.pop());
    }
    return schedule;
};

export const calculateLeagueStandings = (teams, matches, settings) => {
    const stats = teams.map(t => ({
        ...t, played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, points: 0, form: []
    }));

    matches.forEach(m => {
        if (!m.isPlayed) return;
        const h = stats.find(t => t.id === m.homeId);
        const a = stats.find(t => t.id === m.awayId);
        if (!h || !a) return;
        const hS = parseInt(m.homeScore)||0; const aS = parseInt(m.awayScore)||0;
        h.played++; a.played++; h.gf += hS; h.ga += aS; h.gd = h.gf - h.ga;
        a.gf += aS; a.ga += hS; a.gd = a.gf - a.ga;
        if (hS > aS) { h.won++; h.points += settings.winPoints; h.form.push('W'); a.lost++; a.form.push('L'); }
        else if (hS < aS) { a.won++; a.points += settings.winPoints; a.form.push('W'); h.lost++; h.form.push('L'); }
        else { h.drawn++; h.points += settings.drawPoints; h.form.push('D'); a.drawn++; a.points += settings.drawPoints; a.form.push('D'); }
    });
    return stats.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
};

// --- CUP / BRACKET LOGIC (YANG DIPERBAIKI) ---

export const generateCupBracket = (teams, settings) => {
    let powerOf2 = 2;
    while (powerOf2 < teams.length) powerOf2 *= 2;

    const totalByes = powerOf2 - teams.length;
    const bracketTeams = [...teams];
    
    // Tambah Tim Bye dengan ID unik
    for (let i = 0; i < totalByes; i++) {
        bracketTeams.push({ id: `bye-ghost-${i}`, name: 'BYE', isBye: true });
    }

    const matches = [];
    let matchCounter = 1;

    // GENERATE ROUND 1
    const round1Pairs = [];
    for (let i = 0; i < bracketTeams.length; i += 2) {
        round1Pairs.push({ home: bracketTeams[i], away: bracketTeams[i+1] });
    }

    round1Pairs.forEach(pair => {
        // Cek apakah ini match Bye
        const isByeMatch = pair.home.isBye || pair.away.isBye;
        
        // Logika Skor Otomatis:
        // Jika Home Bye -> Away Menang 3-0
        // Jika Away Bye -> Home Menang 3-0
        // Jika KEDUANYA Bye -> 0-0 tapi status Played (biar gak error penalti)
        
        let hScore = '', aScore = '';
        if (isByeMatch) {
            if (pair.home.isBye && pair.away.isBye) { hScore = 0; aScore = 0; }
            else if (pair.home.isBye) { hScore = 0; aScore = 3; }
            else if (pair.away.isBye) { hScore = 3; aScore = 0; }
        }

        // LEG 1
        matches.push({
            id: crypto.randomUUID(),
            matchNumber: matchCounter,
            round: 1, roundName: 'Round 1',
            homeId: pair.home.id, awayId: pair.away.id,
            homeScore: hScore, awayScore: aScore,
            isPlayed: isByeMatch, isByeMatch: isByeMatch, locked: false, leg: 1
        });

        // LEG 2
        if (settings.cupDoubleLeg) {
             matches.push({
                id: crypto.randomUUID(),
                matchNumber: matchCounter,
                round: 1, roundName: 'Round 1',
                homeId: pair.away.id, awayId: pair.home.id,
                homeScore: isByeMatch ? aScore : '', // Tukar skor
                awayScore: isByeMatch ? hScore : '',
                isPlayed: isByeMatch, isByeMatch: isByeMatch, locked: false, leg: 2
            });
        }
        matchCounter++;
    });

    // GENERATE ROUND SELANJUTNYA (PLACEHOLDERS)
    let currentMatchCount = round1Pairs.length;
    let round = 2;

    while (currentMatchCount > 1) {
        const nextMatchCount = currentMatchCount / 2;
        for (let i = 0; i < nextMatchCount; i++) {
            matches.push({
                id: crypto.randomUUID(),
                matchNumber: matchCounter,
                round: round, roundName: nextMatchCount === 1 ? 'Final' : `Round ${round}`,
                homeId: null, awayId: null,
                homeScore: '', awayScore: '',
                isPlayed: false, isByeMatch: false, locked: true, leg: 1
            });

            if (settings.cupDoubleLeg && nextMatchCount > 1) {
                matches.push({
                    id: crypto.randomUUID(),
                    matchNumber: matchCounter,
                    round: round, roundName: `Round ${round}`,
                    homeId: null, awayId: null,
                    homeScore: '', awayScore: '',
                    isPlayed: false, isByeMatch: false, locked: true, leg: 2
                });
            }
            matchCounter++;
        }
        currentMatchCount = nextMatchCount;
        round++;
    }

    return matches;
};

// --- FUNGSI INI YANG MEMPERBAIKI MASALAH ANDA ---
export const proceedCupRound = (currentMatches, teams, settings) => {
    // Filter hanya Leg 1
    const ties = currentMatches.filter(m => m.leg === 1);
    const winners = [];

    for (let match of ties) {
        // 1. CEK APAKAH INI MATCH HANTU (Bye vs Bye)
        // Jika ID mengandung 'bye', itu hantu.
        const isHomeBye = match.homeId && match.homeId.toString().toLowerCase().includes('bye');
        const isAwayBye = match.awayId && match.awayId.toString().toLowerCase().includes('bye');

        // KASUS A: HANTU vs HANTU (Match 4 Anda)
        // Langsung loloskan 'null' atau ID bye salah satu biar gak error penalti
        if (isHomeBye && isAwayBye) {
            winners.push(match.homeId); // Push si hantu biar struktur bracket terjaga
            continue; // Skip validasi skor
        }

        // KASUS B: TIM ASLI vs HANTU (Otomatis Lolos)
        if (isHomeBye || isAwayBye) {
            if (isHomeBye) winners.push(match.awayId);
            else winners.push(match.homeId);
            continue; // Skip validasi skor
        }

        // KASUS C: TIM ASLI vs TIM ASLI (Normal Match)
        if (!match.isPlayed) return { error: `Match ${match.matchNumber} (Leg 1) belum selesai!` };

        let hScore = parseInt(match.homeScore)||0;
        let aScore = parseInt(match.awayScore)||0;
        let homeId = match.homeId;
        let awayId = match.awayId;

        // Cek Leg 2
        if (settings.cupDoubleLeg && match.roundName !== 'Final') {
            const leg2 = currentMatches.find(m => m.matchNumber === match.matchNumber && m.leg === 2);
            if (!leg2) return { error: `Data Leg 2 untuk Match ${match.matchNumber} hilang!` };
            if (!leg2.isPlayed) return { error: `Match ${match.matchNumber} (Leg 2) belum selesai!` };

            const l1Home = hScore;
            const l1Away = aScore;
            const l2Home = parseInt(leg2.homeScore)||0; 
            const l2Away = parseInt(leg2.awayScore)||0;

            const aggHome = l1Home + l2Away; 
            const aggAway = l1Away + l2Home;

            if (aggHome > aggAway) winners.push(homeId);
            else if (aggAway > aggHome) winners.push(awayId);
            else {
                const hPen = parseInt(match.homePen || leg2.homePen || 0);
                const aPen = parseInt(match.awayPen || leg2.awayPen || 0);
                
                if (hPen > aPen) winners.push(homeId);
                else if (aPen > hPen) winners.push(awayId);
                else return { error: `Match ${match.matchNumber} Seri Agregat ${aggHome}-${aggAway}. Harap input skor Penalti!` };
            }
        } else {
            // Single Leg
            if (hScore > aScore) winners.push(homeId);
            else if (aScore > hScore) winners.push(awayId);
            else {
                const hPen = parseInt(match.homePen)||0;
                const aPen = parseInt(match.awayPen)||0;
                if (hPen > aPen) winners.push(homeId);
                else if (aPen > hPen) winners.push(awayId);
                else return { error: `Match ${match.matchNumber} Seri. Harap input skor Penalti!` };
            }
        }
    }

    if (ties.length === 1) return { winner: winners[0] };
    return { nextRoundFeed: winners };
};