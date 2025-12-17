
import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        stats: true
      }
    });
    console.log(`Found ${teams.length} teams.`);
    teams.forEach(t => {
      console.log(`Team: ${t.name}, Points: ${t.stats?.points}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
