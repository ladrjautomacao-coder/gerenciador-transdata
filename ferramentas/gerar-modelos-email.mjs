// Gera os modelos dos e-mails do login (modelos-email/*.html) a partir de um layout só.
// Rode "node ferramentas/gerar-modelos-email.mjs" e cole cada arquivo no Supabase
// (Authentication → E-mails → Modelos). A tabela de assuntos está no LEIA-ME.md.
//
// Os links levam para a tela de acesso do portal com ?token_hash=...&type=<tipo>. O acesso.js só
// usa o código quando a pessoa clica no botão (os filtros do Microsoft 365 abrem os links antes).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTAL = "https://gerenciador-transdata.vercel.app";
const LETRA = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const I = "              "; // recuo do conteúdo dentro do cartão

const linkDoPortal = (tipo) => `${PORTAL}/?token_hash={{ .TokenHash }}&amp;type=${tipo}`;

// ---------- Blocos ----------
const saudacao = () =>
  `${I}<p style="margin:0 0 12px;font-size:16px;line-height:25px;">{{ if .Data.full_name }}Olá, {{ .Data.full_name }}{{ else }}Olá{{ end }}</p>`;
// "e-mail" não quebra no hífen
const paragrafo = (html, ultimo = false) =>
  `${I}<p style="margin:0 0 ${ultimo ? 26 : 14}px;font-size:16px;line-height:25px;">${html.replace(/\be-mail\b/g, '<span style="white-space:nowrap;">e-mail</span>')}</p>`;
const destaque = (texto) => `<b style="color:#2a0b45;">${texto}</b>`;
const botao = (url, texto) => `${I}<!-- Botão -->
${I}<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">
${I}  <tr>
${I}    <td bgcolor="#4d1476" style="background-color:#4d1476;border-radius:10px;">
${I}      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${LETRA};font-size:16px;line-height:20px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;border:1px solid #4d1476;">${texto}</a>
${I}    </td>
${I}  </tr>
${I}</table>`;
const nota = (texto) => `${I}<p style="margin:0 0 28px;font-size:13px;line-height:20px;color:#6b5b7b;">${texto}</p>`;
const NOTA_LINK = "Por segurança, o link vale por pouco tempo e só pode ser usado uma vez.";
const codigo = (rotulo) => `${I}<!-- Código -->
${I}<p style="margin:0 0 8px;font-size:14px;line-height:20px;color:#3a2950;">${rotulo}</p>
${I}<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">
${I}  <tr>
${I}    <td bgcolor="#f6f1fb" style="background-color:#f6f1fb;border:1px dashed #cdbfe0;border-radius:10px;padding:12px 22px;font-family:Consolas,'Courier New',monospace;font-size:28px;line-height:34px;font-weight:bold;letter-spacing:6px;color:#2a0b45;">{{ .Token }}</td>
${I}  </tr>
${I}</table>`;
const passo = (n, texto) => `${I}  <tr>
${I}    <td style="padding:0 0 8px;">
${I}      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${I}        <td valign="top" width="30" style="width:30px;padding-top:1px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:11px;background-color:#f1e8fa;color:#4d1476;font-size:12px;font-weight:bold;text-align:center;">${n}</span></td>
${I}        <td style="font-size:14px;line-height:22px;color:#3a2950;">${texto}</td>
${I}      </tr></table>
${I}    </td>
${I}  </tr>`;
const passos = (titulo, itens) => `${I}<!-- Próximos passos -->
${I}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
${I}  <tr>
${I}    <td style="padding:0 0 10px;font-size:14px;line-height:20px;font-weight:bold;color:#2a0b45;">${titulo}</td>
${I}  </tr>
${itens.map((t, i) => passo(i + 1, t)).join("\n")}
${I}</table>`;
const naoPediu = (pergunta, texto) => `${I}<!-- Não pediu -->
${I}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
${I}  <tr>
${I}    <td bgcolor="#f6f1fb" style="background-color:#f6f1fb;border-left:3px solid #a64bf4;border-radius:8px;padding:14px 16px;font-size:14px;line-height:21px;color:#3a2950;">
${I}      <b style="color:#2a0b45;">${pergunta}</b> ${texto}
${I}    </td>
${I}  </tr>
${I}</table>`;
const linkReserva = (url) => `${I}<p style="margin:0 0 6px;font-size:12px;line-height:18px;color:#8a7b99;">Se o botão não abrir, copie e cole este endereço no navegador:</p>
${I}<p style="margin:0;font-size:12px;line-height:18px;word-break:break-all;"><a href="${url}" target="_blank" style="color:#4d1476;text-decoration:underline;">${url}</a></p>`;
// Último bloco sem margem embaixo
const fim = (html) => html.replace(/margin:0 0 24px;">\n([\s\S]*)$/, "margin:0;\">\n$1");

// ---------- Layout ----------
function layout({ titulo, previa, rotulo, corpo }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${titulo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Exo:wght@700&amp;display=swap" rel="stylesheet">
  <!--[if mso]><style>table,td,p,a,span,h1{font-family:Arial,sans-serif !important;}</style><![endif]-->
  <style>
    body { margin: 0; padding: 0; }
    a { text-decoration: none; }
    @media (max-width: 600px) {
      .td-moldura { padding: 16px 10px !important; }
      .td-topo { padding: 22px 24px !important; }
      .td-corpo { padding: 28px 24px 24px !important; }
      .td-rodape { padding: 18px 24px !important; }
      .titulo { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3eff8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3eff8;font-size:1px;line-height:1px;">${previa}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3eff8" style="background-color:#f3eff8;">
    <tr>
      <td class="td-moldura" align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;border-collapse:separate;background-color:#ffffff;border:1px solid #e4dcef;border-radius:16px;overflow:hidden;">
          <!-- Topo com a marca -->
          <tr>
            <td class="td-topo" bgcolor="#4d1476" style="background-color:#4d1476;background-image:linear-gradient(135deg,#5c1a8c 0%,#4d1476 55%,#2f0b4c 100%);padding:26px 40px;border-radius:15px 15px 0 0;">
              <img src="${PORTAL}/email/logo-transdata.png" width="200" height="67" alt="TRANSDATA" style="display:block;width:200px;height:auto;border:0;outline:none;color:#ffffff;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;letter-spacing:2px;">
            </td>
          </tr>
          <tr>
            <td height="4" bgcolor="#f0523d" style="height:4px;line-height:4px;font-size:4px;background-color:#f0523d;background-image:linear-gradient(90deg,#ff7a00 0%,#f0523d 35%,#ff1a52 70%,#d6248f 100%);">&nbsp;</td>
          </tr>
          <!-- Mensagem -->
          <tr>
            <td class="td-corpo" style="padding:36px 40px 28px;font-family:${LETRA};color:#3a2950;">
              <p style="margin:0 0 10px;font-size:12px;line-height:16px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#b4205f;">${rotulo}</p>
              <h1 class="titulo" style="margin:0 0 20px;font-family:Exo,${LETRA};font-size:26px;line-height:32px;font-weight:700;color:#2a0b45;">${titulo}</h1>
${corpo.join("\n")}
            </td>
          </tr>
          <!-- Rodapé -->
          <tr>
            <td class="td-rodape" bgcolor="#faf8fc" style="background-color:#faf8fc;border-top:1px solid #eee7f5;padding:20px 40px;border-radius:0 0 15px 15px;font-family:${LETRA};font-size:12px;line-height:18px;color:#8a7b99;">
              <b style="color:#4d1476;">Gerenciador Transdata</b> · Diretoria de Negócios<br>
              Um só acesso para todos os sistemas da Transdata.<br>
              Mensagem automática, não é preciso responder.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// ---------- Modelos (na ordem do painel do Supabase) ----------
const MODELOS = [
  {
    arquivo: "confirmar-cadastro.html",
    painel: "Confirme o cadastro (Confirm signup)",
    assunto: "Gerenciador Transdata: confirme o seu e-mail",
    titulo: "Confirme o seu e-mail",
    previa: "Confirme o seu e-mail para ativar o acesso ao Gerenciador Transdata.",
    rotulo: "Confirmação de cadastro",
    corpo: [
      saudacao(),
      paragrafo(`Recebemos o seu pedido de acesso ao Gerenciador Transdata com o e-mail ${destaque("{{ .Email }}")}. Confirme que este e-mail é seu para ativar o acesso.`, true),
      botao(linkDoPortal("email"), "Confirmar meu e-mail"),
      nota(NOTA_LINK),
      passos("Depois da confirmação", [
        "Ao confirmar, você já entra no portal. Nas próximas vezes, use o e-mail e a senha que cadastrou.",
        "Os administradores liberam os sistemas que você vai usar.",
      ]),
      naoPediu("Não pediu?", "Pode ignorar este e-mail. Sem a confirmação, o acesso não é ativado."),
      linkReserva(linkDoPortal("email")),
    ],
  },
  {
    arquivo: "convidar-usuario.html",
    painel: "Convidar usuário (Invite user)",
    assunto: "Gerenciador Transdata: você recebeu um convite",
    titulo: "Você recebeu um convite",
    previa: "Aceite o convite e crie a sua senha do Gerenciador Transdata.",
    rotulo: "Convite de acesso",
    corpo: [
      saudacao(),
      paragrafo(`Você foi convidado para acessar o Gerenciador Transdata com o e-mail ${destaque("{{ .Email }}")}. Com um só acesso você entra nos sistemas da Transdata liberados para você.`, true),
      botao(linkDoPortal("invite"), "Aceitar convite"),
      nota(NOTA_LINK),
      passos("Como funciona", [
        "Ao aceitar, você escolhe a senha do seu acesso.",
        "Nas próximas vezes, entre com o seu e-mail e essa senha.",
      ]),
      naoPediu("Não esperava?", "Pode ignorar este e-mail. Sem aceitar o convite, o acesso não é criado."),
      linkReserva(linkDoPortal("invite")),
    ],
  },
  {
    arquivo: "link-magico.html",
    painel: "Link mágico ou OTP (Magic link)",
    assunto: "Gerenciador Transdata: seu link de acesso",
    titulo: "Entre no portal",
    previa: "Use o botão para entrar no Gerenciador Transdata sem digitar a senha.",
    rotulo: "Acesso por e-mail",
    corpo: [
      saudacao(),
      paragrafo(`Use o botão para entrar no Gerenciador Transdata com o e-mail ${destaque("{{ .Email }}")}, sem digitar a senha.`, true),
      botao(linkDoPortal("magiclink"), "Entrar no portal"),
      nota(NOTA_LINK),
      codigo("Se a tela pedir um código, use este:"),
      nota("O código também vale por pouco tempo."),
      naoPediu("Não pediu?", "Pode ignorar este e-mail. Ninguém entra no seu acesso sem este link ou este código."),
      linkReserva(linkDoPortal("magiclink")),
    ],
  },
  {
    arquivo: "alterar-email.html",
    painel: "Alterar endereço de e-mail (Change email address)",
    assunto: "Gerenciador Transdata: confirme a troca de e-mail",
    titulo: "Confirme a troca de e-mail",
    previa: "Confirme a troca do e-mail do seu acesso ao Gerenciador Transdata.",
    rotulo: "Troca de e-mail",
    corpo: [
      saudacao(),
      paragrafo(`Recebemos um pedido para trocar o e-mail do seu acesso ao Gerenciador Transdata de ${destaque("{{ .Email }}")} para ${destaque("{{ .NewEmail }}")}.`),
      paragrafo("Confirme para concluir a troca. Depois dela, você passa a entrar com o novo e-mail.", true),
      botao(linkDoPortal("email_change"), "Confirmar troca de e-mail"),
      nota(NOTA_LINK),
      naoPediu("Não pediu?", "Não clique no botão e avise o administrador do portal. O seu e-mail atual continua valendo."),
      linkReserva(linkDoPortal("email_change")),
    ],
  },
  {
    arquivo: "redefinir-senha.html",
    painel: "Redefinir senha (Reset password)",
    assunto: "Gerenciador Transdata: crie uma nova senha",
    titulo: "Crie uma nova senha",
    previa: "Use o botão para criar uma nova senha. O link vale por pouco tempo e só pode ser usado uma vez.",
    rotulo: "Redefinição de senha",
    corpo: [
      saudacao(),
      paragrafo(`Recebemos um pedido para criar uma nova senha para o acesso ${destaque("{{ .Email }}")} no Gerenciador Transdata. A nova senha vale para todos os sistemas: CS Flow, Transmobile e Roadmap de Evolução.`, true),
      botao(linkDoPortal("recovery"), "Criar nova senha"),
      nota(NOTA_LINK),
      naoPediu("Não pediu?", "Pode ignorar este e-mail. Sua senha atual continua valendo."),
      linkReserva(linkDoPortal("recovery")),
    ],
  },
  {
    arquivo: "reautenticacao.html",
    painel: "Reautenticação (Reauthentication)",
    assunto: "Gerenciador Transdata: seu código de verificação",
    titulo: "Seu código de verificação",
    previa: "Use o código deste e-mail para confirmar que é você.",
    rotulo: "Verificação de segurança",
    corpo: [
      saudacao(),
      paragrafo("Para concluir uma alteração no seu acesso ao Gerenciador Transdata, confirme que é você com o código abaixo.", true),
      codigo("Código de verificação:"),
      nota("O código vale por pouco tempo e só pode ser usado uma vez."),
      fim(naoPediu("Não pediu?", "Não passe este código para ninguém e avise o administrador do portal.")),
    ],
  },
];

const pasta = path.join(RAIZ, "modelos-email");
fs.mkdirSync(pasta, { recursive: true });
for (const m of MODELOS) {
  fs.writeFileSync(path.join(pasta, m.arquivo), layout(m));
  console.log(`${m.arquivo.padEnd(24)} → ${m.painel} | assunto: ${m.assunto}`);
}

