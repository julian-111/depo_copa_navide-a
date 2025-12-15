'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        <Link href="/dashboard/registro-equipo" className={styles.card}>
          <h2 className={styles.cardTitle}>Registro de Equipo</h2>
          <p className={styles.cardContent}>Inscribe nuevos equipos en el torneo.</p>
        </Link>
        <Link href="/dashboard/resultados" className={styles.card}>
          <h2 className={styles.cardTitle}>Resultados</h2>
          <p className={styles.cardContent}>Actualiza marcadores y estadísticas de los partidos.</p>
        </Link>
        <Link href="/dashboard/equipos-registrados" className={styles.card}>
          <h2 className={styles.cardTitle}>Equipos Registrados</h2>
          <p className={styles.cardContent}>Ver lista completa de equipos y sus detalles.</p>
        </Link>
        <Link href="/dashboard/programacion" className={styles.card}>
          <h2 className={styles.cardTitle}>Programación</h2>
          <p className={styles.cardContent}>Gestionar calendario y generar cruces de fases.</p>
        </Link>
        <Link href="/dashboard/partidos-jugados" className={styles.card}>
          <h2 className={styles.cardTitle}>Partidos Jugados</h2>
          <p className={styles.cardContent}>Historial de partidos y edición de resultados.</p>
        </Link>
      </div>
    </div>
  );
}
