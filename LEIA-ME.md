# Gerenciador Transdata (portal principal)

Página estática na Vercel (projeto `gerenciador-transdata`, https://gerenciador-transdata.vercel.app). Cada push na `main` publica.

## Login único (desde 26/11/2026)

- A tela de acesso deste portal (`acesso.js`) é o **único login** dos sistemas. Ela entra, cria acesso (só @itstransdata.com) e redefine a senha no Supabase "Portal oficial - Transdata".
- Os sistemas abrem **dentro deste endereço**, pelos rewrites do `vercel.json`:
  - `/transdata/` → CS Flow (projeto `projetostransdata`);
  - `/transmobile/` → Transmobile (projeto `transmobile`);
  - `/roadmap/` → Roadmap de Evolução (projeto `roadmap-de-evolucao`).
- Como o endereço é o mesmo, a sessão do Supabase (localStorage, chave `sb-emzqlctomlsjwmgthbkv-auth-token`) vale para todos. Quem entra aqui já está conectado nos sistemas, e sair de um sai de todos.
- Sem sessão, um sistema manda para `/?voltar=<página>`. Depois de entrar, a pessoa volta para essa página; só são aceitos caminhos dos três sistemas.
- `/reset-password` (links antigos de nova senha) vai para `/`.
- O `sw.js` não guarda nem responde nada de `/transdata/`, `/transmobile/` e `/roadmap/`; cada sistema tem o seu service worker.

## Testar no computador

1. Rode `npm run build` em cada sistema (`projetostransdata`, `Projeto Transmobile`, `RoadMap de Evolução`).
2. Nesta pasta, rode `node ferramentas/portal-local.mjs` e abra http://localhost:4173.
3. Para trabalhar num sistema com o `npm run dev`, use, por exemplo, `node ferramentas/portal-local.mjs --transdata=http://localhost:8080`.

A pasta `ferramentas/` não é publicada (`.vercelignore`).
