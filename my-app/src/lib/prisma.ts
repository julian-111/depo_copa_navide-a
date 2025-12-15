import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

// Eliminar parámetros de la URL para evitar conflictos con la configuración manual de SSL
const baseConnectionString = connectionString.split('?')[0];

const pool = new Pool({ 
  connectionString: baseConnectionString,
  ssl: { 
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined // Deshabilitar verificación de hostname también
  },
  max: 10, // Límite de conexiones para evitar saturación
  idleTimeoutMillis: 30000
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
