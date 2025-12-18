# Sistema de Cache Busting e Versionamento

Este documento descreve o sistema implementado para garantir que os usuários sempre tenham a versão mais recente dos recursos da aplicação.

## Visão Geral

O sistema implementa múltiplas estratégias para forçar o navegador a buscar versões atualizadas:

1. **Versionamento de Build** - Hash único gerado a cada build
2. **Service Worker** - Gerencia cache e detecta atualizações
3. **Cache Busting com Query Strings** - Parâmetros únicos nas requisições
4. **Headers HTTP Apropriados** - Cache-Control, ETag
5. **Notificação de Atualizações** - Avisa usuários sobre novas versões

## Componentes

### 1. Sistema de Versionamento (`src/lib/version.ts`)

Fornece funções utilitárias para:
- Obter versão do sistema
- Gerar query strings para cache busting
- Verificar se há nova versão disponível

```typescript
import { getAppVersion, getBuildDate, getCacheBustingQuery } from '@/lib/version'

const version = getAppVersion() // "0.1.0-abc12345"
const buildDate = getBuildDate() // "18/12/2025, 14:30"
const query = getCacheBustingQuery() // "?v=abc12345&t=1734532200000"
```

### 2. Service Worker (`public/sw.js`)

Gerencia cache e detecta atualizações automaticamente:
- **Network First** para APIs e páginas HTML
- **Cache First** para recursos estáticos
- Limpeza automática de caches antigos
- Detecção de novas versões

### 3. Hook de Service Worker (`src/hooks/use-service-worker.ts`)

Hook React para gerenciar o Service Worker:
- Registra o Service Worker automaticamente
- Detecta quando há atualizações disponíveis
- Fornece função para forçar atualização

```typescript
const { isUpdateAvailable, skipWaiting } = useServiceWorker()

if (isUpdateAvailable) {
  // Mostrar notificação
  skipWaiting() // Força atualização
}
```

### 4. Componente de Notificação (`src/components/ui/update-notification.tsx`)

Notifica usuários quando há uma nova versão disponível:
- Aparece automaticamente quando detecta atualização
- Permite atualizar imediatamente ou depois
- Integrado no layout principal

### 5. Middleware (`src/middleware.ts`)

Configura headers HTTP apropriados:
- **Recursos estáticos**: Cache por 1 ano (com validação)
- **Páginas HTML**: Sem cache (sempre buscar versão mais recente)
- **API Routes**: Cache curto (5 minutos)
- **Header de versão**: `X-App-Version`

### 6. Configuração Next.js (`next.config.js`)

- Headers de cache para diferentes tipos de recursos
- Service Worker sem cache
- Geração de nomes de arquivos com hash

## Como Funciona

### Durante o Build

1. Script `prebuild` executa `scripts/build-sw.js`
2. Gera hash único do build
3. Substitui variáveis no Service Worker
4. Cria `.env.local` com variáveis de build

### Durante a Execução

1. Service Worker é registrado automaticamente
2. Hook `useServiceWorker` monitora atualizações
3. Quando há nova versão, notificação aparece
4. Usuário pode atualizar imediatamente ou depois

### Estratégias de Cache

#### Network First (APIs e Páginas)
```
1. Tenta buscar da rede
2. Se falhar, usa cache
3. Se não houver cache, mostra página offline
```

#### Cache First (Recursos Estáticos)
```
1. Verifica cache primeiro
2. Se cache válido (< 24h), retorna do cache
3. Se não houver ou expirado, busca da rede
4. Atualiza cache com nova versão
```

## Configuração

### Variáveis de Ambiente

O sistema usa as seguintes variáveis (geradas automaticamente):

```env
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_BUILD_HASH=abc12345...
NEXT_PUBLIC_BUILD_TIMESTAMP=1734532200000
```

### Scripts NPM

```bash
# Build normal (executa prebuild automaticamente)
npm run build

# Gerar Service Worker manualmente
node scripts/build-sw.js
```

## Página de Settings

A página `/settings` agora exibe:
- Versão do sistema
- Data do build
- Informação sobre atualizações automáticas

## Testando

### Testar Cache Busting

1. Faça um build: `npm run build`
2. Verifique que arquivos têm hash: `_next/static/chunks/chunk-[hash].js`
3. Verifique Service Worker: `public/sw.js` tem variáveis substituídas

### Testar Notificação de Atualização

1. Faça um build e inicie o servidor
2. Abra a aplicação no navegador
3. Faça alterações e faça novo build
4. Recarregue a página - notificação deve aparecer

### Testar Service Worker

1. Abra DevTools > Application > Service Workers
2. Verifique que Service Worker está registrado
3. Force atualização: "Update" button
4. Verifique cache: Application > Cache Storage

## Troubleshooting

### Service Worker não registra

- Verifique se está em HTTPS ou localhost
- Verifique console do navegador para erros
- Verifique se `public/sw.js` existe e está acessível

### Cache não limpa

- Service Worker limpa caches antigos automaticamente
- Se necessário, limpe manualmente: DevTools > Application > Clear Storage

### Notificação não aparece

- Verifique se hook está sendo usado no layout
- Verifique console para erros
- Verifique se Service Worker está ativo

## Melhores Práticas

1. **Sempre faça build antes de deploy** - Garante hash único
2. **Teste em diferentes navegadores** - Service Worker tem suporte variado
3. **Monitore erros do Service Worker** - Use console do navegador
4. **Comunique atualizações importantes** - Use notificação para avisar usuários

## Limitações

- Service Worker requer HTTPS (exceto localhost)
- Alguns navegadores antigos não suportam Service Worker
- Cache pode persistir em dispositivos móveis por mais tempo

## Referências

- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js: Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Web.dev: Cache Strategies](https://web.dev/offline-cookbook/)

