#!/bin/bash
# Script para adicionar colunas de verificação de email ao banco de dados
# Execute: bash scripts/add-email-verification-columns.sh

set -e

echo "🔄 Adicionando colunas de verificação de email..."
echo ""

# Verifica se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está definida"
  echo "   Defina a variável de ambiente DATABASE_URL antes de executar este script"
  exit 1
fi

# Executa o SQL
echo "📝 Executando SQL..."
psql "$DATABASE_URL" -f scripts/add-email-verification-columns.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Colunas adicionadas com sucesso!"
else
  echo ""
  echo "❌ Erro ao executar SQL"
  exit 1
fi

