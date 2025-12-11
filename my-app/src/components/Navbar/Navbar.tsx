import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Button from '../Button/Button';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logoContainer} aria-label="Volver al inicio">
          <span role="img" aria-label="tree">🎄</span>
        </Link>
        
        <Link href="/" className={styles.title} style={{ textDecoration: 'none', color: 'inherit' }}>
          Copa Navideña
        </Link>
      </div>

      <div className={styles.centerSection}>
        <Link href="/" className={styles.navItem}>Inicio</Link>
        <Link href="/equipos" className={styles.navItem}>Equipos</Link>
      </div>

      <div className={styles.rightSection}>
        <Button href="/login" variant="primary">Login</Button>
      </div>
    </nav>
  );
};

export default Navbar;
