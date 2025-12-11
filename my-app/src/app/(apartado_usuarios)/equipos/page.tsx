import styles from './page.module.css';

interface Member {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
  icon: string;
  members: Member[];
}

const teams: Team[] = [
  {
    id: 1,
    name: "Renos FC",
    icon: "🦌",
    members: [
      { id: 1, name: "Juan Pérez" },
      { id: 2, name: "Carlos López" },
      { id: 3, name: "Miguel Ángel" },
      { id: 4, name: "David Torres" },
      { id: 5, name: "José Ruiz" },
    ]
  },
  {
    id: 2,
    name: "Atlético Navidad",
    icon: "🎅",
    members: [
      { id: 1, name: "Pedro Sánchez" },
      { id: 2, name: "Luis García" },
      { id: 3, name: "Roberto Díaz" },
      { id: 4, name: "Fernando Martínez" },
      { id: 5, name: "Javier Hernández" },
    ]
  },
  {
    id: 3,
    name: "Estrella del Norte",
    icon: "⭐",
    members: [
      { id: 1, name: "Ricardo Gómez" },
      { id: 2, name: "Alejandro Flores" },
      { id: 3, name: "Manuel Castro" },
      { id: 4, name: "Gabriel Romero" },
      { id: 5, name: "Daniel Vargas" },
    ]
  },
  {
    id: 4,
    name: "Elfos United",
    icon: "🧝",
    members: [
      { id: 1, name: "Sergio Ramos" },
      { id: 2, name: "Andrés Iniesta" },
      { id: 3, name: "Xavi Hernández" },
      { id: 4, name: "Iker Casillas" },
      { id: 5, name: "Carles Puyol" },
    ]
  },
  {
    id: 5,
    name: "Real Grinch",
    icon: "🎄",
    members: [
      { id: 1, name: "Cristiano Ronaldo" },
      { id: 2, name: "Karim Benzema" },
      { id: 3, name: "Luka Modric" },
      { id: 4, name: "Toni Kroos" },
      { id: 5, name: "Marcelo Vieira" },
    ]
  },
  {
    id: 6,
    name: "Deportivo Nieve",
    icon: "❄️",
    members: [
      { id: 1, name: "Lionel Messi" },
      { id: 2, name: "Neymar Jr" },
      { id: 3, name: "Luis Suárez" },
      { id: 4, name: "Gerard Piqué" },
      { id: 5, name: "Sergio Busquets" },
    ]
  }
];

export default function TeamsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Equipos Participantes</h1>
      
      <div className={styles.grid}>
        {teams.map((team, index) => (
          <div 
            key={team.id} 
            className={styles.teamCard}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={styles.teamHeader}>
              <div className={styles.teamIcon}>{team.icon}</div>
              <h2 className={styles.teamName}>{team.name}</h2>
            </div>
            
            <ul className={styles.membersList}>
              {team.members.map((member) => (
                <li key={member.id} className={styles.memberItem}>
                  <span className={styles.memberIcon}>⚽</span>
                  {member.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
