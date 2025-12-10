import React from 'react';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer} aria-label="Logo Placeholder">
        {/* Placeholder for logo */}
        <span role="img" aria-label="tree">🎄</span>
      </div>
      
      <header>
        <h1 className={styles.title}>Copa Navideña</h1>
      </header>

      <div className={styles.navLinks}>
        <a href="#" className={styles.navItem}>Inicio</a>
        <a href="#" className={styles.navItem}>Torneo</a>
        <a href="#" className={styles.navItem}>Equipos</a>
      </div>
    </nav>
  );
};

export default Navbar;
