'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '../../../../components/Button/Button';
import { getTeams, saveMatchResult } from '@/app/actions/tournament';

// Types
interface Player {
  id: string;
  name: string;
  number: number;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface PlayerStats {
  goals: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  blueCards: number;
}

type MatchStats = Record<string, PlayerStats>;

export default function ResultadosPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [stats, setStats] = useState<MatchStats>({});

  useEffect(() => {
    async function loadTeams() {
      const result = await getTeams();
      if (result.success && result.data) {
        setTeams(result.data);
        if (result.data.length >= 2) {
          setHomeTeamId(result.data[0].id);
          setAwayTeamId(result.data[1].id);
        }
      }
      setLoading(false);
    }
    loadTeams();
  }, []);

  const homeTeam = teams.find(t => t.id === homeTeamId);
  const awayTeam = teams.find(t => t.id === awayTeamId);

  const getPlayerStats = (playerId: string): PlayerStats => {
    return stats[playerId] || { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, blueCards: 0 };
  };

  const updateStat = (playerId: string, field: keyof PlayerStats, value: number) => {
    setStats(prev => {
      const current = prev[playerId] || { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, blueCards: 0 };
      const newValue = Math.max(0, current[field] + value);
      
      // Update score if goals change
      if (field === 'goals') {
        const homePlayer = homeTeam?.players.find(p => p.id === playerId);
        const awayPlayer = awayTeam?.players.find(p => p.id === playerId);
        
        if (homePlayer) {
          setHomeScore(prevScore => Math.max(0, prevScore + value));
        } else if (awayPlayer) {
          setAwayScore(prevScore => Math.max(0, prevScore + value));
        }
      }

      return {
        ...prev,
        [playerId]: { ...current, [field]: newValue }
      };
    });
  };

  const handleSave = async () => {
    if (!homeTeam || !awayTeam) return;
    if (homeTeamId === awayTeamId) {
      alert('Por favor selecciona equipos diferentes');
      return;
    }

    setSaving(true);
    try {
      const result = await saveMatchResult({
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        playerStats: stats
      });

      if (result.success) {
        alert('Resultado guardado correctamente');
        // Reset form or redirect
        setHomeScore(0);
        setAwayScore(0);
        setStats({});
      } else {
        alert(result.error || 'Error al guardar el resultado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const renderPlayerCard = (player: Player) => {
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

  if (loading) {
    return <div className={styles.container}>Cargando equipos...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Resultados</h1>
        <p className={styles.subtitle}>Panel Oficial de Control de Partidos</p>
      </header>

      {teams.length < 2 ? (
        <div className={styles.glassPanel}>
          <p>Se necesitan al menos 2 equipos registrados para gestionar resultados.</p>
        </div>
      ) : (
        <>
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
                  {teams.map(team => (
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
                  {teams.map(team => (
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
            <Button 
              onClick={handleSave} 
              variant="primary" 
              size="large"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Resultado Oficial'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
