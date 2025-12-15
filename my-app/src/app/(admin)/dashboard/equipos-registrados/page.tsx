'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTeams, deleteTeam } from '@/app/actions/tournament';
import styles from './page.module.css';

interface Team {
  id: string;
  name: string;
  coach: string;
  phone: string;
  category: string;
  players: any[];
}

export default function RegisteredTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectTeam, setInspectTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const result = await getTeams();
      if (result.success && result.data) {
        setTeams(result.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (teamId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const result = await deleteTeam(teamId);
      if (result.success) {
        alert('Equipo eliminado correctamente');
        fetchTeams(); // Recargar la lista
      } else {
        alert(result.error || 'Error al eliminar el equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    }
  };

  const handleEdit = (teamId: string) => {
    router.push(`/dashboard/editar-equipo/${teamId}`);
  };

  const handleInspect = (team: Team) => {
    setInspectTeam(team);
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backLink}>
        ← Volver al Panel
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Equipos Registrados</h1>
          <p className={styles.subtitle}>Listado completo de equipos en el sistema</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.emptyState}>Cargando equipos...</div>
      ) : teams.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay equipos registrados aún.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Delegado</th>
                <th>Contacto</th>
                <th>Categoría</th>
                <th>Jugadores</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <div className={styles.teamName}>
                      {team.name}
                    </div>
                  </td>
                  <td>{team.coach}</td>
                  <td>{team.phone}</td>
                  <td>{team.category}</td>
                  <td>{team.players.length}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.inspectBtn}`}
                        onClick={() => handleInspect(team)}
                        title="Inspeccionar Jugadores"
                      >
                        <i className="fas fa-eye"></i> 👁️
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => handleEdit(team.id)}
                        title="Editar Equipo"
                      >
                        <i className="fas fa-edit"></i> ✏️
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(team.id)}
                        title="Eliminar Equipo"
                      >
                        <i className="fas fa-trash"></i> 🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Inspección */}
      {inspectTeam && (
        <div className={styles.modalOverlay} onClick={() => setInspectTeam(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{inspectTeam.name}</h2>
              <button className={styles.closeBtn} onClick={() => setInspectTeam(null)}>×</button>
            </div>
            
            <div className={styles.modalContent}>
              <h3 style={{ color: '#9ca3af', marginBottom: '1rem' }}>Lista de Jugadores</h3>
              {inspectTeam.players.length > 0 ? (
                <ul className={styles.playerList}>
                  {inspectTeam.players.map((player: any) => (
                    <li key={player.id} className={styles.playerItem}>
                      <span>
                        <span className={styles.playerNumber}>{player.number}</span>
                        {player.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay jugadores registrados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
