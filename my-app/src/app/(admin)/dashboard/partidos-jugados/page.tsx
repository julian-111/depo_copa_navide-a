'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getPlayedMatches, updateMatchScore } from '@/app/actions/tournament';

export default function PartidosJugadosPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scores, setScores] = useState({ home: 0, away: 0 });

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    const result = await getPlayedMatches();
    if (result.success && result.data) {
      setMatches(result.data);
    }
    setLoading(false);
  }

  const handleEdit = (match: any) => {
    setEditingId(match.id);
    setScores({ home: match.homeScore, away: match.awayScore });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (matchId: string) => {
    if (confirm('¿Estás seguro de actualizar este resultado? Esto recalculará la tabla de posiciones.')) {
      const result = await updateMatchScore(matchId, scores.home, scores.away);
      if (result.success) {
        alert('Marcador actualizado correctamente');
        setEditingId(null);
        loadMatches();
      } else {
        alert(result.error || 'Error al actualizar');
      }
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
        ← Volver al Panel
      </Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Partidos Jugados</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Historial y edición de resultados</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Cargando...</div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No hay partidos jugados aún.</div>
      ) : (
        <div className={styles.grid}>
          {matches.map(match => (
            <div key={match.id} className={styles.matchCard} style={{ position: 'relative' }}>
              <span className={styles.date}>
                {match.date ? new Date(match.date).toLocaleDateString() : 'Fecha por definir'}
              </span>
              <span className={styles.phase}>{match.phase}</span>
              
              <div className={styles.matchInfo}>
                <span className={styles.teamName} style={{ textAlign: 'right' }}>{match.homeTeam.name}</span>
                
                {editingId === match.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={scores.home}
                      onChange={(e) => setScores({...scores, home: parseInt(e.target.value) || 0})}
                    />
                    <span>-</span>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={scores.away}
                      onChange={(e) => setScores({...scores, away: parseInt(e.target.value) || 0})}
                    />
                  </div>
                ) : (
                  <div className={styles.score}>
                    {match.homeScore} - {match.awayScore}
                  </div>
                )}
                
                <span className={styles.teamName} style={{ textAlign: 'left' }}>{match.awayTeam.name}</span>
              </div>

              <div className={styles.actions}>
                {editingId === match.id ? (
                  <>
                    <button className={styles.saveBtn} onClick={() => handleSave(match.id)}>✓</button>
                    <button className={styles.cancelBtn} onClick={handleCancel}>✕</button>
                  </>
                ) : (
                  <button className={styles.editBtn} onClick={() => handleEdit(match)}>✎ Editar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}