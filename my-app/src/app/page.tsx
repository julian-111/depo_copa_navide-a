import styles from './page.module.css';

// Mock data for standings
const standingsData = [
  { id: 1, team: 'Renos FC', played: 5, won: 4, drawn: 1, lost: 0, points: 13 },
  { id: 2, team: 'Elfos United', played: 5, won: 3, drawn: 1, lost: 1, points: 10 },
  { id: 3, team: 'Grinch City', played: 5, won: 2, drawn: 2, lost: 1, points: 8 },
  { id: 4, team: 'Noel Stars', played: 5, won: 1, drawn: 1, lost: 3, points: 4 },
  { id: 5, team: 'Snow Strikers', played: 5, won: 0, drawn: 0, lost: 5, points: 0 },
];

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.decoration} style={{ top: '10%', left: '5%' }}>❄</div>
        <div className={styles.decoration} style={{ top: '20%', right: '10%' }}>⭐</div>
        
        <h1 className={styles.heroTitle}>¡Bienvenidos a la Copa Navideña!</h1>
        <p className={styles.heroSubtitle}>
          El torneo más festivo del año. Vive la pasión del fútbol con espíritu navideño.
        </p>
      </section>

      {/* Standings Table Section */}
      <section className={styles.section}>
        <div className={styles.tableContainer}>
          <h2 className={styles.sectionTitle}>
            <span>🏆</span> Tabla de Posiciones
          </h2>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.rank}>#</th>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>PG</th>
                  <th>PE</th>
                  <th>PP</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standingsData.map((row, index) => (
                  <tr key={row.id}>
                    <td className={styles.rank}>{index + 1}</td>
                    <td className={styles.teamName}>
                      <span>⚽</span> {row.team}
                    </td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td style={{ fontWeight: 'bold' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Tournament Phases Placeholder */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span>📅</span> Fases del Torneo
        </h2>
        <div className={styles.phasesContainer}>
          <div className={styles.phaseCard}>
            <span className={styles.phaseIcon}>🥅</span>
            <h3>Fase de Grupos</h3>
            <p>En Progreso</p>
          </div>
          <div className={styles.phaseCard}>
            <span className={styles.phaseIcon}>⚔️</span>
            <h3>Eliminatorias</h3>
            <p>Próximamente</p>
          </div>
          <div className={styles.phaseCard}>
            <span className={styles.phaseIcon}>🏆</span>
            <h3>Gran Final</h3>
            <p>24 de Diciembre</p>
          </div>
        </div>
      </section>
    </div>
  );
}
