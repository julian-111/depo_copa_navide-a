export interface Player {
  id: string;
  name: string;
  number: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  stats?: TeamStats;
}

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export type MatchStatus = 'SCHEDULED' | 'PLAYED' | 'LIVE';
export type TournamentPhase = 'GROUP' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  phase: TournamentPhase;
  round?: number; // For group stage rounds
  leg?: 1 | 2; // For knockouts (Ida/Vuelta)
  date?: string;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  penalties?: {
    home: number;
    away: number;
  };
}

export interface PhaseConfig {
  type: 'LEAGUE' | 'KNOCKOUT';
  legs: 1 | 2;
  manualPairing?: boolean;
}
