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
