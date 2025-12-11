'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../../components/Button/Button';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verificación simple de sesión
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    router.push('/login');
  };

  if (!isAuthorized) {
    return null; // O un loading spinner
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel de Administración</h1>
        <Button variant="outline" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Torneos Activos</h2>
          <p className={styles.cardContent}>Gestiona los torneos en curso y sus configuraciones.</p>
        </div>
        
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Equipos</h2>
          <p className={styles.cardContent}>Administra los registros de equipos y jugadores.</p>
        </div>
        
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Resultados</h2>
          <p className={styles.cardContent}>Actualiza marcadores y estadísticas de los partidos.</p>
        </div>
      </div>
    </div>
  );
}
