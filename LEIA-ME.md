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

- Os e-mails do login saem do Supabase (Authentication → E-mails → Modelos). Os modelos ficam em `modelos-email/` e são colados à mão no painel.
- Para mudar um modelo, edite `ferramentas/gerar-modelos-email.mjs`, rode `node ferramentas/gerar-modelos-email.mjs` e cole de novo no painel o arquivo que mudou.

  | Arquivo | Modelo no painel | Assunto |
  |---|---|---|
  | `confirmar-cadastro.html` | Confirme o cadastro | `Gerenciador Transdata: confirme o seu e-mail` |
  | `convidar-usuario.html` | Convidar usuário | `Gerenciador Transdata: você recebeu um convite` |
  | `link-magico.html` | Link mágico ou OTP | `Gerenciador Transdata: seu link de acesso` |
  | `alterar-email.html` | Alterar endereço de e-mail | `Gerenciador Transdata: confirme a troca de e-mail` |
  | `redefinir-senha.html` | Redefinir senha | `Gerenciador Transdata: crie uma nova senha` |
  | `reautenticacao.html` | Reautenticação | `Gerenciador Transdata: seu código de verificação` |

- Quem dispara cada e-mail:
  - **Confirme o cadastro**: "Criar acesso".
  - **Redefinir senha**: "Esqueci minha senha" e as telas de usuários.
  - **Convidar usuário**: "Convidar pessoa" em Minha conta.
  - **Alterar endereço de e-mail**: "Trocar e-mail" em Minha conta.
  - **Reautenticação**: "Trocar senha" em Minha conta, quando o Supabase pede o código.
  - **Link mágico**: não é usado.
- O link dos e-mails é `/?token_hash=...&type=email|recovery|invite|magiclink|email_change`.
  - A tela de acesso só usa o código quando a pessoa clica no botão. Os filtros do Microsoft 365 abrem os links antes da pessoa, e o link padrão do Supabase (`{{ .ConfirmationURL }}`) chegava já gasto.
  - Depois do clique, nova senha e convite pedem a senha; os outros tipos já entram no portal.
  - A reautenticação não tem link, só o código (`{{ .Token }}`).
- O logo dos e-mails é `email/logo-transdata.png` (publicado neste endereço).
- Remetente provisório: SMTP do Gmail configurado no painel do Supabase, até a TI verificar o domínio itstransdata.com no Resend.

## Minha conta (`conta.js`)

O rodapé "Conectado como … · Minha conta · Sair" abre um painel lateral.

- **Trocar e-mail**
  - O novo e-mail precisa ser @itstransdata.com ou do mesmo domínio do atual.
  - O Supabase manda o link de confirmação, e a troca só vale depois do clique.
  - Com "Secure email change" ligado no Supabase, chega link nos dois endereços e os dois precisam ser confirmados.
  - Os acessos dos sistemas são ligados ao id da conta, então nada se perde na troca.
- **Trocar senha**
  - Quando o Supabase pede confirmação ("Secure password change" ligado e sessão com mais de 24 h), o painel manda o código por e-mail e só troca a senha com ele.
- **Convidar pessoa**
  - Só para os super admins. Usa a função `gerenciador-convites` (`supabase/functions/`, com verify_jwt ligado). A lista de super admins, por id, fica nela.
  - A pessoa convidada cria a senha pelo link e entra no CS Flow como "pendente", como quem usa "Criar acesso".
  - Só domínios liberados (gatilho `enforce_signup_domain`).

A pasta `supabase/` não é publicada na Vercel. A função é publicada no Supabase "Portal oficial - Transdata".

## Testar no computador

1. Rode `npm run build` em cada sistema (`projetostransdata`, `Projeto Transmobile`, `RoadMap de Evolução`).
2. Nesta pasta, rode `node ferramentas/portal-local.mjs` e abra http://localhost:4173.
3. Para trabalhar num sistema com o `npm run dev`, use, por exemplo, `node ferramentas/portal-local.mjs --transdata=http://localhost:8080`.

A pasta `ferramentas/` não é publicada (`.vercelignore`).
