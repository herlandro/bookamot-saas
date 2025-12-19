#!/bin/bash
# Script para corrigir a migração de email verification fields
# Cria a migração manualmente sem precisar de shadow database

set -e

echo "🔄 Corrigindo migração de email verification fields..."
echo ""

# Passo 1: Remover migração antiga (já foi feito)
echo "📝 Passo 1: Verificando migração antiga..."
if [ -d "prisma/migrations/20250119000000_add_email_verification_fields" ]; then
  rm -rf prisma/migrations/20250119000000_add_email_verification_fields
  echo "✅ Migração antiga removida"
else
  echo "ℹ️  Migração antiga não encontrada (já foi removida)"
fi

# Passo 2: Criar nova migração manualmente com timestamp atual
echo ""
echo "📝 Passo 2: Criando nova migração manualmente..."

# Gerar timestamp no formato YYYYMMDDHHMMSS (usando data atual)
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_NAME="add_email_verification_fields"
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}"
MIGRATION_FILE="${MIGRATION_DIR}/migration.sql"

# Criar diretório
mkdir -p "$MIGRATION_DIR"

# Criar arquivo SQL
cat > "$MIGRATION_FILE" << 'EOF'
-- AlterTable: Add email verification fields to User table
-- These fields are used for garage owner email verification
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);
EOF

echo "✅ Migração criada em: $MIGRATION_DIR"
echo ""
echo "📄 Conteúdo da migração:"
cat "$MIGRATION_FILE"
echo ""

# Passo 3: Aplicar migração localmente (opcional)
echo "📝 Passo 3: Aplicar migração localmente?"
read -p "Deseja aplicar a migração agora? (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  npx prisma migrate deploy
  echo "✅ Migração aplicada localmente"
else
  echo "ℹ️  Migração não aplicada localmente (será aplicada no próximo deploy)"
fi

echo ""
echo "✨ Processo concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique o arquivo: $MIGRATION_FILE"
echo "   2. Faça commit: git add prisma/migrations/"
echo "   3. Commit: git commit -m 'fix: add email verification fields migration with correct timestamp'"
echo "   4. Push: git push"
echo ""
echo "🚀 No próximo deploy do Coolify, a migração será aplicada automaticamente!"