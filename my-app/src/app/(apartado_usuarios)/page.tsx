import styles from './page.module.css';
import Button from '../../components/Button/Button';
import { getStandings, getTopScorer, getBestDefense, getUpcomingMatches } from '@/app/actions/tournament';
import { Prisma } from '@prisma/client';

type TeamWithStats = Prisma.TeamGetPayload<{
  include: {
    stats: true;
  };
}>;

export default async function Home() {
  const { data: standings } = await getStandings();
  const { data: topScorer } = await getTopScorer();
  const { data: bestDefense } = await getBestDefense();
  const { data: upcomingMatches } = await getUpcomingMatches();

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

      {/* Standings Table Section */}
      <section className={styles.section}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>Tabla de Posiciones</h2>
        </div>
        
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
      </section>

      {/* Tournament Highlights Section */}
      <section className={styles.section}>
        <div className={styles.highlightsGrid}>
          {/* Goleador */}
          <div className={`${styles.glass} ${styles.highlightCard}`}>
            <h3 className={styles.highlightTitle}>Goleador del Torneo</h3>
            <div className={styles.highlightContent}>
              <span className={styles.highlightIcon}>⚽</span>
              {topScorer ? (
                <>
                  <p className={styles.highlightName}>{topScorer.name}</p>
                  <p className={styles.highlightSubtext}>{topScorer.team?.name}</p>
                  <p className={styles.highlightStat}>{topScorer.goals} Goles</p>
                </>
              ) : (
                <p className={styles.noData}>Aún no hay registros</p>
              )}
            </div>
          </div>

          {/* Valla menos vencida */}
          <div className={`${styles.glass} ${styles.highlightCard}`}>
            <h3 className={styles.highlightTitle}>Valla Menos Vencida</h3>
            <div className={styles.highlightContent}>
              <span className={styles.highlightIcon}>🛡️</span>
              {bestDefense ? (
                <>
                  <p className={styles.highlightName}>{bestDefense.team?.name}</p>
                  <p className={styles.highlightStat}>{bestDefense.goalsAgainst} Goles en contra</p>
                </>
              ) : (
                <p className={styles.noData}>Aún no hay registros</p>
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
                      {match.date ? new Date(match.date).toLocaleDateString() : 'Fecha por definir'}
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
