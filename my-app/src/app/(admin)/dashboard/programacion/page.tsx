'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '../../../../components/Button/Button';
import styles from './page.module.css';
import { getTeams, getAllScheduledMatches, scheduleMatch, deleteMatch, generateNextPhase } from '@/app/actions/tournament';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string | null;
  phase: string;
}

export default function ProgramacionPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    phase: 'GROUP'
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [teamsResult, matchesResult] = await Promise.all([
        getTeams(),
        getAllScheduledMatches()
      ]);

      if (teamsResult.success && teamsResult.data) {
        setTeams(teamsResult.data);
      }
      
      if (matchesResult.success && matchesResult.data) {
        setScheduledMatches(matchesResult.data as unknown as Match[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.homeTeamId === formData.awayTeamId) {
      alert('El equipo local y visitante no pueden ser el mismo.');
      return;
    }

    let dateTime: Date | null = null;
    
    // Si se proporciona fecha u hora, ambas deben estar presentes
    if (formData.date || formData.time) {
      if (!formData.date || !formData.time) {
        alert('Para programar con fecha, debes indicar tanto el día como la hora.');
        return;
      }
      dateTime = new Date(`${formData.date}T${formData.time}`);
    }

    const result = await scheduleMatch({
      homeTeamId: formData.homeTeamId,
      awayTeamId: formData.awayTeamId,
      date: dateTime,
      phase: formData.phase
    });

    if (result.success) {
      alert('Partido programado correctamente.');
      setFormData({
        homeTeamId: '',
        awayTeamId: '',
        date: '',
        time: '',
        phase: 'GROUP'
      });
      fetchData();
    } else {
      alert(result.error || 'Error al programar el partido.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este partido programado?')) {
      const result = await deleteMatch(id);
      if (result.success) {
        fetchData();
      } else {
        alert('Error al eliminar el partido.');
      }
    }
  };

  const handleGenerateNextPhase = async () => {
    if (!confirm('¿Estás seguro de generar la siguiente fase? El sistema analizará los resultados actuales y creará los cruces correspondientes.')) {
      return;
    }

    setGenerating(true);
    try {
      const result = await generateNextPhase();
      if (result.success) {
        alert(result.message || 'Fase generada correctamente.');
        fetchData();
      } else {
        alert(result.error || 'No se pudo generar la siguiente fase.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al generar la fase.');
    } finally {
      setGenerating(false);
    }
  };

  const formatPhase = (phase: string) => {
    switch (phase) {
      case 'GROUP': return 'Fase de Grupos';
      case 'QUARTER_FINAL': return 'Cuartos de Final';
      case 'SEMI_FINAL': return 'Semifinal';
      case 'FINAL': return 'Gran Final';
      default: return phase;
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backLink}>
        ← Volver al Panel
      </Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>Programación de Partidos</h1>
        <p className={styles.subtitle}>Gestiona el calendario y las fases del torneo</p>
      </header>

      <div className={styles.grid}>
        {/* Panel Izquierdo: Formulario */}
        <div className={`${styles.glassPanel} ${styles.formSection}`}>
          <h3 className={styles.sectionTitle}>Programar Partido Manual</h3>
          <form onSubmit={handleSchedule}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fase</label>
              <select 
                name="phase" 
                value={formData.phase} 
                onChange={handleChange}
                className={styles.select}
              >
                <option value="GROUP">Fase de Grupos</option>
                <option value="QUARTER_FINAL">Cuartos de Final</option>
                <option value="SEMI_FINAL">Semifinal</option>
                <option value="FINAL">Gran Final</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Equipo Local</label>
              <select 
                name="homeTeamId" 
                value={formData.homeTeamId} 
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="">Seleccionar Equipo</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Equipo Visitante</label>
              <select 
                name="awayTeamId" 
                value={formData.awayTeamId} 
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="">Seleccionar Equipo</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Hora</label>
              <input 
                type="time" 
                name="time" 
                value={formData.time} 
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth>
              Programar Partido
            </Button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            <h3 className={styles.sectionTitle}>Avance de Fase</h3>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
              El sistema analizará los resultados y generará los cruces automáticamente (Cuartos, Semis, Final).
            </p>
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={handleGenerateNextPhase}
              disabled={generating}
            >
              {generating ? 'Analizando...' : 'Generar Siguiente Fase'}
            </Button>
          </div>
        </div>

        {/* Panel Derecho: Lista de Partidos */}
        <div className={styles.glassPanel}>
          <h3 className={styles.sectionTitle}>Partidos Programados</h3>
          
          {loading ? (
            <div className={styles.emptyState}>Cargando partidos...</div>
          ) : scheduledMatches.length === 0 ? (
            <div className={styles.emptyState}>No hay partidos programados.</div>
          ) : (
            <div className={styles.matchesList}>
              {scheduledMatches.map(match => (
                <div key={match.id} className={styles.matchCard}>
                  <div className={styles.matchInfo}>
                    <div className={styles.meta}>
                      <span className={styles.phase}>{formatPhase(match.phase)}</span>
                      <span className={styles.date}>
                        {match.date ? new Date(match.date).toLocaleString('es-CO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'America/Bogota'
                        }) : 'TBD'}
                      </span>
                    </div>
                    <div className={`${styles.team} ${styles.home}`}>{match.homeTeam.name}</div>
                    <div className={styles.vs}>VS</div>
                    <div className={`${styles.team} ${styles.away}`}>{match.awayTeam.name}</div>
                  </div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(match.id)}
                    title="Eliminar programación"
                  >
                    <i className="fas fa-trash"></i> 🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}