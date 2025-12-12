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
    return { success: false as const, error: 'Error al crear el equipo. Inténtalo de nuevo.' };
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
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false as const, error: 'Error al eliminar el equipo.' };
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
