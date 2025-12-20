Ajuste no Cloudflare (passo a passo) para evitar “Application error / chunk mismatch / NextAuth failed to fetch” com Next.js + Service Worker.

## 1) Desativar Rocket Loader (obrigatório)
1. Cloudflare Dashboard → selecione seu domínio
2. Speed → Optimization
3. Rocket Loader → Off
4. Salve
## 2) Criar Cache Rules para NÃO cachear sw.js e APIs (obrigatório)
1. Caching → Cache Rules
2. Create rule (Regra 1)
   - Name: Bypass sw.js
   - When incoming requests match…
     - URI Path equals /sw.js
   - Then…
     - Cache eligibility: Bypass cache
3. Create rule (Regra 2)
   - Name: Bypass API
   - URI Path starts with /api/
   - Then: Bypass cache
4. Salve as regras
## 3) (Recomendado) Não cachear rotas autenticadas (HTML)
Crie mais regras iguais às anteriores, com Bypass cache , para:

- URI Path equals /signin
- URI Path equals /signup
- URI Path starts with /dashboard
- URI Path starts with /profile
- URI Path starts with /admin
- URI Path starts with /garage-admin
Isso evita Cloudflare servir HTML antigo durante deploy (que referencia chunks novos/velhos).

## 4) Configurar Browser Cache TTL para respeitar o origin
1. Caching → Configuration
2. Browser Cache TTL → Respect Existing Headers
3. Salve
## 5) Se você usa APO (Automatic Platform Optimization)
1. Speed → Optimization
2. Automatic Platform Optimization (APO) :
   - Se estiver ON , recomendo OFF para este app, ou ao menos garantir que não cacheia rotas autenticadas.
   - O APO pode cachear HTML e aumentar muito o risco de mismatch.
## 6) Purge correto após deploy
Quando fizer deploy:

1. Cloudflare → Caching → Purge Cache
2. Clique Purge Everything
   - (ou pelo menos purge de /sw.js e das rotas que você alterou)
## 7) Conferência rápida (o que você deve ver)
Depois de aplicar as regras:

- /sw.js deve voltar sempre com headers “no-cache/no-store” (ou pelo menos sem cache no edge)
- /api/auth/session deve ser sempre “dynamic” (sem cache)
- Em caso de update, o SW novo deve assumir e limpar caches antigos sem exigir que o usuário limpe manualmente

Para saber se você está usando APO (Automatic Platform Optimization) no Cloudflare:

- Entre no Cloudflare Dashboard e selecione seu domínio
- Vá em Speed → Optimization
- Procure a seção Automatic Platform Optimization (APO) (às vezes aparece como “APO for WordPress”, dependendo do plano)
  - Se o toggle estiver ON/Enabled , você está usando APO
  - Se estiver OFF/Disabled , não está
Outros sinais comuns:

- Você instalou/ativou o app “Cloudflare APO” no Cloudflare Apps/Marketplace (ou conectou a um WordPress).
- No Caching → Configuration , aparecem opções relacionadas a APO/edge caching de HTML.
Se você não encontrar “APO” nessa tela, normalmente significa que:

- o recurso não está disponível no seu plano, ou
- não está habilitado para esse domínio.
Se quiser confirmar 100%: me diga seu plano Cloudflare (Free/Pro/Business) e se o site é WordPress ou não.

Com plano Free e site não-WordPress , a chance de você estar usando APO é praticamente zero .

- O APO do Cloudflare é focado em WordPress e normalmente aparece como “APO for WordPress” (via app/plugin).
- Se você não instalou nada de WordPress no Cloudflare Apps e não tem a seção “APO” em Speed → Optimization , então você não está usando APO .
O que ainda pode causar o problema no Free (e é o mais comum):

- Rocket Loader ligado (desligue)
- Cache Rules/Page Rules não configuradas (principalmente para /sw.js e /api/* )
- Cache de HTML no edge por alguma regra/page rule antiga
- Deploy com versões diferentes por alguns instantes (Coolify)
Se você quiser checar rápido no painel:

- Speed → Optimization : confirme Rocket Loader = Off
- Rules → Cache Rules (ou Page Rules , se você usa as antigas): veja se existe alguma regra do tipo “Cache Everything” para /* — se existir, isso precisa ser removido ou excluído para rotas autenticadas e para /sw.js / /api/* .