// src/components/league/League.jsx
import React from 'react';
import { calculateLeagueStandings } from '../../logic';

const League = ({ teams, matches, settings }) => {
  const standings = calculateLeagueStandings(teams, matches, settings);

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      {/* Container Table dengan Scroll Horizontal */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              {/* STICKY COLUMN 1: Peringkat */}
              <th className="p-4 w-12 text-center sticky left-0 bg-slate-950 z-20 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                #
              </th>
              
              {/* STICKY COLUMN 2: Nama Tim */}
              <th className="p-4 sticky left-12 bg-slate-950 z-20 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)] min-w-[150px]">
                TIM
              </th>

              {/* DATA SCROLLABLE (Tidak ada yang di-hidden lagi) */}
              <th className="p-4 text-center w-12 bg-slate-900/50">MAIN</th>
              <th className="p-4 text-center w-12 text-emerald-500/70">M</th>
              <th className="p-4 text-center w-12 text-slate-500/70">S</th>
              <th className="p-4 text-center w-12 text-red-500/70">K</th>
              <th className="p-4 text-center w-12 text-slate-400">GM</th>
              <th className="p-4 text-center w-12 text-slate-400">GK</th>
              <th className="p-4 text-center w-12 text-slate-200">SG</th>
              <th className="p-4 text-center min-w-[100px]">FORM</th>
              <th className="p-4 text-center w-20 sticky right-0 bg-slate-950 z-20 border-l border-slate-800 shadow-[-2px_0_5px_rgba(0,0,0,0.5)]">
                POIN
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {standings.map((team, index) => {
              // Styling khusus Top 3
              let rankStyle = "text-slate-500";
              let rowBg = "hover:bg-slate-800/50";
              let rankBg = "bg-slate-900"; // Default bg for sticky cols
              
              if (index === 0) {
                 rankStyle = "text-yellow-400 bg-yellow-900/20 rounded border border-yellow-700/30";
                 rowBg = "bg-gradient-to-r from-yellow-900/10 to-transparent hover:from-yellow-900/20";
                 rankBg = "bg-slate-900"; 
              } else if (index === 1) {
                 rankStyle = "text-slate-300 bg-slate-700/30 rounded";
              } else if (index === 2) {
                 rankStyle = "text-orange-400 bg-orange-900/20 rounded";
              }

              return (
                <tr key={team.id} className={`transition-colors ${rowBg}`}>
                  {/* Rank (Sticky Left) */}
                  <td className={`p-3 text-center font-mono font-bold sticky left-0 z-10 border-r border-slate-800 ${rankBg}`}>
                    <span className={`inline-block w-6 h-6 leading-6 text-xs ${rankStyle}`}>{index + 1}</span>
                  </td>
                  
                  {/* Nama Tim (Sticky Left) */}
                  <td className={`p-3 font-bold text-white sticky left-12 z-10 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] ${rankBg}`}>
                    <div className="flex items-center gap-2">
                        {team.name}
                        {index === 0 && <span className="text-[10px] animate-pulse">👑</span>}
                    </div>
                  </td>
                  
                  {/* Stats (Scrollable) */}
                  <td className="p-3 text-center text-slate-300 font-mono">{team.played}</td>
                  <td className="p-3 text-center text-emerald-400 font-mono bg-emerald-900/5">{team.won}</td>
                  <td className="p-3 text-center text-slate-500 font-mono">{team.drawn}</td>
                  <td className="p-3 text-center text-red-400 font-mono bg-red-900/5">{team.lost}</td>
                  <td className="p-3 text-center text-slate-400 text-xs">{team.gf}</td>
                  <td className="p-3 text-center text-slate-400 text-xs">{team.ga}</td>
                  <td className="p-3 text-center font-bold text-slate-200">
                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                  </td>
                  
                  {/* Form (W/D/L) */}
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      {team.form.slice(-5).map((f, i) => (
                        <span key={i} className={`
                          w-2 h-2 rounded-sm 
                          ${f === 'W' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : f === 'D' ? 'bg-slate-600' : 'bg-red-500'}
                        `} title={f}></span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Points (Sticky Right - Agar user selalu liat poin walau scroll jauh) */}
                  <td className={`p-3 text-center sticky right-0 z-10 border-l border-slate-800 ${rankBg}`}>
                    <span className="inline-block px-3 py-1 bg-slate-800 text-white font-bold rounded border border-slate-600 shadow-lg min-w-[3rem]">
                        {team.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {standings.length === 0 && (
          <div className="p-10 text-center text-slate-500 italic">Belum ada pertandingan yang dimainkan.</div>
      )}
    </div>
  );
};

export default League;