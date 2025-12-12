'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '../../../../components/Button/Button';
import styles from './page.module.css';

export default function RegistroEquipoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombreEquipo: '',
    entrenador: '',
    categoria: 'Unica', // Valor por defecto ya que el usuario mencionó una sola categoría
    telefono: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Aquí iría la lógica de guardado
    console.log('Datos del equipo:', formData);
    
    // Simulación de guardado
    setTimeout(() => {
      setLoading(false);
      alert('Equipo registrado correctamente (Simulación)');
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backLink}>
        ← Volver al Panel
      </Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Registro de Equipo</h1>
        <p className={styles.subtitle}>Añade un nuevo equipo al torneo.</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombreEquipo" className={styles.label}>Nombre del Equipo</label>
          <input
            type="text"
            id="nombreEquipo"
            name="nombreEquipo"
            value={formData.nombreEquipo}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Ej. Los Rayos FC"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="entrenador" className={styles.label}>Nombre del Entrenador/Delegado</label>
          <input
            type="text"
            id="entrenador"
            name="entrenador"
            value={formData.entrenador}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="categoria" className={styles.label}>Categoría</label>
          <input
            type="text"
            id="categoria"
            name="categoria"
            value={formData.categoria}
            className={styles.input}
            readOnly
            disabled
          />
          <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
            Categoría única para este torneo.
          </small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="telefono" className={styles.label}>Teléfono de Contacto</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className={styles.input}
            required
            placeholder="Ej. 555-123-4567"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Correo Electrónico (Opcional)</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej. contacto@equipo.com"
          />
        </div>

        <div className={styles.actions}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Equipo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
