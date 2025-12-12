'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '../../../../components/Button/Button';
import styles from './page.module.css';

interface Player {
  id: string;
  name: string;
  number: string;
}

export default function RegistroEquipoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombreEquipo: '',
    entrenador: '', // Delegado
    telefono: '',
    email: '', // Optional, keeping it but prioritizing requested fields
    categoria: 'Unica'
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: '',
      number: ''
    };
    setPlayers([...players, newPlayer]);
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Aquí iría la lógica de guardado
    const dataToSave = {
      ...formData,
      players
    };
    
    console.log('Datos del equipo:', dataToSave);
    
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
        <p className={styles.subtitle}>Inscribe un nuevo equipo y sus jugadores.</p>
      </header>

      <div className={styles.glassPanel}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          {/* Seccion 1: Datos del Delegado y Equipo */}
          <div className={styles.section}>
             <h3 className={styles.sectionTitle}>Datos del Delegado y Equipo</h3>
             
             <div className={styles.formGroup}>
              <label htmlFor="entrenador" className={styles.label}>
                <i className="fas fa-user-tie"></i> Nombre del Delegado
              </label>
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
              <label htmlFor="telefono" className={styles.label}>
                <i className="fas fa-phone"></i> Teléfono de Contacto
              </label>
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
              <label htmlFor="nombreEquipo" className={styles.label}>
                 <i className="fas fa-shield-alt"></i> Nombre del Equipo
              </label>
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
              <label htmlFor="categoria" className={styles.label}>Categoría</label>
              <input
                type="text"
                id="categoria"
                name="categoria"
                value={formData.categoria}
                className={`${styles.input} ${styles.readOnly}`}
                readOnly
                disabled
              />
            </div>
          </div>

          {/* Seccion 2: Jugadores */}
          <div className={styles.section}>
            <div className={styles.playersHeader}>
               <h3 className={styles.sectionTitle}>Jugadores</h3>
               <Button type="button" variant="primary" size="small" onClick={addPlayer}>
                 Agregar Jugador
               </Button>
            </div>

            <div className={styles.playersList}>
              {players.length === 0 && (
                <p className={styles.emptyState}>No hay jugadores agregados aún.</p>
              )}
              
              {players.map((player, index) => (
                <div key={player.id} className={styles.playerRow}>
                  <div className={styles.playerIndex}>{index + 1}</div>
                  <div className={styles.playerInputGroup}>
                    <input
                      type="text"
                      placeholder="Nombre del Jugador"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.playerNumberGroup}>
                    <input
                      type="number"
                      placeholder="N°"
                      value={player.number}
                      onChange={(e) => updatePlayer(player.id, 'number', e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    className={styles.removeBtn}
                    onClick={() => removePlayer(player.id)}
                    aria-label="Eliminar jugador"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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
    </div>
  );
}
