import React from 'react';
import styles from './TournamentBracket.module.css';
import { Prisma } from '@prisma/client';

type MatchWithTeams = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
  };
}>;

interface Props {
  matches: MatchWithTeams[];
}

export default function TournamentBracket({ matches }: Props) {
  // Filter matches by phase
  const quarterFinals = matches.filter(m => m.phase === 'QUARTER_FINAL');
  const semiFinals = matches.filter(m => m.phase === 'SEMI_FINAL');
  const final = matches.filter(m => m.phase === 'FINAL');

  // Group matches by Series (for 2 legs or ensuring unique matchup display)
  const groupMatches = (phaseMatches: MatchWithTeams[]) => {
    const groups: { [key: string]: MatchWithTeams[] } = {};
    phaseMatches.forEach(m => {
      // Sort IDs to ensure A vs B and B vs A end up in the same group
      const key = [m.homeTeamId, m.awayTeamId].sort().join('-');
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.values(groups);
  };

  const quarterGroups = groupMatches(quarterFinals);
  const semiGroups = groupMatches(semiFinals);
  const finalGroups = groupMatches(final);

  // Helper to render a match card
  const renderMatchCard = (group: MatchWithTeams[], index: number) => {
    // If no group data, render placeholder
    if (!group || group.length === 0) {
      return (
        <div key={`placeholder-${index}`} className={`${styles.matchCard} ${styles.placeholder}`}>
          <div className={styles.teamRow}>
            <span className={styles.teamName}>-</span>
            <span className={styles.score}>-</span>
          </div>
          <div className={styles.teamRow}>
            <span className={styles.teamName}>-</span>
            <span className={styles.score}>-</span>
          </div>
          <div className={styles.matchInfo}>Por definir</div>
        </div>
      );
    }

    // Use the first match to identify teams
    const firstMatch = group[0];
    
    // Let's fix Team 1 and Team 2 based on the first match found
    const team1 = firstMatch.homeTeam;
    const team2 = firstMatch.awayTeam;
    
    let score1 = 0;
    let score2 = 0;
    let hasPlayed = false;

    group.forEach(m => {
        if (m.status === 'PLAYED') hasPlayed = true;
        
        if (m.homeTeamId === team1.id) {
            score1 += m.homeScore || 0;
            score2 += m.awayScore || 0;
        } else {
            // Swap scores because m.homeTeam is team2
            score2 += m.homeScore || 0;
            score1 += m.awayScore || 0;
        }
    });

    // Determine winner for styling
    const winner1 = hasPlayed && score1 > score2;
    const winner2 = hasPlayed && score2 > score1;

    return (
      <div key={index} className={styles.matchCard}>
         <div className={styles.teamRow}>
            <span className={`${styles.teamName} ${winner1 ? styles.winner : ''}`}>
              {team1.name}
            </span>
            <span className={styles.score}>
              {hasPlayed ? score1 : '-'}
            </span>
         </div>
         <div className={styles.teamRow}>
            <span className={`${styles.teamName} ${winner2 ? styles.winner : ''}`}>
              {team2.name}
            </span>
            <span className={styles.score}>
              {hasPlayed ? score2 : '-'}
            </span>
         </div>
         
         <div className={styles.matchInfo}>
            {group.length > 1 ? 'Global (Ida y Vuelta)' : (
              firstMatch.date ? new Date(firstMatch.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Por definir'
            )}
         </div>
      </div>
    );
  };

  // Helper to ensure we render the correct number of slots
  const renderRound = (title: string, data: MatchWithTeams[][], expectedCount: number) => {
    const slots = [];
    for (let i = 0; i < expectedCount; i++) {
      slots.push(data[i] || []);
    }

    return (
      <div className={styles.round}>
        <div className={styles.roundTitle}>{title}</div>
        <div 
          className={styles.roundMatches}
          style={{ gridTemplateRows: `repeat(${expectedCount}, 1fr)` }}
        >
          {slots.map((group, i) => renderMatchCard(group, i))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.bracketContainer}>
      {renderRound('Cuartos', quarterGroups, 4)}
      {renderRound('Semifinal', semiGroups, 2)}
      {renderRound('Final', finalGroups, 1)}
    </div>
  );
}
