'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Tipos para la creación de equipo (actualizado)
interface CreateTeamData {
  name: string;
  coach: string;
  phone: string;
  email?: string;
  category?: string;
  players: {
    name: string;
    number: number;
  }[];
}

export async function createTeam(data: CreateTeamData) {
  try {
    // Validar que no exista un equipo con el mismo nombre
    const existingTeam = await prisma.team.findUnique({
      where: {
        name: data.name,
      },
    });

    if (existingTeam) {
      return { success: false as const, error: 'Ya existe un equipo con ese nombre.' };
    }

    // Crear el equipo y los jugadores en una transacción implícita
    const newTeam = await prisma.team.create({
      data: {
        name: data.name,
        coach: data.coach,
        phone: data.phone,
        email: data.email,
        category: data.category || 'Unica',
        players: {
          create: data.players.map((p) => ({
            name: p.name,
            number: p.number,
          })),
        },
        // Inicializar estadísticas vacías
        stats: {
          create: {
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          },
        },
      },
      include: {
        players: true,
      },
    });

    revalidatePath('/dashboard/registro-equipo');
    revalidatePath('/dashboard/resultados');
    
    return { success: true as const, data: newTeam };
  } catch (error) {
    console.error('Error creating team:', error);
    // Devolvemos el mensaje exacto del error para depuración
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false as const, error: `Error: ${errorMessage}` };
  }
}

export async function getTeams() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: true,
        stats: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return { success: true as const, data: teams };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return { success: false as const, error: 'Error al obtener los equipos.' };
  }
}

export async function getTeamById(id: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: true,
        stats: true,
      },
    });
    
    if (!team) {
      return { success: false as const, error: 'Equipo no encontrado' };
    }

    return { success: true as const, data: team };
  } catch (error) {
    console.error('Error fetching team:', error);
    return { success: false as const, error: 'Error al obtener el equipo' };
  }
}

export async function getStandings() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        stats: true,
      },
    });

    // Sort by Points > Goal Diff > Goals For
    type TeamWithStats = Prisma.TeamGetPayload<{ include: { stats: true } }>;
    
    const sortedTeams = teams.sort((a: TeamWithStats, b: TeamWithStats) => {
      const statsA = a.stats || { points: 0, goalDifference: 0, goalsFor: 0 };
      const statsB = b.stats || { points: 0, goalDifference: 0, goalsFor: 0 };

      if (statsB.points !== statsA.points) return statsB.points - statsA.points;
      if (statsB.goalDifference !== statsA.goalDifference) return statsB.goalDifference - statsA.goalDifference;
      return statsB.goalsFor - statsA.goalsFor;
    });

    return { success: true as const, data: sortedTeams };
  } catch (error) {
    console.error('Error fetching standings:', error);
    return { success: false as const, error: 'Error al obtener la tabla de posiciones.' };
  }
}

export async function deleteTeam(teamId: string) {
  try {
    await prisma.team.delete({
      where: {
        id: teamId,
      },
    });
    
    revalidatePath('/dashboard/registro-equipo');
    revalidatePath('/dashboard/equipos-registrados');
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false as const, error: 'Error al eliminar el equipo.' };
  }
}

// Interfaz para actualizar equipo
interface UpdateTeamData {
  id: string;
  name: string;
  coach: string;
  phone: string;
  email?: string;
  players: {
    id?: string; // Si tiene ID es update, si no es create
    name: string;
    number: number;
  }[];
}

export async function updateTeam(data: UpdateTeamData) {
  try {
    // Usamos transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del equipo
      await tx.team.update({
        where: { id: data.id },
        data: {
          name: data.name,
          coach: data.coach,
          phone: data.phone,
          email: data.email,
        }
      });

      // 2. Manejar jugadores
      // Obtener jugadores actuales para saber cuáles eliminar
      const currentPlayers = await tx.player.findMany({
        where: { teamId: data.id },
        select: { id: true }
      });
      
      const currentPlayerIds = currentPlayers.map(p => p.id);
      const incomingPlayerIds = data.players.filter(p => p.id).map(p => p.id as string);
      
      // Identificar IDs a eliminar (los que están en DB pero no en la data entrante)
      const playersToDelete = currentPlayerIds.filter(id => !incomingPlayerIds.includes(id));
      
      if (playersToDelete.length > 0) {
        await tx.player.deleteMany({
          where: { id: { in: playersToDelete } }
        });
      }

      // Actualizar o Crear jugadores
      for (const player of data.players) {
        if (player.id) {
          // Update existing
          await tx.player.update({
            where: { id: player.id },
            data: {
              name: player.name,
              number: player.number
            }
          });
        } else {
          // Create new
          await tx.player.create({
            data: {
              name: player.name,
              number: player.number,
              teamId: data.id
            }
          });
        }
      }
    });

    revalidatePath('/dashboard/equipos-registrados');
    revalidatePath('/dashboard/registro-equipo');
    return { success: true as const };
  } catch (error) {
    console.error('Error updating team:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false as const, error: `Error al actualizar equipo: ${errorMessage}` };
  }
}

interface MatchResultData {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  playerStats: Record<string, {
    goals: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    blueCards: number;
  }>;
}

export async function saveMatchResult(data: MatchResultData) {
  try {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Crear el partido
      const match = await tx.match.create({
        data: {
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          status: 'PLAYED',
          phase: 'GROUP', // Por defecto, se puede mejorar después para seleccionar fase
          date: new Date(),
        },
      });

      // 2. Actualizar estadísticas de jugadores
      for (const [playerId, stats] of Object.entries(data.playerStats)) {
        await tx.player.update({
          where: { id: playerId },
          data: {
            goals: { increment: stats.goals },
            fouls: { increment: stats.fouls },
            yellowCards: { increment: stats.yellowCards },
            redCards: { increment: stats.redCards },
            blueCards: { increment: stats.blueCards },
          },
        });
      }

      // 3. Calcular puntos y actualizar estadísticas de equipos
      const homePoints = data.homeScore > data.awayScore ? 3 : data.homeScore === data.awayScore ? 1 : 0;
      const awayPoints = data.awayScore > data.homeScore ? 3 : data.homeScore === data.awayScore ? 1 : 0;

      // Actualizar Home Team
      await tx.teamStats.upsert({
        where: { teamId: data.homeTeamId },
        create: {
          teamId: data.homeTeamId,
          played: 1,
          won: data.homeScore > data.awayScore ? 1 : 0,
          drawn: data.homeScore === data.awayScore ? 1 : 0,
          lost: data.homeScore < data.awayScore ? 1 : 0,
          goalsFor: data.homeScore,
          goalsAgainst: data.awayScore,
          goalDifference: data.homeScore - data.awayScore,
          points: homePoints,
        },
        update: {
          played: { increment: 1 },
          won: { increment: data.homeScore > data.awayScore ? 1 : 0 },
          drawn: { increment: data.homeScore === data.awayScore ? 1 : 0 },
          lost: { increment: data.homeScore < data.awayScore ? 1 : 0 },
          goalsFor: { increment: data.homeScore },
          goalsAgainst: { increment: data.awayScore },
          goalDifference: { increment: data.homeScore - data.awayScore },
          points: { increment: homePoints },
        },
      });

      // Actualizar Away Team
      await tx.teamStats.upsert({
        where: { teamId: data.awayTeamId },
        create: {
          teamId: data.awayTeamId,
          played: 1,
          won: data.awayScore > data.homeScore ? 1 : 0,
          drawn: data.awayScore === data.homeScore ? 1 : 0,
          lost: data.awayScore < data.homeScore ? 1 : 0,
          goalsFor: data.awayScore,
          goalsAgainst: data.homeScore,
          goalDifference: data.awayScore - data.homeScore,
          points: awayPoints,
        },
        update: {
          played: { increment: 1 },
          won: { increment: data.awayScore > data.homeScore ? 1 : 0 },
          drawn: { increment: data.awayScore === data.homeScore ? 1 : 0 },
          lost: { increment: data.awayScore < data.homeScore ? 1 : 0 },
          goalsFor: { increment: data.awayScore },
          goalsAgainst: { increment: data.homeScore },
          goalDifference: { increment: data.awayScore - data.homeScore },
          points: { increment: awayPoints },
        },
      });

      return { success: true as const, data: match };
    });
  } catch (error) {
    console.error('Error saving match result:', error);
    return { success: false as const, error: 'Error al guardar el resultado del partido.' };
  }
}

export async function getTopScorer() {
  try {
    const topScorer = await prisma.player.findFirst({
      orderBy: {
        goals: 'desc',
      },
      include: {
        team: true,
      },
      where: {
        goals: {
          gt: 0
        }
      }
    });
    return { success: true as const, data: topScorer };
  } catch (error) {
    console.error('Error fetching top scorer:', error);
    return { success: false as const, error: 'Error al obtener el goleador.' };
  }
}

export async function getBestDefense() {
  try {
    const bestDefense = await prisma.teamStats.findFirst({
      orderBy: {
        goalsAgainst: 'asc',
      },
      include: {
        team: true,
      },
      where: {
        played: {
          gt: 0
        }
      }
    });
    return { success: true as const, data: bestDefense };
  } catch (error) {
    console.error('Error fetching best defense:', error);
    return { success: false as const, error: 'Error al obtener la valla menos vencida.' };
  }
}

export async function getUpcomingMatches() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: 3, // Mostrar solo los próximos 3
    });
    return { success: true as const, data: matches };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { success: false as const, error: 'Error al obtener los próximos partidos.' };
  }
}

// --- Nuevas funciones para Programación de Partidos ---

interface ScheduleMatchData {
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  phase: string; // 'GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'
}

export async function scheduleMatch(data: ScheduleMatchData) {
  try {
    const match = await prisma.match.create({
      data: {
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        date: data.date,
        phase: data.phase,
        status: 'SCHEDULED',
      },
    });
    revalidatePath('/dashboard/programacion');
    return { success: true as const, data: match };
  } catch (error) {
    console.error('Error scheduling match:', error);
    return { success: false as const, error: 'Error al programar el partido.' };
  }
}

export async function getAllScheduledMatches() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    return { success: true as const, data: matches };
  } catch (error) {
    console.error('Error fetching scheduled matches:', error);
    return { success: false as const, error: 'Error al obtener los partidos programados.' };
  }
}

export async function deleteMatch(matchId: string) {
  try {
    await prisma.match.delete({
      where: { id: matchId },
    });
    revalidatePath('/dashboard/programacion');
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { success: false as const, error: 'Error al eliminar el partido.' };
  }
}

export async function generateNextPhase() {
  try {
    // 1. Determinar en qué fase estamos analizando los partidos JUGADOS
    const playedMatches = await prisma.match.findMany({
      where: { status: 'PLAYED' },
      select: { phase: true }
    });

    const hasFinal = playedMatches.some(m => m.phase === 'FINAL');
    const hasSemis = playedMatches.some(m => m.phase === 'SEMI_FINAL');
    const hasQuarters = playedMatches.some(m => m.phase === 'QUARTER_FINAL');
    
    // Verificar si ya existen partidos PROGRAMADOS de la siguiente fase para no duplicar
    const scheduledMatches = await prisma.match.findMany({
      where: { status: 'SCHEDULED' },
      select: { phase: true }
    });
    const scheduledQuarters = scheduledMatches.some(m => m.phase === 'QUARTER_FINAL');
    const scheduledSemis = scheduledMatches.some(m => m.phase === 'SEMI_FINAL');
    const scheduledFinal = scheduledMatches.some(m => m.phase === 'FINAL');

    // Lógica de transición
    
    // CASO 1: De Grupos a Cuartos
    // Si no hay cuartos (jugados ni programados) y asumimos que la fase de grupos terminó
    // (Esto es un botón manual, así que confiamos en que el admin lo presiona cuando toca)
    if (!hasQuarters && !scheduledQuarters && !hasSemis && !hasFinal) {
      // Obtener tabla de posiciones
      const standingsResult = await getStandings();
      if (!standingsResult.success || !standingsResult.data) {
        throw new Error('No se pudo obtener la tabla de posiciones');
      }
      const rankedTeams = standingsResult.data;
      
      if (rankedTeams.length < 8) {
        return { success: false as const, error: 'Se necesitan al menos 8 equipos para generar Cuartos de Final.' };
      }

      // Generar 4 llaves: 1vs8, 2vs7, 3vs6, 4vs5
      const top8 = rankedTeams.slice(0, 8);
      const pairings = [
        { home: top8[0], away: top8[7] }, // 1 vs 8
        { home: top8[1], away: top8[6] }, // 2 vs 7
        { home: top8[2], away: top8[5] }, // 3 vs 6
        { home: top8[3], away: top8[4] }, // 4 vs 5
      ];

      await prisma.$transaction(
        pairings.map(pair => 
          prisma.match.create({
            data: {
              homeTeamId: pair.home.id,
              awayTeamId: pair.away.id,
              phase: 'QUARTER_FINAL',
              status: 'SCHEDULED',
              date: new Date(new Date().setDate(new Date().getDate() + 3)) // Fecha tentativa: 3 días después
            }
          })
        )
      );

      revalidatePath('/dashboard/programacion');
      return { success: true as const, message: 'Cuartos de Final generados correctamente.' };
    }

    // CASO 2: De Cuartos a Semifinales
    if (hasQuarters && !hasSemis && !scheduledSemis && !hasFinal) {
      // Necesitamos saber quién ganó los cuartos
      // Asumimos partido único por simplicidad o buscamos ganadores
      // Buscamos los 4 partidos de cuartos jugados
      const qfMatches = await prisma.match.findMany({
        where: { phase: 'QUARTER_FINAL', status: 'PLAYED' },
        include: { homeTeam: true, awayTeam: true }
      });

      if (qfMatches.length < 4) {
         return { success: false as const, error: 'Deben jugarse todos los partidos de Cuartos para avanzar.' };
      }

      const winners = qfMatches.map(m => {
        if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) return m.homeTeam;
        if ((m.awayScore ?? 0) > (m.homeScore ?? 0)) return m.awayTeam;
        // En caso de empate, debería haber penales, pero por ahora tomamos home (FIXME)
        return m.homeTeam; 
      });

      // Emparejamientos Semis: Ganador 1 vs Ganador 4, Ganador 2 vs Ganador 3?
      // O aleatorio? Asumamos orden de llaves: 
      // Llave A (1v8) vs Llave D (4v5) -> No, suele ser 1v8 vs 4v5
      // Vamos a emparejar [0] vs [3] y [1] vs [2] asumiendo que el orden de qfMatches es cronológico o por ID
      // Esto es arriesgado. Mejor sería trackear llaves.
      // Simplificación: Emparejar 1ro con 2do, 3ro con 4to de la lista de ganadores.
      
      if (winners.length < 4) return { success: false as const, error: 'Error al determinar ganadores.' };

      await prisma.$transaction([
        prisma.match.create({
          data: {
            homeTeamId: winners[0].id,
            awayTeamId: winners[1].id,
            phase: 'SEMI_FINAL',
            status: 'SCHEDULED',
            date: new Date(new Date().setDate(new Date().getDate() + 3))
          }
        }),
        prisma.match.create({
          data: {
            homeTeamId: winners[2].id,
            awayTeamId: winners[3].id,
            phase: 'SEMI_FINAL',
            status: 'SCHEDULED',
            date: new Date(new Date().setDate(new Date().getDate() + 3))
          }
        })
      ]);

      revalidatePath('/dashboard/programacion');
      return { success: true as const, message: 'Semifinales generadas correctamente.' };
    }

    // CASO 3: De Semifinales a Final
    if (hasSemis && !hasFinal && !scheduledFinal) {
      const sfMatches = await prisma.match.findMany({
        where: { phase: 'SEMI_FINAL', status: 'PLAYED' },
        include: { homeTeam: true, awayTeam: true }
      });

      if (sfMatches.length < 2) {
        return { success: false as const, error: 'Deben jugarse las dos Semifinales para avanzar.' };
      }

      const finalists = sfMatches.map(m => {
        if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) return m.homeTeam;
        return m.awayTeam;
      });

      await prisma.match.create({
        data: {
          homeTeamId: finalists[0].id,
          awayTeamId: finalists[1].id,
          phase: 'FINAL',
          status: 'SCHEDULED',
          date: new Date(new Date().setDate(new Date().getDate() + 3))
        }
      });

      revalidatePath('/dashboard/programacion');
      return { success: true as const, message: 'Gran Final generada correctamente.' };
    }

    return { success: false as const, error: 'No se pudo determinar la siguiente fase o ya existen partidos programados.' };

  } catch (error) {
    console.error('Error generating next phase:', error);
    return { success: false as const, error: 'Error al generar la siguiente fase.' };
  }
}
