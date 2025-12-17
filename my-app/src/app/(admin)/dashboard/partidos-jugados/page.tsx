'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getPlayedMatches } from '@/app/actions/tournament';
import EditMatchModal from '@/components/EditMatchModal/EditMatchModal';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  date: string | Date | null;
  phase: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
}

export default function PartidosJugadosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const result = await getPlayedMatches();
    if (result.success && result.data) {
      setMatches(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleEdit = (matchId: string) => {
    setSelectedMatchId(matchId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMatchId(null);
  };

  const handleModalSave = () => {
    loadMatches(); // Reload matches to show updated scores
  };

  const filteredMatches = matches.filter(match => 
    match.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    match.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
        ← Volver al Panel
      </Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Partidos Jugados</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Historial y edición de resultados</p>
      </header>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar por nombre de equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Cargando...</div>
      ) : filteredMatches.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          {searchTerm ? 'No se encontraron partidos para esa búsqueda.' : 'No hay partidos jugados aún.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredMatches.map(match => (
            <div key={match.id} className={styles.matchCard}>
              <span className={styles.date}>
                {match.date ? new Date(match.date).toLocaleDateString() : 'Fecha por definir'}
              </span>
              <span className={styles.phase}>{match.phase}</span>
              
              <div className={styles.matchInfo}>
                <span className={styles.teamName} style={{ textAlign: 'right' }}>{match.homeTeam.name}</span>
                
                <div className={styles.score}>
                  {match.homeScore} - {match.awayScore}
                </div>
                
                <span className={styles.teamName} style={{ textAlign: 'left' }}>{match.awayTeam.name}</span>
              </div>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(match.id)}>✎ Editar Completo</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMatchId && (
        <EditMatchModal 
          matchId={selectedMatchId} 
          isOpen={isModalOpen} 
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}