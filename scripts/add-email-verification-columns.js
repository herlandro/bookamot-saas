#!/usr/bin/env node
/**
 * Script para adicionar colunas de verificação de email ao banco de dados
 * Execute: node scripts/add-email-verification-columns.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addEmailVerificationColumns() {
  try {
    console.log('🔄 Adicionando colunas de verificação de email...\n')

    // Verificar se as colunas já existem
    const checkColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name IN ('emailVerificationCode', 'emailVerificationExpiry')
    `

    const existingColumns = (checkColumns as any[]).map((row: any) => row.column_name)
    
    if (existingColumns.includes('emailVerificationCode') && existingColumns.includes('emailVerificationExpiry')) {
      console.log('✅ As colunas já existem no banco de dados!')
      console.log('   - emailVerificationCode: ✅')
      console.log('   - emailVerificationExpiry: ✅')
      return
    }

    // Adicionar colunas
    console.log('📝 Adicionando colunas...')
    
    await prisma.$executeRaw`
      ALTER TABLE "public"."User" 
      ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
      ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3)
    `

    console.log('✅ Colunas adicionadas com sucesso!\n')

    // Verificar novamente
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name IN ('emailVerificationCode', 'emailVerificationExpiry')
    `

    console.log('📊 Colunas verificadas:')
    for (const row of verifyColumns as any[]) {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    }

    console.log('\n✨ Processo concluído com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro ao adicionar colunas:', error)
    if (error instanceof Error) {
      console.error('   Detalhes:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addEmailVerificationColumns()

