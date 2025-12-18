#!/usr/bin/env node
/**
 * Script para gerar o Service Worker com variáveis de build
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Lê o package.json para obter a versão
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
)

// Gera hash único do build
const buildHash = crypto.randomBytes(8).toString('hex')
const buildTimestamp = Date.now().toString()
const appVersion = packageJson.version || '0.1.0'

// Lê o template do Service Worker
const swTemplatePath = path.join(__dirname, '../public/sw.js')
let swContent = fs.readFileSync(swTemplatePath, 'utf8')

// Substitui as variáveis
swContent = swContent.replace(/\{\{BUILD_VERSION\}\}/g, `${appVersion}-${buildHash.substring(0, 8)}`)
swContent = swContent.replace(/\{\{BUILD_TIMESTAMP\}\}/g, buildTimestamp)

// Escreve o Service Worker gerado
fs.writeFileSync(swTemplatePath, swContent, 'utf8')

console.log('✅ Service Worker gerado com sucesso!')
console.log(`   Versão: ${appVersion}-${buildHash.substring(0, 8)}`)
console.log(`   Timestamp: ${buildTimestamp}`)

// Gera arquivo .env.local com as variáveis de build
const envContent = `# Build variables (gerado automaticamente)
NEXT_PUBLIC_APP_VERSION=${appVersion}
NEXT_PUBLIC_BUILD_HASH=${buildHash}
NEXT_PUBLIC_BUILD_TIMESTAMP=${buildTimestamp}
`

const envPath = path.join(__dirname, '../.env.local')
fs.writeFileSync(envPath, envContent, 'utf8')

console.log('✅ Variáveis de build salvas em .env.local')

