'use client';

import { useState, useEffect } from 'react';
import styles from './EditMatchModal.module.css';
import { getMatchDetails, saveMatchResult } from '@/app/actions/tournament';

interface EditMatchModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface PlayerStat {
  goals: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  blueCards: number;
}

  interface Team {
    id: string;
    name: string;
    players: Player[];
  }

  interface Player {
    id: string;
    name: string;
    number: number;
  }

  interface MatchData {
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Team;
    awayTeam: Team;
    playerStats: {
      playerId: string;
      goals: number;
      fouls: number;
      yellowCards: number;
      redCards: number;
      blueCards: number;
    }[];
  }

  export default function EditMatchModal({ matchId, isOpen, onClose, onSave }: EditMatchModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});

  useEffect(() => {
    async function loadMatchDetails() {
      setLoading(true);
      const result = await getMatchDetails(matchId);
      
      if (result.success && result.data) {
        const match = result.data;
        setMatchData(match);
        setHomeScore(match.homeScore || 0);
        setAwayScore(match.awayScore || 0);

        // Initialize stats map
        const statsMap: Record<string, PlayerStat> = {};
        
        // Pre-fill with existing stats
        match.playerStats.forEach((stat) => {
          statsMap[stat.playerId] = {
            goals: stat.goals,
            fouls: stat.fouls,
            yellowCards: stat.yellowCards,
            redCards: stat.redCards,
            blueCards: stat.blueCards,
          };
        });

        setPlayerStats(statsMap);
      } else {
        alert('Error al cargar los detalles del partido');
        onClose();
      }
      setLoading(false);
    }

    if (isOpen && matchId) {
      loadMatchDetails();
    }
  }, [isOpen, matchId, onClose]);

  const handleStatChange = (playerId: string, field: keyof PlayerStat, value: string) => {
    const numValue = parseInt(value) || 0;
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, blueCards: 0 }),
        [field]: numValue >= 0 ? numValue : 0
      }
    }));
  };

  const getStat = (playerId: string, field: keyof PlayerStat) => {
    return playerStats[playerId]?.[field] || 0;
  };

  const handleSave = async () => {
    if (!matchData) return;
    
    setSaving(true);
    try {
      const result = await saveMatchResult({
        matchId: matchId,
        homeTeamId: matchData.homeTeamId,
        awayTeamId: matchData.awayTeamId,
        homeScore: homeScore,
        awayScore: awayScore,
        playerStats: playerStats
      });

      if (result.success) {
        onSave();
        onClose();
      } else {
        alert(result.error || 'Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los cambios');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editar Resultado del Partido</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando detalles...</div>
          ) : matchData ? (
            <>
              <div className={styles.scoreSection}>
                <div className={styles.teamScore}>
                  <span className={styles.teamName}>{matchData.homeTeam.name}</span>
                  <input 
                    type="number" 
                    className={styles.scoreInput}
                    value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                  />
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</span>
                <div className={styles.teamScore}>
                  <input 
                    type="number" 
                    className={styles.scoreInput}
                    value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                  />
                  <span className={styles.teamName}>{matchData.awayTeam.name}</span>
                </div>
              </div>

              <div className={styles.teamsGrid}>
                {/* Home Team Players */}
                <div className={styles.teamColumn}>
                  <div className={styles.columnHeader}>Jugadores {matchData.homeTeam.name}</div>
                  <div className={styles.statHeader}>
                    <div style={{ textAlign: 'left' }}>Nombre</div>
                    <div className={styles.statLabel} title="Goles">⚽</div>
                    <div className={styles.statLabel} title="Faltas">🛑</div>
                    <div className={styles.statLabel} title="Amarillas">🟨</div>
                    <div className={styles.statLabel} title="Rojas">🟥</div>
                    <div className={styles.statLabel} title="Azules">🟦</div>
                  </div>
                  {matchData.homeTeam.players.map((player) => (
                    <div key={player.id} className={styles.playerRow}>
                      <div className={styles.playerName}>{player.number}. {player.name}</div>
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'goals')} onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'fouls')} onChange={(e) => handleStatChange(player.id, 'fouls', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'yellowCards')} onChange={(e) => handleStatChange(player.id, 'yellowCards', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'redCards')} onChange={(e) => handleStatChange(player.id, 'redCards', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'blueCards')} onChange={(e) => handleStatChange(player.id, 'blueCards', e.target.value)} />
                    </div>
                  ))}
                </div>

                {/* Away Team Players */}
                <div className={styles.teamColumn}>
                  <div className={styles.columnHeader}>Jugadores {matchData.awayTeam.name}</div>
                  <div className={styles.statHeader}>
                    <div style={{ textAlign: 'left' }}>Nombre</div>
                    <div className={styles.statLabel} title="Goles">⚽</div>
                    <div className={styles.statLabel} title="Faltas">🛑</div>
                    <div className={styles.statLabel} title="Amarillas">🟨</div>
                    <div className={styles.statLabel} title="Rojas">🟥</div>
                    <div className={styles.statLabel} title="Azules">🟦</div>
                  </div>
                  {matchData.awayTeam.players.map((player) => (
                    <div key={player.id} className={styles.playerRow}>
                      <div className={styles.playerName}>{player.number}. {player.name}</div>
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'goals')} onChange={(e) => handleStatChange(player.id, 'goals', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'fouls')} onChange={(e) => handleStatChange(player.id, 'fouls', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'yellowCards')} onChange={(e) => handleStatChange(player.id, 'yellowCards', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'redCards')} onChange={(e) => handleStatChange(player.id, 'redCards', e.target.value)} />
                      <input type="number" className={styles.statInput} value={getStat(player.id, 'blueCards')} onChange={(e) => handleStatChange(player.id, 'blueCards', e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>No se encontró información del partido.</div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
