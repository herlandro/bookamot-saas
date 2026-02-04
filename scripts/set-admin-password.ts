#!/usr/bin/env tsx
/**
 * Define a password do admin principal (bookanmot@gmail.com).
 * Use quando o login falha com "Invalid email or password" após migração.
 *
 * Uso:
 *   ADMIN_PASSWORD="TuaSenhaSegura123!" npx tsx scripts/set-admin-password.ts
 *   npx tsx scripts/set-admin-password.ts "TuaSenhaSegura123!"
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const ADMIN_EMAIL = 'bookanmot@gmail.com'

async function main() {
  const password = process.env.ADMIN_PASSWORD ?? process.argv[2]
  if (!password || password.length < 6) {
    console.error('❌ Define a password (mín. 6 caracteres):')
    console.error('   ADMIN_PASSWORD="TuaSenha" npx tsx scripts/set-admin-password.ts')
    console.error('   npx tsx scripts/set-admin-password.ts "TuaSenha"')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true },
  })

  if (!user) {
    console.error(`❌ User ${ADMIN_EMAIL} não existe na base de dados.`)
    console.error('   Corre primeiro: npm run db:migrate-admin-users')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { password: hash },
  })

  console.log(`✅ Password atualizada para ${ADMIN_EMAIL}.`)
  console.log('   Faz login com o email e a password que definiste.')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
