-- Script para adicionar colunas de verificação de email à tabela User
-- Execute este script diretamente no banco de dados de produção se a migração não foi aplicada

-- Adiciona colunas se não existirem
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

-- Verifica se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'User'
  AND column_name IN ('emailVerificationCode', 'emailVerificationExpiry');

