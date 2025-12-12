'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import Button from '../../../../components/Button/Button';

// Mock Data
const MOCK_TEAMS = [
  { id: '1', name: 'Renos FC', players: [
    { id: 'p1', name: 'Rudolph Red', number: 9 },
    { id: 'p2', name: 'Dasher Fast', number: 7 },
    { id: 'p3', name: 'Comet Zoom', number: 10 },
    { id: 'p4', name: 'Vixen Cool', number: 5 },
  ]},
  { id: '2', name: 'Duendes United', players: [
    { id: 'p5', name: 'Buddy Elf', number: 11 },
    { id: 'p6', name: 'Winky Dinky', number: 8 },
    { id: 'p7', name: 'Alabaster Snow', number: 23 },
    { id: 'p8', name: 'Bushy Evergreen', number: 4 },
  ]},
  { id: '3', name: 'Santa\'s Helpers', players: [
    { id: 'p9', name: 'Mrs. Claus', number: 1 },
    { id: 'p10', name: 'Bernard Chief', number: 6 },
  ]},
  { id: '4', name: 'Grinch Team', players: [
    { id: 'p11', name: 'The Grinch', number: 99 },
    { id: 'p12', name: 'Max Dog', number: 0 },
  ]}
];

interface PlayerStats {
  goals: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  blueCards: number;
}

type MatchStats = Record<string, PlayerStats>;

export default function ResultadosPage() {
  const [homeTeamId, setHomeTeamId] = useState<string>(MOCK_TEAMS[0].id);
  const [awayTeamId, setAwayTeamId] = useState<string>(MOCK_TEAMS[1].id);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [stats, setStats] = useState<MatchStats>({});

  const homeTeam = MOCK_TEAMS.find(t => t.id === homeTeamId);
  const awayTeam = MOCK_TEAMS.find(t => t.id === awayTeamId);

  const getPlayerStats = (playerId: string): PlayerStats => {
    return stats[playerId] || { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, blueCards: 0 };
  };

  const updateStat = (playerId: string, field: keyof PlayerStats, value: number) => {
    setStats(prev => {
      const current = prev[playerId] || { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, blueCards: 0 };
      const newValue = Math.max(0, current[field] + value);
      return {
        ...prev,
        [playerId]: { ...current, [field]: newValue }
      };
    });
  };

  const handleSave = () => {
    const matchResult = {
      homeTeam: homeTeam?.name,
      awayTeam: awayTeam?.name,
      score: `${homeScore} - ${awayScore}`,
      details: stats
    };
    console.log('Saving Match Result:', matchResult);
    alert('Resultado guardado correctamente (Simulación)');
  };

  const renderPlayerCard = (player: { id: string, name: string, number: number }) => {
    const pStats = getPlayerStats(player.id);
    return (
      <div key={player.id} className={styles.playerCard}>
        <div className={styles.playerInfo}>
          <span className={styles.playerName}>{player.name}</span>
          <span className={styles.playerNumber}>
            <i className={`fas fa-tshirt ${styles.icon}`}></i>
            {player.number}
          </span>
        </div>
        <div className={styles.statsControls}>
          <div className={styles.statGroup}>
            <span className={styles.statLabel}>Goles</span>
            <div className={styles.counter}>
              <button className={styles.counterBtn} onClick={() => updateStat(player.id, 'goals', -1)}>-</button>
              <span className={styles.countValue}>{pStats.goals}</span>
              <button className={styles.counterBtn} onClick={() => updateStat(player.id, 'goals', 1)}>+</button>
            </div>
          </div>
          <div className={styles.statGroup}>
            <span className={styles.statLabel}>Faltas</span>
            <div className={styles.counter}>
              <button className={styles.counterBtn} onClick={() => updateStat(player.id, 'fouls', -1)}>-</button>
              <span className={styles.countValue}>{pStats.fouls}</span>
              <button className={styles.counterBtn} onClick={() => updateStat(player.id, 'fouls', 1)}>+</button>
            </div>
          </div>
          <div className={styles.cardsGroup}>
            <button 
              className={`${styles.cardBtn} ${styles.yellowCard}`} 
              onClick={() => updateStat(player.id, 'yellowCards', 1)}
              title="Tarjeta Amarilla"
            >
              {pStats.yellowCards > 0 && <span className={styles.cardCount}>{pStats.yellowCards}</span>}
            </button>
            <button 
              className={`${styles.cardBtn} ${styles.blueCard}`} 
              onClick={() => updateStat(player.id, 'blueCards', 1)}
              title="Tarjeta Azul"
            >
              {pStats.blueCards > 0 && <span className={styles.cardCount}>{pStats.blueCards}</span>}
            </button>
            <button 
              className={`${styles.cardBtn} ${styles.redCard}`} 
              onClick={() => updateStat(player.id, 'redCards', 1)}
              title="Tarjeta Roja"
            >
              {pStats.redCards > 0 && <span className={styles.cardCount}>{pStats.redCards}</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Resultados</h1>
        <p className={styles.subtitle}>Panel Oficial de Control de Partidos</p>
      </header>

      {/* General Match Info */}
      <section className={styles.glassPanel}>
        <div className={styles.matchControl}>
          <div className={styles.teamSelect}>
            <label className={styles.label}>
              <i className="fas fa-home"></i> Equipo Local
            </label>
            <select 
              className={styles.select} 
              value={homeTeamId} 
              onChange={(e) => setHomeTeamId(e.target.value)}
            >
              {MOCK_TEAMS.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === awayTeamId}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.scoreBoard}>
            <input 
              type="number" 
              className={styles.scoreInput} 
              value={homeScore}
              onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className={styles.vs}>VS</span>
            <input 
              type="number" 
              className={styles.scoreInput} 
              value={awayScore}
              onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className={styles.teamSelect}>
            <label className={styles.label}>
              <i className="fas fa-plane"></i> Equipo Visitante
            </label>
            <select 
              className={styles.select} 
              value={awayTeamId} 
              onChange={(e) => setAwayTeamId(e.target.value)}
            >
              {MOCK_TEAMS.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Detailed Stats */}
      <div className={styles.teamsContainer}>
        {/* Home Team Column */}
        <div className={styles.teamColumn}>
          <div className={styles.teamHeader}>
            <h2>{homeTeam?.name}</h2>
          </div>
          {homeTeam?.players.map(renderPlayerCard)}
        </div>

        {/* Away Team Column */}
        <div className={styles.teamColumn}>
          <div className={styles.teamHeader}>
            <h2>{awayTeam?.name}</h2>
          </div>
          {awayTeam?.players.map(renderPlayerCard)}
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSave} variant="primary" size="large">Guardar Resultado Oficial</Button>
      </div>
    </div>
  );
}
