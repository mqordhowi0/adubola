// src/hooks/useCompetition.js
import { useState, useEffect } from 'react';
import { 
    validateSetup, 
    generateLeagueSchedule, 
    generateCupBracket, 
    proceedCupRound, 
    shuffleArray 
} from '../logic';

export function useCompetition() {
    const [mode, setMode] = useState('setup'); 
    const [compType, setCompType] = useState('league');
    const [isSaved, setIsSaved] = useState(true);
    const [history, setHistory] = useState([]); 
    
    // BARU: State Nama Kompetisi
    const [competitionName, setCompetitionName] = useState('My Tournament'); 

    const [teams, setTeams] = useState([
        { id: '1', name: 'Tim 1', isBye: false },
        { id: '2', name: 'Tim 2', isBye: false },
        { id: '3', name: 'Tim 3', isBye: false },
    ]);
    
    const [settings, setSettings] = useState({
        winPoints: 3, drawPoints: 1, doubleLeg: true, 
        cupDoubleLeg: false, 
    });
    
    const [matches, setMatches] = useState([]);
    const [cupWinner, setCupWinner] = useState(null);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isSaved && mode === 'active') { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSaved, mode]);

    const addTeam = () => {
        let maxNum = 0;
        teams.forEach(t => {
            const match = t.name.match(/^Tim\s+(\d+)$/i);
            if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; }
        });
        const nextNum = maxNum + 1;
        setTeams([...teams, { id: crypto.randomUUID(), name: `Tim ${nextNum}`, isBye: false }]);
    };

    const removeTeam = (i) => { const n=[...teams]; n.splice(i,1); setTeams(n); };
    const updateTeamName = (i,v) => { const n=[...teams]; n[i].name=v; setTeams(n); };
    const randomizeTeams = () => setTeams(shuffleArray([...teams]));

    const startCompetition = () => {
        // Validasi Nama Kompetisi Kosong
        if (!competitionName.trim()) return alert("Nama Liga/Cup belum diisi!");

        const emptyName = teams.find(t => !t.name.trim());
        if (emptyName) return alert("Semua nama tim harus diisi!");
        
        const names = teams.map(t => t.name.trim().toLowerCase());
        const duplicate = names.find((name, index) => names.indexOf(name) !== index);
        if (duplicate) return alert(`Nama tim "${duplicate}" sudah ada!`);

        const err = validateSetup(teams);
        if(err) return alert(err);
        
        const cleanTeams = teams.map(t => ({...t, isBye: false}));
        if(compType === 'league') {
            setMatches(generateLeagueSchedule(cleanTeams, settings.doubleLeg));
        } else { 
            setMatches(generateCupBracket(cleanTeams, settings)); 
            setCupWinner(null); 
        }
        setMode('active'); setIsSaved(false); setHistory([]);
    };

    const updateScore = (matchId, field, value) => {
        if (value.includes('-')) return;
        setMatches(matches.map(m => {
            if (m.id === matchId && !m.locked) {
                const up = { ...m, [field]: value === '' ? '' : parseInt(value) };
                if (up.homeScore !== '' && up.awayScore !== '') up.isPlayed = true;
                else if (!up.isByeMatch) up.isPlayed = false;
                return up;
            }
            return m;
        }));
        setIsSaved(false);
    };

    const nextCupRound = () => {
        setHistory([...history, JSON.parse(JSON.stringify(matches))]); 
        const currentRoundNum = matches.filter(m => !m.locked && m.homeId).reduce((max, m) => Math.max(max, m.round), 1);
        const currentMatches = matches.filter(m => m.round === currentRoundNum);
        
        const result = proceedCupRound(currentMatches, teams, settings);
        
        if (result.error) {
            alert("⚠️ " + result.error);
            setHistory(h => h.slice(0, -1)); 
        } else if (result.winner) {
            const wName = teams.find(t => t.id === result.winner)?.name || "Unknown";
            setCupWinner(wName);
            setMatches(matches.map(m => ({...m, locked: true})));
            setIsSaved(false);
        } else if (result.nextRoundFeed) {
            const nextRoundNum = currentRoundNum + 1;
            const winners = result.nextRoundFeed;
            let nextMatches = matches.filter(m => m.round === nextRoundNum);
            const uniqueMatchNums = [...new Set(nextMatches.map(m => m.matchNumber))].sort((a,b) => a-b);
            let newMatchesState = [...matches];
            
            // Lock ronde sekarang
            newMatchesState = newMatchesState.map(m => m.round === currentRoundNum ? {...m, locked: true} : m);

            uniqueMatchNums.forEach((mNum, idx) => {
                const homeId = winners[idx * 2];
                const awayId = winners[idx * 2 + 1];
                const isHomeBye = homeId && homeId.toString().toLowerCase().includes('bye');
                const isAwayBye = awayId && awayId.toString().toLowerCase().includes('bye');
                const isNextMatchBye = isHomeBye || isAwayBye;
                
                let autoHomeScore = '', autoAwayScore = '';
                if (isNextMatchBye) {
                    if (isHomeBye && isAwayBye) { autoHomeScore = 0; autoAwayScore = 0; }
                    else if (isHomeBye) { autoHomeScore = 0; autoAwayScore = 3; } 
                    else if (isAwayBye) { autoHomeScore = 3; autoAwayScore = 0; } 
                }

                newMatchesState = newMatchesState.map(m => {
                    if (m.matchNumber === mNum && m.round === nextRoundNum) {
                        const realHomeId = m.leg === 2 ? awayId : homeId;
                        const realAwayId = m.leg === 2 ? homeId : awayId;
                        return {
                            ...m,
                            homeId: realHomeId, awayId: realAwayId,
                            locked: false,
                            isByeMatch: isNextMatchBye, isPlayed: isNextMatchBye,
                            homeScore: isNextMatchBye ? (m.leg===2 ? autoAwayScore : autoHomeScore) : '',
                            awayScore: isNextMatchBye ? (m.leg===2 ? autoHomeScore : autoAwayScore) : '',
                        };
                    }
                    return m;
                });
            });
            setMatches(newMatchesState);
            setIsSaved(false);
        }
    };

    const undoLastRound = () => {
        if(history.length===0) return;
        setMatches(history[history.length-1]);
        setHistory(history.slice(0,-1)); setCupWinner(null);
    };

    const reset = () => {
        if(confirm("Reset data?")) {
            setMode('setup'); setMatches([]); setCupWinner(null); setIsSaved(true);
            setTeams([{ id: '1', name: 'Tim 1' }, { id: '2', name: 'Tim 2' }, { id: '3', name: 'Tim 3' }]);
        }
    };

    const saveData = () => {
        // Include competitionName
        const data = { competitionName, teams, settings, matches, mode, compType, cupWinner };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `adubola-${compType}.json`; a.click(); setIsSaved(true);
    };

    const loadData = (e) => {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const d = JSON.parse(ev.target.result);
                setTeams(d.teams); setSettings(d.settings); setMatches(d.matches);
                setMode(d.mode); setCompType(d.compType||'league'); setCupWinner(d.cupWinner||null);
                // Load Name
                setCompetitionName(d.competitionName || 'My Tournament');
                setIsSaved(true); setHistory([]);
            } catch(err) { alert("File rusak!"); }
        }; reader.readAsText(file);
    };

    return {
        mode, setMode, compType, setCompType, isSaved, history,
        teams, settings, setSettings, matches, cupWinner, competitionName, setCompetitionName, // Export
        addTeam, removeTeam, updateTeamName, randomizeTeams,
        startCompetition, updateScore, nextCupRound, undoLastRound,
        reset, saveData, loadData
    };
}