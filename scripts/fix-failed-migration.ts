#!/usr/bin/env tsx
/**
 * Script para resolver migração falhada no banco de dados
 * 
 * Este script resolve a migração 20250101000000_add_email_system que falhou
 * porque foi renomeada para 20251221000000_add_email_system
 * 
 * USAGE:
 *   npx tsx scripts/fix-failed-migration.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Resolvendo migração falhada...\n')
  
  try {
    // Verificar se a migração falhada existe
    const failed = await prisma.$queryRaw<Array<{
      migration_name: string
      started_at: Date
      finished_at: Date | null
    }>>`
      SELECT "migration_name", "started_at", "finished_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" = '20250101000000_add_email_system'
        AND "finished_at" IS NULL
    `
    
    if (failed.length === 0) {
      console.log('ℹ️  Migração 20250101000000_add_email_system não encontrada ou já foi resolvida')
      
      // Verificar se há outras migrações falhadas
      const allFailed = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT "migration_name"
        FROM "_prisma_migrations"
        WHERE "finished_at" IS NULL
          AND "rolled_back_at" IS NULL
      `
      
      if (allFailed.length > 0) {
        console.log('\n⚠️  Outras migrações falhadas encontradas:')
        allFailed.forEach(m => console.log(`   - ${m.migration_name}`))
      } else {
        console.log('✅ Nenhuma migração falhada encontrada')
      }
      
      return
    }
    
    console.log(`📋 Encontrada migração falhada: ${failed[0].migration_name}`)
    console.log(`   Iniciada em: ${failed[0].started_at}\n`)
    
    // Marcar a migração falhada como resolvida (rolled back)
    // Isso permite que novas migrações sejam aplicadas
    const result = await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET 
        "finished_at" = NOW(),
        "rolled_back_at" = NOW(),
        "logs" = COALESCE("logs", '') || E'\nMigration resolved manually - folder was renamed to 20251221000000_add_email_system. Marked as rolled back to allow new migration to be applied.'
      WHERE "migration_name" = '20250101000000_add_email_system'
        AND "finished_at" IS NULL
    `
    
    console.log(`✅ Migração marcada como resolvida: ${result} registro(s) atualizado(s)`)
    console.log('   A migração foi marcada como "rolled back" para permitir que a nova migração seja aplicada.\n')
    
    // Verificar se ainda há migrações pendentes
    const pending = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT "migration_name"
      FROM "_prisma_migrations"
      WHERE "finished_at" IS NULL
        AND "rolled_back_at" IS NULL
    `
    
    if (pending.length > 0) {
      console.log('⚠️  Migrações pendentes encontradas:')
      pending.forEach(m => console.log(`   - ${m.migration_name}`))
    } else {
      console.log('✅ Nenhuma migração pendente')
      console.log('\n💡 Agora você pode executar: npx prisma migrate deploy')
    }
    
  } catch (error) {
    console.error('❌ Erro ao resolver migração:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

