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
    revalidatePath('/dashboard/equipos-registrados');
    revalidatePath('/equipos');
    revalidatePath('/');
    
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
    revalidatePath('/equipos');
    revalidatePath('/');
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
            phase: 'GROUP', // Por defecto
            date: new Date(),
          },
        });
      }

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
      // Reglas oficiales: Ganar = 3 puntos, Empate = 1 punto, Perder = 0 puntos
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
  date?: Date | null;
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
        { high: top8[0], low: top8[7] }, // 1 vs 8
        { high: top8[1], low: top8[6] }, // 2 vs 7
        { high: top8[2], low: top8[5] }, // 3 vs 6
        { high: top8[3], low: top8[4] }, // 4 vs 5
      ];

      const matchesToCreate = [];

      for (const pair of pairings) {
        // Partido de IDA (Local: Peor clasificado)
        matchesToCreate.push({
          homeTeamId: pair.low.id,
          awayTeamId: pair.high.id,
          phase: 'QUARTER_FINAL',
          status: 'SCHEDULED',
          leg: 1,
          date: new Date(new Date().setDate(new Date().getDate() + 3)) // +3 días
        });

        // Partido de VUELTA (Local: Mejor clasificado)
        matchesToCreate.push({
          homeTeamId: pair.high.id,
          awayTeamId: pair.low.id,
          phase: 'QUARTER_FINAL',
          status: 'SCHEDULED',
          leg: 2,
          date: new Date(new Date().setDate(new Date().getDate() + 7)) // +7 días (una semana después)
        });
      }

      await prisma.match.createMany({
        data: matchesToCreate
      });

      revalidatePath('/dashboard/programacion');
      return { success: true as const, message: 'Cuartos de Final (Ida y Vuelta) generados correctamente.' };
    }

    // CASO 2: De Cuartos a Semifinales
    if (hasQuarters && !hasSemis && !scheduledSemis && !hasFinal) {
      // Necesitamos saber quién ganó los cuartos (Global)
      const qfMatches = await prisma.match.findMany({
        where: { phase: 'QUARTER_FINAL', status: 'PLAYED' },
        include: { homeTeam: true, awayTeam: true }
      });

      // Deberíamos tener 8 partidos jugados (4 llaves x 2 partidos)
      if (qfMatches.length < 8) {
         return { success: false as const, error: 'Deben jugarse todos los partidos de Cuartos (Ida y Vuelta) para avanzar.' };
      }

      // Agrupar partidos por equipos para identificar las llaves
      // Una forma simple es usar un Set de IDs de equipos y ver quiénes pasaron
      // Pero necesitamos saber quién jugó contra quién.
      // Estrategia: Identificar las llaves originales. 
      // Las llaves se definen por los equipos que juegan entre sí.
      
      const winners: { team: any, globalScore: number }[] = [];
      const processedMatches = new Set<string>();

      for (const match of qfMatches) {
        if (processedMatches.has(match.id)) continue;

        // Buscar el partido "hermano" (mismos equipos, diferente leg)
        const otherMatch = qfMatches.find(m => 
          m.id !== match.id && 
          ((m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId) ||
           (m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId)) // Caso raro si no se invirtió localía
        );

        if (!otherMatch) continue; // Algo anda mal o falta el partido

        processedMatches.add(match.id);
        processedMatches.add(otherMatch.id);

        // Calcular Global
        // Equipo A (Home en match)
        const teamA = match.homeTeam;
        const teamB = match.awayTeam;

        let scoreA = (match.homeScore || 0);
        let scoreB = (match.awayScore || 0);

        // Sumar del otro partido
        if (otherMatch.homeTeamId === teamA.id) {
           scoreA += (otherMatch.homeScore || 0);
           scoreB += (otherMatch.awayScore || 0);
        } else {
           scoreB += (otherMatch.homeScore || 0);
           scoreA += (otherMatch.awayScore || 0);
        }

        if (scoreA > scoreB) {
          winners.push({ team: teamA, globalScore: scoreA });
        } else if (scoreB > scoreA) {
          winners.push({ team: teamB, globalScore: scoreB });
        } else {
          // EMPATE GLOBAL: Aquí deberíamos ver penales o ventaja deportiva.
          // Por defecto en este código simple: Pasa el que metió más goles de visitante?
          // O simplificamos pasando al azar/primero encontrado (TODO: Mejorar esto con penales)
          // Asumiremos ventaja deportiva para el que fue Home en la vuelta (mejor clasificado usualmente)
          // Si match es leg 2 (vuelta), teamA es home.
          if (match.leg === 2) winners.push({ team: teamA, globalScore: scoreA });
          else winners.push({ team: teamB, globalScore: scoreB }); 
        }
      }

      if (winners.length < 4) return { success: false as const, error: 'Error al determinar ganadores (verifique resultados completos).' };

      // Emparejamientos Semis
      // Asumimos que winners[0] vs winners[3] y winners[1] vs winners[2] no es exacto porque el orden de iteración es arbitrario.
      // Lo ideal sería mantener el seeding.
      // Por ahora, emparejamos [0]vs[1] y [2]vs[3] aleatorio de la lista de ganadores.
      
      await prisma.$transaction([
        prisma.match.create({
          data: {
            homeTeamId: winners[0].team.id,
            awayTeamId: winners[1].team.id,
            phase: 'SEMI_FINAL',
            status: 'SCHEDULED',
            leg: 1, // Semis también ida y vuelta? El usuario solo preguntó por cuartos. Asumimos partido único o ida y vuelta?
                    // "en la face de cuartos eso es automatico" -> Solo mencionó cuartos explícitamente.
                    // Generalmente semis también son ida y vuelta, pero hagámoslo partido único para diferenciar o igual?
                    // Haré partido único en cancha neutral/local sorteado para Semis y Final, salvo que se pida lo contrario.
            date: new Date(new Date().setDate(new Date().getDate() + 3))
          }
        }),
        prisma.match.create({
          data: {
            homeTeamId: winners[2].team.id,
            awayTeamId: winners[3].team.id,
            phase: 'SEMI_FINAL',
            status: 'SCHEDULED',
            leg: 1,
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

export async function updateMatchScore(matchId: string, newHomeScore: number, newAwayScore: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId } });
      if (!match) throw new Error('Partido no encontrado');
      
      const oldHomeScore = match.homeScore || 0;
      const oldAwayScore = match.awayScore || 0;

      // 1. Revertir estadísticas anteriores
      let oldHomePoints = 0;
      let oldAwayPoints = 0;
      if (oldHomeScore > oldAwayScore) { oldHomePoints = 3; oldAwayPoints = 0; }
      else if (oldHomeScore === oldAwayScore) { oldHomePoints = 1; oldAwayPoints = 1; }
      else { oldHomePoints = 0; oldAwayPoints = 3; }

      await tx.teamStats.update({
        where: { teamId: match.homeTeamId },
        data: {
          goalsFor: { decrement: oldHomeScore },
          goalsAgainst: { decrement: oldAwayScore },
          goalDifference: { decrement: oldHomeScore - oldAwayScore },
          points: { decrement: oldHomePoints },
          won: { decrement: oldHomePoints === 3 ? 1 : 0 },
          drawn: { decrement: oldHomePoints === 1 ? 1 : 0 },
          lost: { decrement: oldHomePoints === 0 ? 1 : 0 },
        }
      });

      await tx.teamStats.update({
        where: { teamId: match.awayTeamId },
        data: {
          goalsFor: { decrement: oldAwayScore },
          goalsAgainst: { decrement: oldHomeScore },
          goalDifference: { decrement: oldAwayScore - oldHomeScore },
          points: { decrement: oldAwayPoints },
          won: { decrement: oldAwayPoints === 3 ? 1 : 0 },
          drawn: { decrement: oldAwayPoints === 1 ? 1 : 0 },
          lost: { decrement: oldAwayPoints === 0 ? 1 : 0 },
        }
      });

      // 2. Aplicar nuevas estadísticas
      let newHomePoints = 0;
      let newAwayPoints = 0;
      if (newHomeScore > newAwayScore) { newHomePoints = 3; newAwayPoints = 0; }
      else if (newHomeScore === newAwayScore) { newHomePoints = 1; newAwayPoints = 1; }
      else { newHomePoints = 0; newAwayPoints = 3; }

      await tx.teamStats.update({
        where: { teamId: match.homeTeamId },
        data: {
          goalsFor: { increment: newHomeScore },
          goalsAgainst: { increment: newAwayScore },
          goalDifference: { increment: newHomeScore - newAwayScore },
          points: { increment: newHomePoints },
          won: { increment: newHomePoints === 3 ? 1 : 0 },
          drawn: { increment: newHomePoints === 1 ? 1 : 0 },
          lost: { increment: newHomePoints === 0 ? 1 : 0 },
        }
      });

      await tx.teamStats.update({
        where: { teamId: match.awayTeamId },
        data: {
          goalsFor: { increment: newAwayScore },
          goalsAgainst: { increment: newHomeScore },
          goalDifference: { increment: newAwayScore - newHomeScore },
          points: { increment: newAwayPoints },
          won: { increment: newAwayPoints === 3 ? 1 : 0 },
          drawn: { increment: newAwayPoints === 1 ? 1 : 0 },
          lost: { increment: newAwayPoints === 0 ? 1 : 0 },
        }
      });

      // 3. Actualizar Partido
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore: newHomeScore,
          awayScore: newAwayScore
        }
      });

      return { success: true as const, data: updatedMatch };
    });
    
    revalidatePath('/dashboard/partidos-jugados');
    revalidatePath('/');
    revalidatePath('/dashboard/resultados');
  } catch (error) {
    console.error('Error updating match score:', error);
    return { success: false as const, error: 'Error al actualizar el marcador.' };
  }
}

export async function getCurrentPhase() {
  try {
    // Determinar la fase más avanzada que tiene partidos PROGRAMADOS o JUGADOS
    // Prioridad: FINAL > SEMI_FINAL > QUARTER_FINAL > GROUP
    
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
