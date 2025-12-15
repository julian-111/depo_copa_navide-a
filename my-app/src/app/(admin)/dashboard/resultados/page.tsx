'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import Button from '../../../../components/Button/Button';
import { getTeams, saveMatchResult, getAllScheduledMatches } from '@/app/actions/tournament';

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

interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  date: Date | null;
  phase: string;
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
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [stats, setStats] = useState<MatchStats>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [teamsResult, matchesResult] = await Promise.all([
          getTeams(),
          getAllScheduledMatches()
        ]);

        if (teamsResult.success && teamsResult.data) {
          setTeams(teamsResult.data);
        }

        if (matchesResult.success && matchesResult.data) {
          setScheduledMatches(matchesResult.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Derived state based on selected match
  const selectedMatch = scheduledMatches.find(m => m.id === selectedMatchId);
  const homeTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.homeTeamId) : null;
  const awayTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.awayTeamId) : null;

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
    if (!selectedMatch || !homeTeam || !awayTeam) return;

    setSaving(true);
    try {
      const result = await saveMatchResult({
        matchId: selectedMatch.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore,
        awayScore,
        playerStats: stats
      });

      if (result.success) {
        alert('Resultado guardado correctamente');
        // Remove the processed match from the list
        setScheduledMatches(prev => prev.filter(m => m.id !== selectedMatch.id));
        setSelectedMatchId('');
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
    return <div className={styles.container}>Cargando información...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Resultados</h1>
        <p className={styles.subtitle}>Panel Oficial de Control de Partidos</p>
      </header>

      {scheduledMatches.length === 0 ? (
        <div className={styles.glassPanel} style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem' }}></i>
          <h2>No hay partidos programados</h2>
          <p style={{ color: '#9ca3af' }}>
            Para gestionar resultados, primero debes programar partidos en el módulo de 
            <a href="/dashboard/programacion" style={{ color: '#60a5fa', marginLeft: '5px', textDecoration: 'none' }}>Programación</a>.
          </p>
        </div>
      ) : (
        <>
          <section className={styles.glassPanel}>
            <div className={styles.matchSelector}>
              <label className={styles.label}>Seleccionar Partido a Jugar:</label>
              <select 
                className={styles.select}
                value={selectedMatchId}
                onChange={(e) => {
                  setSelectedMatchId(e.target.value);
                  setHomeScore(0);
                  setAwayScore(0);
                  setStats({});
                }}
              >
                <option value="">-- Seleccione un partido --</option>
                {scheduledMatches.map(match => (
                  <option key={match.id} value={match.id}>
                    {match.homeTeam.name} vs {match.awayTeam.name} - {match.date ? new Date(match.date).toLocaleDateString() : 'Pendiente'} ({match.phase})
                  </option>
                ))}
              </select>
            </div>
          </section>

          {selectedMatch && homeTeam && awayTeam && (
            <>
              {/* Score Control */}
              <section className={styles.glassPanel}>
                <div className={styles.matchControl}>
                  <div className={styles.teamNameDisplay}>
                    <i className="fas fa-home"></i> {homeTeam.name}
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

                  <div className={styles.teamNameDisplay}>
                    {awayTeam.name} <i className="fas fa-plane"></i>
                  </div>
                </div>
              </section>

              {/* Detailed Stats */}
              <div className={styles.teamsContainer}>
                {/* Home Team Column */}
                <div className={styles.teamColumn}>
                  <div className={styles.teamHeader}>
                    <h2>{homeTeam.name}</h2>
                  </div>
                  {homeTeam.players.length > 0 ? (
                    homeTeam.players.map(renderPlayerCard)
                  ) : (
                    <p className={styles.noPlayers}>No hay jugadores registrados</p>
                  )}
                </div>

                {/* Away Team Column */}
                <div className={styles.teamColumn}>
                  <div className={styles.teamHeader}>
                    <h2>{awayTeam.name}</h2>
                  </div>
                  {awayTeam.players.length > 0 ? (
                    awayTeam.players.map(renderPlayerCard)
                  ) : (
                    <p className={styles.noPlayers}>No hay jugadores registrados</p>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <Button 
                  onClick={handleSave} 
                  variant="primary" 
                  size="large"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Finalizar Partido y Guardar'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}