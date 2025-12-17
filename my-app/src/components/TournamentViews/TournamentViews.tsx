'use client';

import React, { useState, useEffect } from 'react';
import styles from './TournamentViews.module.css';
import { Prisma } from '@prisma/client';
import TournamentBracket from '../TournamentBracket/TournamentBracket';

// Definir tipos
type TeamWithStats = Prisma.TeamGetPayload<{
  include: {
    stats: true;
  };
}>;

type MatchWithTeams = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
  };
}>;

interface Props {
  standings: TeamWithStats[];
  knockoutMatches: MatchWithTeams[];
  initialView?: 'table' | 'bracket';
}

export default function TournamentViews({ standings, knockoutMatches, initialView = 'table' }: Props) {
  const [activeView, setActiveView] = useState<'table' | 'bracket'>(initialView);
  const [isAnimating, setIsAnimating] = useState(false);

  // Efecto para manejar la transición
  const handleViewChange = (view: 'table' | 'bracket') => {
    if (view === activeView) return;
    
    // Iniciar animación de salida
    setIsAnimating(true);
    
    // Cambiar vista después de un breve delay para permitir que el CSS actúe
    // Pero para React, cambiamos el estado y usamos CSS para ocultar/mostrar con opacidad
    setTimeout(() => {
      setActiveView(view);
      // La animación de entrada ocurre automáticamente al cambiar el renderizado
      // pero mantenemos el flag un momento más si queremos controlar clases CSS específicas
      setTimeout(() => setIsAnimating(false), 50);
    }, 300); // 300ms coincide con la transición CSS
  };

  return (
    <div className={styles.cardContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {activeView === 'table' && !isAnimating ? 'Tabla de Posiciones' : 
           activeView === 'bracket' && !isAnimating ? 'Fase Eliminatoria' : 
           'Torneo'}
        </h2>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeView === 'table' ? styles.activeTab : ''}`}
            onClick={() => handleViewChange('table')}
          >
            Grupos
          </button>
          <button 
            className={`${styles.tabBtn} ${activeView === 'bracket' ? styles.activeTab : ''}`}
            onClick={() => handleViewChange('bracket')}
          >
            Eliminatorias
          </button>
        </div>
      </div>

      <div className={styles.contentContainer}>
        {/* Usamos renderizado condicional con clases para la animación */}
        {/* Renderizamos ambos pero ocultamos uno con CSS para transiciones suaves si fuera absolute */}
        {/* Para simplificar y evitar problemas de altura, renderizaremos uno a la vez con fade */}
        
        <div className={`${styles.content} ${!isAnimating ? styles.fadeIn : styles.fadeOut}`}>
          {activeView === 'table' ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                    <th>PP</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings && standings.length > 0 ? (
                    standings.map((team, index) => (
                      <tr key={team.id}>
                        <td data-label="#">{index + 1}</td>
                        <td className={styles.teamNameCell} data-label="Equipo">
                          <span className={styles.teamName}>{team.name}</span>
                        </td>
                        <td data-label="PJ">{team.stats?.played || 0}</td>
                        <td data-label="PG">{team.stats?.won || 0}</td>
                        <td data-label="PE">{team.stats?.drawn || 0}</td>
                        <td data-label="PP">{team.stats?.lost || 0}</td>
                        <td className={styles.pointsCell} data-label="Puntos">{team.stats?.points || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.emptyState}>
                          <span className={styles.emptyIcon}>❄️</span>
                          <h3>Aún no hay equipos registrados</h3>
                          <p>La tabla de posiciones se actualizará automáticamente cuando comience el torneo.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.bracketWrapper}>
              <TournamentBracket matches={knockoutMatches} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
