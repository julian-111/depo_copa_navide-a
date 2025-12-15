'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Button from '../../../../../components/Button/Button';
import styles from './page.module.css';
import { getTeamById, updateTeam } from '@/app/actions/tournament';

interface Player {
  id: string;
  name: string;
  number: string;
}

export default function EditarEquipoPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;

  const [formData, setFormData] = useState({
    nombreEquipo: '',
    entrenador: '', // Delegado
    telefono: '',
    email: '',
    categoria: 'Unica'
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTeamData(teamId);
    }
  }, [teamId]);

  async function fetchTeamData(id: string) {
    try {
      const result = await getTeamById(id);
      if (result.success && result.data) {
        const team = result.data;
        setFormData({
          nombreEquipo: team.name,
          entrenador: team.coach,
          telefono: team.phone,
          email: team.email || '',
          categoria: team.category || 'Unica'
        });
        
        setPlayers(team.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          number: p.number.toString()
        })));
      } else {
        alert('Error al cargar los datos del equipo');
        router.push('/dashboard/equipos-registrados');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      alert('Error al cargar los datos del equipo');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: `new_${Date.now()}`, // Temporary ID for new players
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
    setSubmitting(true);
    
    try {
      // Validar que haya al menos un jugador
      if (players.length === 0) {
        alert('Debes agregar al menos un jugador.');
        setSubmitting(false);
        return;
      }

      const result = await updateTeam({
        id: teamId,
        name: formData.nombreEquipo,
        coach: formData.entrenador,
        phone: formData.telefono,
        email: formData.email,
        players: players.map(p => ({
          // Only send ID if it's not a new temporary ID
          id: p.id.startsWith('new_') ? undefined : p.id,
          name: p.name,
          number: parseInt(p.number) || 0
        }))
      });

      if (result.success) {
        alert('Equipo actualizado correctamente');
        router.push('/dashboard/equipos-registrados');
      } else {
        alert(result.error || 'Error al actualizar el equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>Cargando datos del equipo...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard/equipos-registrados" className={styles.backLink}>
        ← Volver a Equipos
      </Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Editar Equipo</h1>
        <p className={styles.subtitle}>Modifica los datos del equipo y sus jugadores.</p>
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
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}