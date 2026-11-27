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

## E-mails do login

- Os e-mails de **confirmar cadastro** e **redefinir senha** saem do Supabase (Authentication → Emails). Os modelos ficam em `modelos-email/` e são colados à mão no painel. Mudou o arquivo, cole de novo.
  - `confirmar-cadastro.html` → modelo "Confirm signup", assunto: `Gerenciador Transdata: confirme o seu e-mail`.
  - `redefinir-senha.html` → modelo "Reset password", assunto: `Gerenciador Transdata: crie uma nova senha`.
- O link dos e-mails é `/?token_hash=...&type=email|recovery`. A tela de acesso só usa o código quando a pessoa clica no botão. Os filtros do Microsoft 365 abrem os links antes da pessoa, e o link padrão do Supabase (`{{ .ConfirmationURL }}`) chegava já gasto.
- O logo dos e-mails é `email/logo-transdata.png` (publicado neste endereço).
- Remetente provisório: SMTP do Gmail configurado no painel do Supabase, até a TI verificar o domínio itstransdata.com no Resend.

## Testar no computador

1. Rode `npm run build` em cada sistema (`projetostransdata`, `Projeto Transmobile`, `RoadMap de Evolução`).
2. Nesta pasta, rode `node ferramentas/portal-local.mjs` e abra http://localhost:4173.
3. Para trabalhar num sistema com o `npm run dev`, use, por exemplo, `node ferramentas/portal-local.mjs --transdata=http://localhost:8080`.

A pasta `ferramentas/` não é publicada (`.vercelignore`).
