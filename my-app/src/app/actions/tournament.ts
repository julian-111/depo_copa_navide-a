'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Tipos para la creación de equipo
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
    const existingTeam = await prisma.team.findUnique({
      where: {
        name: data.name,
      },
    });

    if (existingTeam) {
      return { success: false as const, error: 'Ya existe un equipo con ese nombre.' };
    }

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
    revalidatePath('/dashboard/equipos-registrados');
    revalidatePath('/equipos');
    revalidatePath('/');
    
    return { success: true as const, data: newTeam };
  } catch (error) {
    console.error('Error creating team:', error);
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
      const statsA = a.stats || { points: 0, goalDifference: 0, goalsFor: 0, goalsAgainst: 0 };
      const statsB = b.stats || { points: 0, goalDifference: 0, goalsFor: 0, goalsAgainst: 0 };

      if (statsB.points !== statsA.points) return statsB.points - statsA.points;
      if (statsB.goalDifference !== statsA.goalDifference) return statsB.goalDifference - statsA.goalDifference;
      // Menos goles en contra es mejor
      return statsA.goalsAgainst - statsB.goalsAgainst;
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
    revalidatePath('/equipos');
    revalidatePath('/');
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false as const, error: 'Error al eliminar el equipo.' };
  }
}

interface UpdateTeamData {
  id: string;
  name: string;
  coach: string;
  phone: string;
  email?: string;
  players: {
    id?: string;
    name: string;
    number: number;
  }[];
}

export async function updateTeam(data: UpdateTeamData) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: data.id },
        data: {
          name: data.name,
          coach: data.coach,
          phone: data.phone,
          email: data.email,
        }
      });

      const currentPlayers = await tx.player.findMany({
        where: { teamId: data.id },
        select: { id: true }
      });
      
      const currentPlayerIds = currentPlayers.map(p => p.id);
      const incomingPlayerIds = data.players.filter(p => p.id).map(p => p.id as string);
      
      const playersToDelete = currentPlayerIds.filter(id => !incomingPlayerIds.includes(id));
      
      if (playersToDelete.length > 0) {
        await tx.player.deleteMany({
          where: { id: { in: playersToDelete } }
        });
      }

      for (const player of data.players) {
        if (player.id) {
          await tx.player.update({
            where: { id: player.id },
            data: {
              name: player.name,
              number: player.number
            }
          });
        } else {
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
    revalidatePath('/equipos');
    revalidatePath('/');
    return { success: true as const };
  } catch (error) {
    console.error('Error updating team:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false as const, error: `Error al actualizar equipo: ${errorMessage}` };
  }
}

interface MatchResultData {
  matchId?: string;
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
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 0. Revertir estadísticas previas si es update
      if (data.matchId) {
        const prevStats = await tx.matchPlayerStats.findMany({
          where: { matchId: data.matchId }
        });

        for (const stat of prevStats) {
          await tx.player.update({
            where: { id: stat.playerId },
            data: {
              goals: { decrement: stat.goals },
              fouls: { decrement: stat.fouls },
              yellowCards: { decrement: stat.yellowCards },
              redCards: { decrement: stat.redCards },
              blueCards: { decrement: stat.blueCards },
            }
          });
        }

        await tx.matchPlayerStats.deleteMany({
          where: { matchId: data.matchId }
        });

        const prevMatch = await tx.match.findUnique({ where: { id: data.matchId } });
        if (prevMatch && prevMatch.homeScore !== null && prevMatch.awayScore !== null) {
          let homePoints = 0;
          if (prevMatch.homeScore > prevMatch.awayScore) homePoints = 3;
          else if (prevMatch.homeScore === prevMatch.awayScore) homePoints = 1;

          await tx.teamStats.update({
            where: { teamId: prevMatch.homeTeamId },
            data: {
              played: { decrement: 1 },
              won: { decrement: prevMatch.homeScore > prevMatch.awayScore ? 1 : 0 },
              drawn: { decrement: prevMatch.homeScore === prevMatch.awayScore ? 1 : 0 },
              lost: { decrement: prevMatch.homeScore < prevMatch.awayScore ? 1 : 0 },
              goalsFor: { decrement: prevMatch.homeScore },
              goalsAgainst: { decrement: prevMatch.awayScore },
              goalDifference: { decrement: prevMatch.homeScore - prevMatch.awayScore },
              points: { decrement: homePoints },
            }
          });

          let awayPoints = 0;
          if (prevMatch.awayScore > prevMatch.homeScore) awayPoints = 3;
          else if (prevMatch.awayScore === prevMatch.homeScore) awayPoints = 1;

          await tx.teamStats.update({
            where: { teamId: prevMatch.awayTeamId },
            data: {
              played: { decrement: 1 },
              won: { decrement: prevMatch.awayScore > prevMatch.homeScore ? 1 : 0 },
              drawn: { decrement: prevMatch.awayScore === prevMatch.homeScore ? 1 : 0 },
              lost: { decrement: prevMatch.awayScore < prevMatch.homeScore ? 1 : 0 },
              goalsFor: { decrement: prevMatch.awayScore },
              goalsAgainst: { decrement: prevMatch.homeScore },
              goalDifference: { decrement: prevMatch.awayScore - prevMatch.homeScore },
              points: { decrement: awayPoints },
            }
          });
        }
      }

      // 1. Crear o Actualizar el partido
      let match;
      if (data.matchId) {
        match = await tx.match.update({
          where: { id: data.matchId },
          data: {
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            status: 'PLAYED',
          },
        });
      } else {
        match = await tx.match.create({
          data: {
            homeTeamId: data.homeTeamId,
            awayTeamId: data.awayTeamId,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            status: 'PLAYED',
            phase: 'GROUP',
            date: new Date(),
          },
        });
      }

      // 2. Guardar nuevas estadísticas
      for (const [playerId, stats] of Object.entries(data.playerStats)) {
        if (stats.goals > 0 || stats.fouls > 0 || stats.yellowCards > 0 || stats.redCards > 0 || stats.blueCards > 0) {
          await tx.matchPlayerStats.create({
            data: {
              matchId: match.id,
              playerId: playerId,
              goals: stats.goals,
              fouls: stats.fouls,
              yellowCards: stats.yellowCards,
              redCards: stats.redCards,
              blueCards: stats.blueCards,
            }
          });

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
      }

      // 3. Actualizar tabla de posiciones
      let homePoints = 0;
      let awayPoints = 0;

      if (data.homeScore > data.awayScore) {
        homePoints = 3;
        awayPoints = 0;
      } else if (data.homeScore === data.awayScore) {
        homePoints = 1;
        awayPoints = 1;
      } else {
        homePoints = 0;
        awayPoints = 3;
      }

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
    
    revalidatePath('/dashboard/resultados');
    revalidatePath('/dashboard/partidos-jugados');
    revalidatePath('/dashboard/programacion');
    revalidatePath('/');
    
    return result;
  } catch (error) {
    console.error('Error saving match result:', error);
    return { success: false as const, error: 'Error al guardar el resultado del partido.' };
  }
}

export async function getTopScorer() {
  try {
    const topScorers = await prisma.player.findMany({
      orderBy: {
        goals: 'desc',
      },
      include: {
        team: true,
      },
      where: {
        goals: {
          gte: 5
        }
      }
    });
    return { success: true as const, data: topScorers };
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return { success: false as const, error: 'Error al obtener los goleadores.' };
  }
}

export async function getBestDefense() {
  try {
    const bestDefenses = await prisma.teamStats.findMany({
      orderBy: {
        goalsAgainst: 'asc',
      },
      include: {
        team: true,
      },
      where: {
        goalsAgainst: {
          lte: 45
        },
        played: {
          gt: 0
        }
      }
    });
    return { success: true as const, data: bestDefenses };
  } catch (error) {
    console.error('Error fetching best defenses:', error);
    return { success: false as const, error: 'Error al obtener las vallas menos vencidas.' };
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
    });
    return { success: true as const, data: matches };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { success: false as const, error: 'Error al obtener los próximos partidos.' };
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

export async function getPlayedMatches() {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'PLAYED' },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: 'desc' }
    });
    return { success: true as const, data: matches };
  } catch (error) {
    console.error('Error fetching played matches:', error);
    return { success: false as const, error: 'Error al obtener partidos jugados' };
  }
}

export async function getCurrentPhase() {
  try {
    const matches = await prisma.match.findMany({
      select: { phase: true, status: true }
    });

    const phases = matches.map(m => m.phase);
    
    if (phases.includes('FINAL')) return { success: true, data: 'FINAL' };
    if (phases.includes('SEMI_FINAL')) return { success: true, data: 'SEMI_FINAL' };
    if (phases.includes('QUARTER_FINAL')) return { success: true, data: 'QUARTER_FINAL' };
    
    return { success: true, data: 'GROUP' };
  } catch (error) {
    return { success: false, error: 'Error determinando la fase' };
  }
}

export async function getMatchesByPhase(phase: string) {
  try {
    const matches = await prisma.match.findMany({
      where: { phase },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { date: 'asc' }
    });
    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: 'Error obteniendo partidos de la fase' };
  }
}

export async function getMatchDetails(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: { players: true }
        },
        awayTeam: {
          include: { players: true }
        },
        playerStats: true
      }
    });

    if (!match) return { success: false as const, error: 'Partido no encontrado' };

    return { success: true as const, data: match };
  } catch (error) {
    console.error('Error fetching match details:', error);
    return { success: false as const, error: 'Error al obtener detalles del partido' };
  }
}

interface ScheduleMatchData {
  homeTeamId: string;
  awayTeamId: string;
  date: Date | null;
  phase?: string;
}

export async function scheduleMatch(data: ScheduleMatchData) {
  try {
    const match = await prisma.match.create({
      data: {
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        date: data.date,
        status: 'SCHEDULED',
        phase: data.phase || 'GROUP',
      },
    });

    revalidatePath('/dashboard/programacion');
    revalidatePath('/');
    return { success: true as const, data: match };
  } catch (error) {
    console.error('Error scheduling match:', error);
    return { success: false as const, error: 'Error al programar el partido.' };
  }
}

export async function deleteMatch(matchId: string) {
  try {
    await prisma.match.delete({
      where: { id: matchId },
    });

    revalidatePath('/dashboard/programacion');
    revalidatePath('/');
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { success: false as const, error: 'Error al eliminar el partido.' };
  }
}

export async function generateNextPhase() {
  try {
    // Logic to be implemented:
    // 1. Determine current phase
    // 2. Check if all matches in current phase are played
    // 3. Generate pairings for next phase based on standings/results
    
    // For now, returning a placeholder success to fix build
    return { success: true as const, message: "Generación automática de fase en desarrollo" };
  } catch (error) {
    console.error('Error generating next phase:', error);
    return { success: false as const, error: 'Error al generar la siguiente fase' };
  }
}
