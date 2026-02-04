#!/usr/bin/env tsx
/**
 * Migrate admin users: ensure bookanmot@gmail.com is ADMIN, remove admin@bookamot.co.uk.
 * Run after applying the migration that removes SUPER_ADMIN (e.g. 20260204100000_remove_super_admin_role).
 *
 * Usage:
 *   npm run db:migrate-admin-users
 *   npx tsx scripts/migrate-admin-users.ts
 *   npx tsx scripts/migrate-admin-users.ts --backup-dir=./backups
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const PRIMARY_ADMIN_EMAIL = 'bookanmot@gmail.com'
const REMOVE_ADMIN_EMAIL = 'admin@bookamot.co.uk'

async function main() {
  const backupDir = process.argv.find((a) => a.startsWith('--backup-dir='))?.split('=')[1]

  await prisma.$transaction(async (tx) => {
    // 1) Ensure primary admin exists with ADMIN role
    const defaultPasswordHash = await bcrypt.hash('ChangeMeUponFirstLogin!', 12)
    const primaryAdmin = await tx.user.upsert({
      where: { email: PRIMARY_ADMIN_EMAIL },
      update: { role: UserRole.ADMIN },
      create: {
        email: PRIMARY_ADMIN_EMAIL,
        name: 'Admin',
        role: UserRole.ADMIN,
        password: defaultPasswordHash,
      },
    })
    console.log(`✅ Primary admin ensured: ${primaryAdmin.email} (${primaryAdmin.role})`)

    const oldAdmin = await tx.user.findUnique({
      where: { email: REMOVE_ADMIN_EMAIL },
      include: {
        sessions: true,
        accounts: true,
      },
    })

    if (!oldAdmin) {
      console.log(`ℹ️  User ${REMOVE_ADMIN_EMAIL} not found, nothing to remove.`)
      return
    }

    // 2) Optional backup for compliance (LGPD/GDPR)
    if (backupDir) {
      const backupPath = path.join(backupDir, `user-backup-${REMOVE_ADMIN_EMAIL.replace('@', '_at_')}-${Date.now()}.json`)
      fs.mkdirSync(path.dirname(backupPath), { recursive: true })
      const backup = {
        email: oldAdmin.email,
        name: oldAdmin.name,
        id: oldAdmin.id,
        role: oldAdmin.role,
        createdAt: oldAdmin.createdAt,
        updatedAt: oldAdmin.updatedAt,
        sessionCount: oldAdmin.sessions?.length ?? 0,
        accountCount: oldAdmin.accounts?.length ?? 0,
      }
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8')
      console.log(`📁 Backup written: ${backupPath}`)
    }

    // 3) Reassign dependencies so we can delete the user
    const oldId = oldAdmin.id
    const newId = primaryAdmin.id

    const garageApprovalLogs = await tx.garageApprovalLog.updateMany({
      where: { adminId: oldId },
      data: { adminId: newId },
    })
    if (garageApprovalLogs.count > 0) {
      console.log(`   Reassigned ${garageApprovalLogs.count} GarageApprovalLog(s) to primary admin.`)
    }

    const garages = await tx.garage.updateMany({
      where: { approvedById: oldId },
      data: { approvedById: newId },
    })
    if (garages.count > 0) {
      console.log(`   Reassigned ${garages.count} Garage approval(s) to primary admin.`)
    }

    const purchaseRequests = await tx.purchaseRequest.updateMany({
      where: { approvedById: oldId },
      data: { approvedById: newId },
    })
    if (purchaseRequests.count > 0) {
      console.log(`   Reassigned ${purchaseRequests.count} PurchaseRequest approval(s) to primary admin.`)
    }

    // 4) Delete sessions and accounts (explicit for clarity; User delete would cascade)
    await tx.session.deleteMany({ where: { userId: oldId } })
    await tx.account.deleteMany({ where: { userId: oldId } })

    // 5) Delete user
    await tx.user.delete({
      where: { id: oldId },
    })
    console.log(`✅ Removed user: ${REMOVE_ADMIN_EMAIL}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
