# Migração: Adicionar Colunas de Verificação de Email

## Problema

O erro `The column User.emailVerificationCode does not exist in the current database` ocorre porque as colunas `emailVerificationCode` e `emailVerificationExpiry` foram adicionadas ao schema do Prisma, mas a migração não foi executada no banco de dados de produção.

## Solução

### Opção 1: Executar Migração via Prisma (Recomendado)

```bash
# Em produção, execute:
npx prisma migrate deploy
```

Isso executará todas as migrações pendentes, incluindo:
- `20250119000000_add_email_verification_fields`

### Opção 2: Executar SQL Manualmente (RECOMENDADO)

#### Método A: Script Node.js (Mais seguro)

```bash
node scripts/add-email-verification-columns.js
```

Este script:
- Verifica se as colunas já existem
- Adiciona apenas se não existirem
- Mostra confirmação visual
- Trata erros adequadamente

#### Método B: Script SQL direto

```bash
# Via psql
psql $DATABASE_URL -f scripts/add-email-verification-columns.sql

# Ou via script bash
bash scripts/add-email-verification-columns.sh
```

#### Método C: SQL Manual

Execute diretamente no banco:

```sql
-- Adiciona colunas se não existirem
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "emailVerificationCode" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);
```

### Opção 3: Via Script Node.js

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$executeRaw\`ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"emailVerificationCode\" TEXT, ADD COLUMN IF NOT EXISTS \"emailVerificationExpiry\" TIMESTAMP(3)\`.then(() => {
  console.log('✅ Colunas adicionadas com sucesso');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ Erro:', err);
  prisma.\$disconnect();
});
"
```

## Verificação

Após executar a migração, verifique se as colunas foram adicionadas:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'User'
  AND column_name IN ('emailVerificationCode', 'emailVerificationExpiry');
```

Deve retornar 2 linhas com as colunas.

## Código Defensivo

O código foi atualizado para usar `select` explícito nas queries críticas, evitando buscar essas colunas quando não são necessárias. Isso permite que o sistema funcione mesmo se as colunas não existirem, mas as funcionalidades de verificação de email de garagem não funcionarão até que a migração seja executada.

## Arquivos Modificados

- `src/app/api/auth/register/route.ts` - Usa `select` explícito
- `src/lib/auth.ts` - Usa `select` explícito na autenticação
- `src/app/api/auth/forgot-password/route.ts` - Usa `select` explícito
- `src/lib/db/users.ts` - Usa `select` explícito
- `src/app/api/garage-admin/verify-email/*` - Usa `select` explícito

## Nota Importante

As funcionalidades de verificação de email para garage owners **não funcionarão** até que a migração seja executada. O código está preparado para não quebrar, mas essas funcionalidades específicas falharão silenciosamente.

