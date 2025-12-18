#!/usr/bin/env tsx
/**
 * Script para deletar usuários específicos e todos os seus relacionamentos
 * 
 * Usage:
 *   npx tsx scripts/delete-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Emails dos usuários a serem deletados
const emailsToDelete = [
  'herlandro.hermogenes@gmail.com',
  'herlandroh@gmail.com',
  'herlandro@hotmail.com'
]

async function deleteUsers() {
  console.log('🗑️  Iniciando remoção de usuários...\n')

  try {
    // Buscar os usuários pelos emails
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: emailsToDelete
        }
      },
      include: {
        garage: true,
        vehicles: true,
        bookings: true,
        reviews: true,
        motNotifications: true,
        garageApprovals: true
      }
    })

    if (users.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado com os emails especificados.')
      return
    }

    console.log(`📋 Encontrados ${users.length} usuário(s) para deletar:\n`)
    
    // Mostrar informações dos usuários encontrados
    for (const user of users) {
      console.log(`   👤 ${user.email}`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Nome: ${user.name || 'N/A'}`)
      console.log(`      Role: ${user.role}`)
      console.log(`      Garagens: ${user.garage ? 1 : 0}`)
      console.log(`      Veículos: ${user.vehicles.length}`)
      console.log(`      Reservas: ${user.bookings.length}`)
      console.log(`      Avaliações: ${user.reviews.length}`)
      console.log(`      Notificações MOT: ${user.motNotifications.length}`)
      console.log(`      Aprovações de garagem (como admin): ${user.garageApprovals.length}`)
      console.log('')
    }

    // Deletar GarageApprovalLog relacionados (não tem cascade)
    console.log('🗑️  Removendo logs de aprovação de garagem relacionados...')
    const approvalLogsDeleted = await prisma.garageApprovalLog.deleteMany({
      where: {
        adminId: {
          in: users.map(u => u.id)
        }
      }
    })
    console.log(`   ✅ ${approvalLogsDeleted.count} log(s) de aprovação removido(s)\n`)

    // Deletar os usuários (isso vai deletar automaticamente em cascata):
    // - Accounts
    // - Sessions
    // - Vehicles (e seus MotHistory, MotNotifications)
    // - Bookings (e seus MotResults, Reviews)
    // - Garage (e seus GarageSchedule, GarageScheduleException, GarageTimeSlotBlock, GarageApprovalLog)
    // - Reviews (como customer)
    // - MotNotifications
    console.log('🗑️  Removendo usuários e todos os relacionamentos...')
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: emailsToDelete
        }
      }
    })

    console.log(`   ✅ ${deletedUsers.count} usuário(s) removido(s) com sucesso!\n`)

    // Verificar se ainda existem registros relacionados
    console.log('🔍 Verificando se ainda existem registros relacionados...')
    
    const remainingApprovalLogs = await prisma.garageApprovalLog.count({
      where: {
        adminId: {
          in: users.map(u => u.id)
        }
      }
    })

    if (remainingApprovalLogs > 0) {
      console.log(`   ⚠️  Ainda existem ${remainingApprovalLogs} log(s) de aprovação relacionados`)
    } else {
      console.log('   ✅ Nenhum registro relacionado encontrado')
    }

    console.log('\n✨ Remoção concluída com sucesso!')

  } catch (error) {
    console.error('\n❌ Erro ao remover usuários:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o script
deleteUsers()
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })

