// Painel "Minha conta" (abre pelo rodapé do portal). Usa o cliente do Supabase criado no acesso.js.
// - Trocar e-mail: o Supabase manda o e-mail "Alterar endereço de e-mail". A troca só vale depois do
//   clique no link, que abre a tela de acesso (type=email_change).
// - Trocar senha: se o Supabase pedir confirmação ("Secure password change" ligado e sessão com mais
//   de 24 h), ele manda o e-mail "Reautenticação" com um código, e a senha só muda com o código.
// - Convidar pessoa: só os super admins (função gerenciador-convites). A pessoa recebe o e-mail
//   "Convidar usuário", cria a própria senha e entra como pendente até liberarem os sistemas.
(function () {
  const A = window.PortalAcesso;
  const painel = document.getElementById("painel-conta");
  if (!A || !painel || typeof painel.showModal !== "function") return;
  const sb = A.sb, esc = A.esc, campo = A.campo, dominio = A.dominio;
  const corpo = document.getElementById("painel-conta-corpo");
  const quem = document.getElementById("painel-conta-quem");
  const VOLTA = location.origin + "/";

  let usuario = null;
  let origem = null; // quem abriu o painel recebe o foco de volta
  let podeConvidar = null; // null = ainda não perguntou
  const email = { modo: "ver", aviso: null, valor: "" };
  const senha = { modo: "ver", aviso: null, nova: "" };
  const convite = { aviso: null, nome: "", email: "" };

  // ---------- Utilidades ----------
  function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function senhaBoa(s) { return s.length >= 8 && /[a-z]/i.test(s) && /[0-9]/.test(s); }
  function dominioDe(e) { return (String(e || "").split("@")[1] || "").toLowerCase(); }
  function valor(id) { const el = document.getElementById(id); return el ? el.value : ""; }
  function caixaAviso(a) {
    return a ? '<p class="aviso-acesso ' + a.tipo + '" role="' + (a.tipo === "erro" ? "alert" : "status") + '">' + a.texto + "</p>" : "";
  }
  function botao(texto, opcoes) {
    opcoes = opcoes || {};
    return '<button type="' + (opcoes.enviar ? "submit" : "button") + '" class="botao-acesso' + (opcoes.secundario ? " secundario" : "") + '"' +
      (opcoes.acao ? ' data-acao="' + opcoes.acao + '"' : "") + ">" + texto + "</button>";
  }
  function link(texto, acao) { return '<button type="button" class="link-acesso" data-acao="' + acao + '">' + texto + "</button>"; }
  // Ao mexer numa parte do painel, some o aviso das outras
  function soAvisoDe(parte) {
    if (parte !== "email") email.aviso = null;
    if (parte !== "senha") senha.aviso = null;
    if (parte !== "convite") convite.aviso = null;
  }
  function nomeDe(u) { return (u && u.user_metadata && (u.user_metadata.full_name || u.user_metadata.nome)) || ""; }

  // Erros do Supabase em português, sem culpar a pessoa e com o próximo passo
  function mensagem(erro) {
    const m = ((erro && erro.code) || "") + " " + ((erro && erro.message) || "");
    if (/email_exists|already been registered|already registered|already exists/i.test(m)) return "Este e-mail já é usado por outro acesso.";
    if (/reauthentication_not_valid|nonce|otp_expired|invalid.*(code|token|otp)/i.test(m)) return "Código inválido ou vencido. Confira o código do e-mail ou peça outro.";
    if (/same_password|different from the old/i.test(m)) return "A nova senha precisa ser diferente da atual.";
    if (/weak_password|password should|at least/i.test(m)) return "Senha fraca. Use pelo menos 8 caracteres, com letras e números.";
    if (/rate_limit|rate limit|too many|security purposes/i.test(m)) return "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
    if (/session_not_found|session_expired|bad_jwt|auth session missing|not authenticated/i.test(m)) return "A sua sessão expirou. Saia e entre de novo para continuar.";
    if (/failed to fetch|networkerror|network/i.test(m)) return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
    return "Não foi possível concluir agora. Tente de novo em instantes.";
  }
  function pedeCodigo(erro) {
    const m = ((erro && erro.code) || "") + " " + ((erro && erro.message) || "");
    return /reauthentication_needed|requires reauthentication/i.test(m);
  }

  // ---------- Blocos ----------
  function blocoEmail() {
    let h = '<section class="bloco-conta" aria-labelledby="bc-email"><h3 id="bc-email">E-mail de acesso</h3>';
    if (email.modo === "editar") {
      h += '<form class="form-conta" data-form="email" novalidate>' + caixaAviso(email.aviso) +
        '<p class="texto-conta">E-mail atual: <b>' + esc(usuario.email) + "</b></p>" +
        campo("c-email", "Novo e-mail", "email", { autocomplete: "email", valor: email.valor, placeholder: "nome@" + dominio, dica: "Enviamos um link para confirmar. A troca só vale depois do clique no link." }) +
        '<div class="acoes-conta">' + botao("Enviar confirmação", { enviar: true }) + link("Cancelar", "email-cancelar") + "</div>" +
        "</form>";
    } else {
      h += caixaAviso(email.aviso) +
        '<p class="texto-conta"><b>' + esc(usuario.email) + "</b><br>É com ele que você entra em todos os sistemas.</p>";
      if (usuario.new_email) {
        h += '<p class="pendente-conta">Troca pendente para <b>' + esc(usuario.new_email) + "</b>. Confirme pelo link enviado para esse e-mail. " +
          link("Reenviar link", "email-reenviar") + "</p>";
      }
      h += '<div class="acoes-conta">' + botao("Trocar e-mail", { acao: "email-editar", secundario: true }) + "</div>";
    }
    return h + "</section>";
  }

  function blocoSenha() {
    let h = '<section class="bloco-conta" aria-labelledby="bc-senha"><h3 id="bc-senha">Senha</h3>';
    if (senha.modo === "editar") {
      h += '<form class="form-conta" data-form="senha" novalidate>' + caixaAviso(senha.aviso) +
        campo("c-senha", "Nova senha", "password", { autocomplete: "new-password", dica: "Pelo menos 8 caracteres, com letras e números." }) +
        campo("c-senha2", "Confirmar nova senha", "password", { autocomplete: "new-password" }) +
        '<div class="acoes-conta">' + botao("Salvar nova senha", { enviar: true }) + link("Cancelar", "senha-cancelar") + "</div>" +
        "</form>";
    } else if (senha.modo === "codigo") {
      h += '<form class="form-conta" data-form="codigo" novalidate>' + caixaAviso(senha.aviso) +
        '<p class="texto-conta">Para confirmar que é você, enviamos um código para <b>' + esc(usuario.email) + "</b>.</p>" +
        campo("c-codigo", "Código do e-mail", "text", { autocomplete: "one-time-code", inputmode: "numeric", maxlength: 10, dica: "O código vale por pouco tempo. Não chegou? Veja o lixo eletrônico." }) +
        '<div class="acoes-conta">' + botao("Confirmar e salvar", { enviar: true }) + link("Reenviar código", "senha-reenviar") + link("Cancelar", "senha-cancelar") + "</div>" +
        "</form>";
    } else {
      h += caixaAviso(senha.aviso) +
        '<p class="texto-conta">A mesma senha vale para todos os sistemas.</p>' +
        '<div class="acoes-conta">' + botao("Trocar senha", { acao: "senha-editar", secundario: true }) + "</div>";
    }
    return h + "</section>";
  }

  function blocoConvite() {
    return '<section class="bloco-conta" aria-labelledby="bc-convite">' +
      '<h3 id="bc-convite">Convidar pessoa <span class="selo-admin">Administração</span></h3>' +
      '<p class="texto-conta">A pessoa recebe um e-mail, aceita o convite e cria a própria senha. Ela entra como pendente: depois, libere os sistemas dela nas telas de usuários.</p>' +
      '<form class="form-conta" data-form="convite" novalidate>' + caixaAviso(convite.aviso) +
      campo("c-nome", "Nome completo", "text", { autocomplete: "off", valor: convite.nome }) +
      campo("c-convite", "E-mail", "email", { autocomplete: "off", valor: convite.email, placeholder: "nome@" + dominio }) +
      '<div class="acoes-conta">' + botao("Enviar convite", { enviar: true }) + "</div>" +
      "</form></section>";
  }

  function desenhar(focar) {
    if (!usuario) return;
    // Sem destino pedido, devolve o foco ao mesmo controle depois de redesenhar
    const ativo = document.activeElement;
    if (!focar && ativo && corpo.contains(ativo)) {
      focar = ativo.id || (ativo.dataset.acao ? '[data-acao="' + ativo.dataset.acao + '"]' : "");
    }
    const nome = nomeDe(usuario);
    quem.innerHTML = (nome ? "<b>" + esc(nome) + "</b><br>" : "") + esc(usuario.email || "");
    corpo.innerHTML = blocoEmail() + blocoSenha() + (podeConvidar ? blocoConvite() : "");
    if (focar) {
      const alvo = focar.charAt(0) === "[" ? corpo.querySelector(focar) : document.getElementById(focar);
      if (alvo) alvo.focus();
    }
  }
  function ocupado(form, sim) {
    const b = form && form.querySelector('button[type="submit"]');
    if (b) { b.disabled = sim; b.classList.toggle("carregando", sim); }
  }
  // Não redesenha por trás enquanto a pessoa preenche um formulário
  function editando() {
    const ativo = document.activeElement;
    return email.modo !== "ver" || senha.modo !== "ver" || (corpo.contains(ativo) && ativo.tagName === "INPUT");
  }

  // ---------- Abrir e fechar ----------
  async function abrir() {
    const s = await sb.auth.getSession();
    usuario = s.data && s.data.session && s.data.session.user;
    if (!usuario) return;
    // Foco volta para "Minha conta" ao fechar (no Safari o clique não dá foco ao botão)
    origem = document.getElementById("abrir-conta") || document.activeElement;
    email.modo = "ver"; email.aviso = null; email.valor = "";
    senha.modo = "ver"; senha.aviso = null; senha.nova = "";
    convite.aviso = null;
    desenhar();
    painel.showModal();
    // Dados frescos (troca de e-mail pendente) e se pode convidar
    sb.auth.getUser().then(function (r) {
      if (r.data && r.data.user && painel.open) { usuario = r.data.user; if (!editando()) desenhar(); }
    });
    if (podeConvidar === null) {
      sb.functions.invoke("gerenciador-convites", { body: { acao: "verificar" } }).then(function (r) {
        podeConvidar = !!(r.data && r.data.pode);
        if (podeConvidar && painel.open && !editando()) desenhar();
      }).catch(function () { podeConvidar = false; });
    }
  }
  function fechar() { if (painel.open) painel.close(); }
  painel.addEventListener("close", function () {
    senha.nova = "";
    // O rodapé é redesenhado quando a conta muda; procura o botão de novo
    const alvo = document.getElementById("abrir-conta") || (origem && document.contains(origem) ? origem : null);
    if (alvo) alvo.focus();
  });
  // Clique fora do painel (no fundo escurecido) fecha
  painel.addEventListener("click", function (e) { if (e.target === painel) fechar(); });
  document.getElementById("painel-conta-fechar").addEventListener("click", fechar);

  // ---------- Ações ----------
  corpo.addEventListener("click", async function (e) {
    const olho = e.target.closest(".mostrar-senha");
    if (olho) {
      const input = document.getElementById(olho.dataset.alvo);
      const mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      olho.setAttribute("aria-pressed", String(mostrar));
      olho.setAttribute("aria-label", mostrar ? "Esconder a senha" : "Mostrar a senha");
      return;
    }
    const alvo = e.target.closest("[data-acao]");
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    soAvisoDe(acao.split("-")[0]);
    if (acao === "email-editar") { email.modo = "editar"; email.aviso = null; return desenhar("c-email"); }
    if (acao === "email-cancelar") { email.modo = "ver"; email.aviso = null; email.valor = ""; return desenhar('[data-acao="email-editar"]'); }
    if (acao === "senha-editar") { senha.modo = "editar"; senha.aviso = null; return desenhar("c-senha"); }
    if (acao === "senha-cancelar") { senha.modo = "ver"; senha.aviso = null; senha.nova = ""; return desenhar('[data-acao="senha-editar"]'); }
    if (acao === "email-reenviar") {
      alvo.disabled = true;
      const r = await sb.auth.resend({ type: "email_change", email: usuario.new_email, options: { emailRedirectTo: VOLTA } });
      email.aviso = r.error ? { tipo: "erro", texto: mensagem(r.error) } : { tipo: "ok", texto: "Link reenviado para <b>" + esc(usuario.new_email) + "</b>." };
      return desenhar('[data-acao="email-editar"]');
    }
    if (acao === "senha-reenviar") {
      alvo.disabled = true;
      const r = await sb.auth.reauthenticate();
      senha.aviso = r.error ? { tipo: "erro", texto: mensagem(r.error) } : { tipo: "ok", texto: "Código reenviado para <b>" + esc(usuario.email) + "</b>." };
      return desenhar("c-codigo");
    }
  });

  corpo.addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const tipo = form.dataset.form;
    soAvisoDe(tipo === "codigo" ? "senha" : tipo);

    if (tipo === "email") {
      const novo = valor("c-email").trim().toLowerCase();
      email.valor = novo;
      const atual = String(usuario.email || "").toLowerCase();
      if (!emailValido(novo)) { email.aviso = { tipo: "erro", texto: "Informe o novo e-mail." }; return desenhar("c-email"); }
      if (novo === atual) { email.aviso = { tipo: "erro", texto: "Este já é o seu e-mail atual." }; return desenhar("c-email"); }
      if (dominioDe(novo) !== dominio && dominioDe(novo) !== dominioDe(atual)) {
        email.aviso = { tipo: "erro", texto: "Use um e-mail @" + esc(dominio) + "." };
        return desenhar("c-email");
      }
      ocupado(form, true);
      const r = await sb.auth.updateUser({ email: novo }, { emailRedirectTo: VOLTA });
      ocupado(form, false);
      if (r.error) { email.aviso = { tipo: "erro", texto: mensagem(r.error) }; return desenhar("c-email"); }
      if (r.data && r.data.user) usuario = r.data.user;
      email.modo = "ver";
      email.valor = "";
      email.aviso = { tipo: "ok", texto: "Enviamos um link de confirmação para <b>" + esc(novo) + "</b>. A troca só vale depois do clique no link. Se chegar um link também no e-mail atual, confirme os dois." };
      return desenhar('[data-acao="email-editar"]');
    }

    if (tipo === "senha") {
      const nova = valor("c-senha"), nova2 = valor("c-senha2");
      if (!senhaBoa(nova)) { senha.aviso = { tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres, com letras e números." }; return desenhar("c-senha"); }
      if (nova !== nova2) { senha.aviso = { tipo: "erro", texto: "As senhas não conferem." }; return desenhar("c-senha2"); }
      ocupado(form, true);
      const r = await sb.auth.updateUser({ password: nova });
      if (r.error && pedeCodigo(r.error)) {
        // O Supabase pede confirmação: manda o código por e-mail (modelo "Reautenticação")
        const c = await sb.auth.reauthenticate();
        ocupado(form, false);
        if (c.error) { senha.aviso = { tipo: "erro", texto: mensagem(c.error) }; return desenhar("c-senha"); }
        senha.nova = nova;
        senha.modo = "codigo";
        senha.aviso = null;
        return desenhar("c-codigo");
      }
      ocupado(form, false);
      if (r.error) { senha.aviso = { tipo: "erro", texto: mensagem(r.error) }; return desenhar("c-senha"); }
      senha.modo = "ver";
      senha.aviso = { tipo: "ok", texto: "Senha trocada. Use a nova senha nos próximos acessos." };
      return desenhar('[data-acao="senha-editar"]');
    }

    if (tipo === "codigo") {
      const codigo = valor("c-codigo").replace(/\s+/g, "");
      if (!/^\d{6,10}$/.test(codigo)) { senha.aviso = { tipo: "erro", texto: "Informe o código de números que enviamos por e-mail." }; return desenhar("c-codigo"); }
      ocupado(form, true);
      const r = await sb.auth.updateUser({ password: senha.nova, nonce: codigo });
      ocupado(form, false);
      if (r.error) { senha.aviso = { tipo: "erro", texto: mensagem(r.error) }; return desenhar("c-codigo"); }
      senha.nova = "";
      senha.modo = "ver";
      senha.aviso = { tipo: "ok", texto: "Senha trocada. Use a nova senha nos próximos acessos." };
      return desenhar('[data-acao="senha-editar"]');
    }

    if (tipo === "convite") {
      const nome = valor("c-nome").trim(), para = valor("c-convite").trim().toLowerCase();
      convite.nome = nome;
      convite.email = para;
      if (!nome) { convite.aviso = { tipo: "erro", texto: "Informe o nome completo da pessoa." }; return desenhar("c-nome"); }
      if (!emailValido(para)) { convite.aviso = { tipo: "erro", texto: "Informe o e-mail da pessoa." }; return desenhar("c-convite"); }
      ocupado(form, true);
      const r = await sb.functions.invoke("gerenciador-convites", { body: { acao: "convidar", nome: nome, email: para } });
      ocupado(form, false);
      if (r.error) {
        let codigo = "";
        try { codigo = (await r.error.context.json()).erro || ""; } catch (err) { /* sem corpo */ }
        const textos = {
          "ja-existe": "Este e-mail já tem acesso ao portal.",
          "dominio": "Este e-mail não é de um domínio liberado para acesso (ex.: @" + esc(dominio) + ").",
          "sem-permissao": "Só os administradores do portal podem convidar pessoas.",
          "limite": "Muitos convites em pouco tempo. Espere alguns minutos e tente de novo.",
          "sem-sessao": "A sua sessão expirou. Saia e entre de novo para continuar.",
        };
        convite.aviso = { tipo: "erro", texto: textos[codigo] || "Não foi possível enviar o convite agora. Tente de novo em instantes." };
        return desenhar("c-convite");
      }
      convite.nome = "";
      convite.email = "";
      convite.aviso = { tipo: "ok", texto: "Convite enviado para <b>" + esc(para) + "</b>." };
      return desenhar("c-nome");
    }
  });

  window.PortalConta = { abrir: abrir, fechar: fechar };
})();
