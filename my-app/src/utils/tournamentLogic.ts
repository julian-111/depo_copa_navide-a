import { Team, Match, MatchStatus, TournamentPhase, TeamStats } from '../types/tournament';

// --- 1. Round Robin Logic (Todos contra todos) ---

/**
 * Generates a Round Robin schedule using the Circle Method.
 * If number of teams is odd, a dummy team is added (bye).
 */
export function generateRoundRobinSchedule(teams: Team[]): Match[] {
  if (teams.length < 2) return [];

  const schedule: Match[] = [];
  let rotation = [...teams];
  
  // Add dummy team if odd number of teams
  if (rotation.length % 2 !== 0) {
    rotation.push({ id: 'BYE', name: 'Descanso', players: [] });
  }

  const numTeams = rotation.length;
  const numRounds = numTeams - 1;
  const halfSize = numTeams / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const teamA = rotation[i];
      const teamB = rotation[numTeams - 1 - i];

      // Skip matches with dummy team
      if (teamA.id !== 'BYE' && teamB.id !== 'BYE') {
        schedule.push({
          id: `match-g-${round + 1}-${i}`,
          homeTeamId: teamA.id,
          awayTeamId: teamB.id,
          status: 'SCHEDULED',
          phase: 'GROUP',
          round: round + 1,
        });
      }
    }

    // Rotate teams (keep first fixed, rotate others)
    const first = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop();
    if (last) rest.unshift(last);
    rotation = [first, ...rest];
  }

  return schedule;
}

/**
 * Calculates standings based on match results.
 */
export function calculateStandings(teams: Team[], matches: Match[]): Team[] {
  const standings: Map<string, TeamStats> = new Map();

  // Initialize stats
  teams.forEach(team => {
    standings.set(team.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
  });

  matches.forEach(match => {
    if (match.status === 'PLAYED' && match.homeScore !== undefined && match.awayScore !== undefined) {
      const homeStats = standings.get(match.homeTeamId);
      const awayStats = standings.get(match.awayTeamId);

      if (homeStats && awayStats) {
        // Update Played
        homeStats.played += 1;
        awayStats.played += 1;

        // Update Goals
        homeStats.goalsFor += match.homeScore;
        homeStats.goalsAgainst += match.awayScore;
        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;

        awayStats.goalsFor += match.awayScore;
        awayStats.goalsAgainst += match.homeScore;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

        // Update Points & W/D/L
        if (match.homeScore > match.awayScore) {
          homeStats.won += 1;
          homeStats.points += 3;
          awayStats.lost += 1;
        } else if (match.homeScore < match.awayScore) {
          awayStats.won += 1;
          awayStats.points += 3;
          homeStats.lost += 1;
        } else {
          homeStats.drawn += 1;
          homeStats.points += 1;
          awayStats.drawn += 1;
          awayStats.points += 1;
        }
      }
    }
  });

  // Attach stats to teams and sort
  return teams.map(team => ({
    ...team,
    stats: standings.get(team.id)
  })).sort((a, b) => {
    const statsA = a.stats!;
    const statsB = b.stats!;

    // Sort by Points
    if (statsA.points !== statsB.points) return statsB.points - statsA.points;
    // Then by Goal Difference
    if (statsA.goalDifference !== statsB.goalDifference) return statsB.goalDifference - statsA.goalDifference;
    // Then by Goals For
    return statsB.goalsFor - statsA.goalsFor;
  });
}

// --- 2. Quarter Finals Logic (Ida y Vuelta) ---

/**
 * Generates Quarter Final pairings: 1 vs 8, 2 vs 7, etc.
 * Assumes top 8 teams qualify.
 */
export function generateQuarterFinals(rankedTeams: Team[]): Match[] {
  if (rankedTeams.length < 8) {
    console.warn('Not enough teams for Quarter Finals. Need at least 8.');
    return [];
  }

  const qualifiers = rankedTeams.slice(0, 8);
  const matches: Match[] = [];
  const numPairings = 4; // 8 teams -> 4 matches

  for (let i = 0; i < numPairings; i++) {
    const highSeed = qualifiers[i]; // 1st, 2nd, 3rd, 4th
    const lowSeed = qualifiers[7 - i]; // 8th, 7th, 6th, 5th

    // First Leg (Ida) - Usually lower seed plays home first
    matches.push({
      id: `qf-leg1-${i}`,
      homeTeamId: lowSeed.id,
      awayTeamId: highSeed.id,
      status: 'SCHEDULED',
      phase: 'QUARTER_FINAL',
      leg: 1,
      date: 'TBD'
    });

    // Second Leg (Vuelta) - Higher seed plays home second
    matches.push({
      id: `qf-leg2-${i}`,
      homeTeamId: highSeed.id,
      awayTeamId: lowSeed.id,
      status: 'SCHEDULED',
      phase: 'QUARTER_FINAL',
      leg: 2,
      date: 'TBD'
    });
  }

  return matches;
}

/**
 * Determines winner of a two-legged tie.
 * Returns null if tied (requires penalties logic external to this simple calculation).
 */
export function getAggregateWinner(leg1: Match, leg2: Match): string | null {
  if (leg1.status !== 'PLAYED' || leg2.status !== 'PLAYED') return null;
  if (leg1.homeScore === undefined || leg1.awayScore === undefined || 
      leg2.homeScore === undefined || leg2.awayScore === undefined) return null;

  // Assuming leg1: Home=LowSeed, Away=HighSeed
  // leg2: Home=HighSeed, Away=LowSeed
  // Need to track who is who properly. 
  // We'll calculate score by Team ID.
  
  // Let's identify the two teams involved
  const teamA = leg1.homeTeamId;
  const teamB = leg1.awayTeamId;

  let scoreA = 0;
  let scoreB = 0;

  // Leg 1 (A vs B)
  scoreA += leg1.homeScore;
  scoreB += leg1.awayScore;

  // Leg 2 (should be B vs A)
  if (leg2.homeTeamId === teamB && leg2.awayTeamId === teamA) {
    scoreB += leg2.homeScore;
    scoreA += leg2.awayScore;
  } else {
    // Edge case or error in inputs
    console.error('Mismatch in teams for aggregate calculation');
    return null;
  }

  if (scoreA > scoreB) return teamA;
  if (scoreB > scoreA) return teamB;

  return null; // Tie -> Penalties needed
}

// --- 3. Semi Finals Logic (Flexible) ---

interface SemiFinalConfig {
  format: 'SINGLE_MATCH' | 'HOME_AWAY';
  manualPairing?: boolean; // If true, function returns empty template or waits for input
  customPairings?: [string, string][]; // Array of [TeamId1, TeamId2]
}

/**
 * Generates Semi Final matches based on winners of QF.
 */
export function generateSemiFinals(
  qualifiedTeams: Team[], 
  config: SemiFinalConfig
): Match[] {
  if (qualifiedTeams.length !== 4) {
    console.warn('Need exactly 4 teams for Semi Finals');
    return [];
  }

  const matches: Match[] = [];

  // Default pairing: Winner QF1 vs Winner QF2, Winner QF3 vs Winner QF4?
  // Or 1st-seeded-path vs 4th-seeded-path?
  // Let's assume standard bracket: 
  // Match A: Team 0 vs Team 1
  // Match B: Team 2 vs Team 3
  // If custom pairings provided:
  let pairings: [Team, Team][] = [];

  if (config.manualPairing && config.customPairings) {
    // Map IDs to Team objects
    config.customPairings.forEach(pair => {
      const t1 = qualifiedTeams.find(t => t.id === pair[0]);
      const t2 = qualifiedTeams.find(t => t.id === pair[1]);
      if (t1 && t2) pairings.push([t1, t2]);
    });
  } else {
    // Auto pairings
    pairings.push([qualifiedTeams[0], qualifiedTeams[1]]);
    pairings.push([qualifiedTeams[2], qualifiedTeams[3]]);
  }

  pairings.forEach((pair, index) => {
    if (config.format === 'SINGLE_MATCH') {
      matches.push({
        id: `sf-match-${index}`,
        homeTeamId: pair[0].id,
        awayTeamId: pair[1].id,
        status: 'SCHEDULED',
        phase: 'SEMI_FINAL',
        leg: 1
      });
    } else {
      // Home and Away
      matches.push({
        id: `sf-leg1-${index}`,
        homeTeamId: pair[1].id,
        awayTeamId: pair[0].id,
        status: 'SCHEDULED',
        phase: 'SEMI_FINAL',
        leg: 1
      });
      matches.push({
        id: `sf-leg2-${index}`,
        homeTeamId: pair[0].id,
        awayTeamId: pair[1].id,
        status: 'SCHEDULED',
        phase: 'SEMI_FINAL',
        leg: 2
      });
    }
  });

  return matches;
}
