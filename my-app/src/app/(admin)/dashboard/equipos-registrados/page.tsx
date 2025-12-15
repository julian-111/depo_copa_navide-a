'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeams } from '@/app/actions/tournament';
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchTeams();
  }, []);

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
                <th>Estado</th>
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
                    <span className={styles.badge}>Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
