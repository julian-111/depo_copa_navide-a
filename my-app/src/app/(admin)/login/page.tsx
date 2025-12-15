'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../../components/Button/Button';
import styles from './page.module.css';
import { verifyLogin } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyLogin(formData.username, formData.password);

      if (result.success) {
        // Login exitoso
        sessionStorage.setItem('isAdmin', 'true');
        router.push('/dashboard');
      } else {
        setError(result.error || 'Credenciales incorrectas.');
        setLoading(false);
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Iniciar Sesión</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Usuario</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Contraseña</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Contraseña"
              required
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button 
            variant="primary" 
            fullWidth 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
}
