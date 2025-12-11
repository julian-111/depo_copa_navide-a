import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logoContainer} aria-label="Volver al inicio">
        {/* Placeholder for logo */}
        <span role="img" aria-label="tree">🎄</span>
      </Link>
      
      <div className={styles.brand}>
        <Link href="/" className={styles.title} style={{ textDecoration: 'none', color: 'inherit' }}>
          Copa Navideña
        </Link>
      </div>

      <div className={styles.navLinks}>
        <Link href="/" className={styles.navItem}>Inicio</Link>
        <Link href="/tournament" className={styles.navItem}>Torneo</Link>
        <Link href="/teams" className={styles.navItem}>Equipos</Link>
      </div>
    </nav>
  );
};

export default Navbar;
