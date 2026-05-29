/**
 * Idempotent seed. Run with: bun run prisma:seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SPECIES = [
  { name: 'Dog', icon: '🐶' },
  { name: 'Cat', icon: '🐱' },
  { name: 'Rabbit', icon: '🐰' },
  { name: 'Bird', icon: '🐦' },
  { name: 'Hamster', icon: '🐹' },
  { name: 'Fish', icon: '🐟' },
  { name: 'Reptile', icon: '🦎' },
  { name: 'Other', icon: '🐾' },
]

async function main() {
  for (const s of SPECIES) {
    await prisma.species.upsert({
      where: { name: s.name },
      update: { icon: s.icon },
      create: s,
    })
  }
  const count = await prisma.species.count()
  console.log(`Seed complete. species count = ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
