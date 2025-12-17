import Link from 'next/link';
import styles from './page.module.css';
import Button from '../../components/Button/Button';
import { getStandings, getTopScorer, getBestDefense, getUpcomingMatches, getCurrentPhase, getMatchesByPhase, getKnockoutMatches } from '@/app/actions/tournament';
import { Prisma } from '@prisma/client';
import TournamentBracket from '@/components/TournamentBracket/TournamentBracket';

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

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  const { data: standings } = await getStandings();
  const { data: topScorers } = await getTopScorer();
  const { data: bestDefenses } = await getBestDefense();
  const { data: upcomingMatches } = await getUpcomingMatches();
  const { data: currentPhase } = await getCurrentPhase();

  // Determine view mode (Table vs Bracket)
  const isKnockout = currentPhase && ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].includes(currentPhase);
  const viewParam = searchParams?.view;
  
  let activeView = 'table';
  if (viewParam === 'bracket') activeView = 'bracket';
  else if (viewParam === 'table') activeView = 'table';
  else if (isKnockout) activeView = 'bracket';

  let knockoutMatches: MatchWithTeams[] = [];

  if (activeView === 'bracket' || isKnockout) {
    const resKnockout = await getKnockoutMatches();
    if (resKnockout.success && resKnockout.data) knockoutMatches = resKnockout.data;
  }

  const formatPhaseName = (phase: string) => {
    switch(phase) {
      case 'QUARTER_FINAL': return 'Cuartos de Final';
      case 'SEMI_FINAL': return 'Semifinales';
      case 'FINAL': return 'Gran Final';
      default: return phase;
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Copa Navideña</h1>
          <p className={styles.heroSubtitle}>
            Vive la emoción del fútbol. Sigue a tu equipo favorito, consulta los resultados 
            y no te pierdas ningún detalle del torneo más importante del año.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outline" href="/equipos">Equipos</Button>
          </div>
        </div>
      </section>

      {/* Dynamic Main Section: Table or Bracket */}
      <section className={styles.section}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>
            {activeView === 'table' ? 'Tabla de Posiciones' : 'Fase Eliminatoria'}
          </h2>
          <div className={styles.tabs}>
            <Link 
              href="/?view=table" 
              className={`${styles.tab} ${activeView === 'table' ? styles.activeTab : ''}`}
              scroll={false}
            >
              Grupos
            </Link>
            <Link 
              href="/?view=bracket" 
              className={`${styles.tab} ${activeView === 'bracket' ? styles.activeTab : ''}`}
              scroll={false}
            >
              Eliminatorias
            </Link>
          </div>
        </div>
        
        {activeView === 'table' ? (
          <div className={styles.tableContainer}>
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
                    standings.map((team: TeamWithStats, index: number) => (
                      <tr key={team.id}>
                        <td>{index + 1}</td>
                        <td className={styles.teamNameCell}>
                          <span className={styles.teamName}>{team.name}</span>
                        </td>
                        <td>{team.stats?.played || 0}</td>
                        <td>{team.stats?.won || 0}</td>
                        <td>{team.stats?.drawn || 0}</td>
                        <td>{team.stats?.lost || 0}</td>
                        <td className={styles.pointsCell}>{team.stats?.points || 0}</td>
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
          </div>
        ) : (
          <div className={styles.bracketWrapper}>
             <TournamentBracket matches={knockoutMatches} />
          </div>
        )}
      </section>

      {/* Tournament Highlights Section */}
      <section className={styles.section}>
        <div className={styles.highlightsGrid}>
          {/* Goleador */}
          <div className={`${styles.glass} ${styles.highlightCard}`}>
            <h3 className={styles.highlightTitle}>Goleadores del Torneo</h3>
            <div className={styles.matchesList} style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {topScorers && topScorers.length > 0 ? (
                topScorers.map((scorer, index) => (
                  <div key={scorer.id} className={styles.matchItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#F8B229', width: '20px' }}>#{index + 1}</span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{scorer.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{scorer.team?.name}</div>
                      </div>
                    </div>
                    <span className={styles.highlightStat} style={{ fontSize: '1rem' }}>{scorer.goals} ⚽</span>
                  </div>
                ))
              ) : (
                <div className={styles.highlightContent}>
                  <p className={styles.noData}>Aún no hay jugadores con 5+ goles</p>
                </div>
              )}
            </div>
          </div>

          {/* Valla menos vencida */}
          <div className={`${styles.glass} ${styles.highlightCard}`}>
            <h3 className={styles.highlightTitle}>Valla Menos Vencida</h3>
            <div className={styles.matchesList} style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {bestDefenses && bestDefenses.length > 0 ? (
                bestDefenses.map((defense, index) => (
                  <div key={defense.id} className={styles.matchItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#F8B229', width: '20px' }}>#{index + 1}</span>
                      <div style={{ fontWeight: 'bold' }}>{defense.team?.name}</div>
                    </div>
                    <span className={styles.highlightStat} style={{ fontSize: '1rem' }}>{defense.goalsAgainst} 🛡️</span>
                  </div>
                ))
              ) : (
                <div className={styles.highlightContent}>
                  <p className={styles.noData}>Aún no hay vallas con &lt;=45 goles</p>
                </div>
              )}
            </div>
          </div>

          {/* Próximos Partidos */}
          <div className={`${styles.glass} ${styles.highlightCard}`}>
            <h3 className={styles.highlightTitle}>Próximos Partidos</h3>
            <div className={styles.matchesList}>
              {upcomingMatches && upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <div key={match.id} className={styles.matchItem}>
                    <div className={styles.matchTeams}>
                      <span>{match.homeTeam.name}</span>
                      <span className={styles.vs}>vs</span>
                      <span>{match.awayTeam.name}</span>
                    </div>
                    <span className={styles.matchDate}>
                      {match.date ? new Date(match.date).toLocaleString('es-CO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'America/Bogota'
                      }) : 'Fecha por definir'}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.noData}>No hay partidos programados</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Phases Placeholder */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>Fases del Torneo</h2>
        <div className={styles.phasesGrid}>
          <div className={`${styles.glass} ${styles.phaseCard}`}>
            <span className={styles.phaseIcon}>🏆</span>
            <h3>Fase de Grupos</h3>
            <p>Los equipos se enfrentarán en una liguilla para definir a los clasificados.</p>
          </div>
          <div className={`${styles.glass} ${styles.phaseCard}`}>
            <span className={styles.phaseIcon}>⚡</span>
            <h3>Eliminatorias</h3>
            <p>Partidos de eliminación directa donde solo los mejores avanzarán.</p>
          </div>
          <div className={`${styles.glass} ${styles.phaseCard}`}>
            <span className={styles.phaseIcon}>🌟</span>
            <h3>Gran Final</h3>
            <p>El partido decisivo que coronará al campeón de la Copa Navideña.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
