'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import Button from '../Button/Button';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logoContainer} aria-label="Volver al inicio" onClick={closeMenu}>
          <span role="img" aria-label="tree">🎄</span>
        </Link>
        
        <Link href="/" className={styles.title} style={{ textDecoration: 'none', color: 'inherit' }} onClick={closeMenu}>
          Copa Navideña
        </Link>
      </div>

      {/* Hamburger Menu Button */}
      <button 
        className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}
        onClick={toggleMenu}
        aria-label="Menú"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
        <span className={styles.bar}></span>
      </button>

      {/* Navigation Links - Combined for simpler mobile handling */}
      <div 
        id="mobile-menu" 
        className={`${styles.navContent} ${isMenuOpen ? styles.menuOpen : ''}`}
      >
        <div className={styles.centerSection}>
          <Link href="/" className={styles.navItem} onClick={closeMenu}>Inicio</Link>
          <Link href="/equipos" className={styles.navItem} onClick={closeMenu}>Equipos</Link>
        </div>

        <div className={styles.rightSection}>
          <div onClick={closeMenu}>
            <Button href="/login" variant="primary" fullWidth>Login</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
