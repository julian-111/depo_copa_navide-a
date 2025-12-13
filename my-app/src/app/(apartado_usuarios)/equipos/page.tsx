import styles from './page.module.css';
import { getTeams } from '@/app/actions/tournament';

export default async function TeamsPage() {
  const { data: teams } = await getTeams();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Equipos Participantes</h1>
      
      <div className={styles.grid}>
        {teams && teams.length > 0 ? (
          teams.map((team, index) => (
            <div 
              key={team.id} 
              className={styles.teamCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.teamHeader}>
                <div className={styles.iconWrapper}>
                  {/* Usamos un icono por defecto si no hay uno específico */}
                  <span className={styles.icon}>⚽</span>
                </div>
                <h2 className={styles.teamName}>{team.name}</h2>
              </div>
              
              <div className={styles.teamContent}>
                <h3 className={styles.membersTitle}>Jugadores</h3>
                <ul className={styles.membersList}>
                  {team.players.map((player) => (
                    <li key={player.id} className={styles.memberItem}>
                      <span className={styles.bullet}>•</span>
                      {player.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noTeams}>
            <p>Aún no hay equipos registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
