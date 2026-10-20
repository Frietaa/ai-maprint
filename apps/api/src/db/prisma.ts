// Server-only. Never import this from apps/web or packages/shared.
import { PrismaPg } from '@prisma/adapter-pg'
import { readRequired } from '../config/env.js'
import { PrismaClient, type Prisma } from '../generated/prisma/client.js'

// What repositories accept: the shared client from getPrisma() or the `tx`
// client of an interactive prisma.$transaction(). API-internal only.
export type DbClient = Prisma.TransactionClient

let prisma: PrismaClient | undefined

// One PrismaClient per process, created on first use so the API can start
// (e.g. /api/v1/health) without DATABASE_URL until a feature needs the DB.
export function getPrisma(): PrismaClient {
  prisma ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: readRequired(process.env, 'DATABASE_URL'),
    }),
  })
  return prisma
}
