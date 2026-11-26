// Tela de acesso do portal: entrar, criar acesso (só e-mail do domínio da Transdata) e redefinir senha.
// Usa o mesmo login do CS Flow e do Roadmap (Supabase "Portal oficial - Transdata").
// Quem já tem conta em qualquer desses sistemas entra com o mesmo e-mail e senha.
// Atalhos por link: ?acesso=cadastro abre "Criar acesso" e ?acesso=senha abre "Redefinir senha".
(function () {
  const raiz = document.documentElement;
  // PORTAL_CONFIG vem do config.js (declarado com const: não fica em window)
  const cfg = typeof PORTAL_CONFIG !== "undefined" ? PORTAL_CONFIG.acesso : null;
  const conteudo = document.getElementById("acesso-conteudo");
  const titulo = document.getElementById("acesso-titulo");
  const sub = document.getElementById("acesso-sub");
  const conta = document.getElementById("conta");

  // Textos da marca a partir do config.js
  document.getElementById("acesso-marca-titulo").textContent = PORTAL_CONFIG.titulo;
  const faixaInstitucional = PORTAL_CONFIG.institucional;
  const itensConfigurados = faixaInstitucional && Array.isArray(faixaInstitucional.itens)
    ? faixaInstitucional.itens
    : [];
  const ordemInstitucional = ["Visão", "Missão", "Valores"];
  const itensInstitucionais = ordemInstitucional
    .map(function (nome) { return itensConfigurados.find(function (item) { return item.titulo === nome; }); })
    .filter(Boolean)
    .concat(itensConfigurados.filter(function (item) { return !ordemInstitucional.includes(item.titulo); }));
  const tituloInstitucional = document.getElementById("acesso-visao-titulo");
  const conteudoInstitucional = document.getElementById("acesso-visao-texto");
  const contadorInstitucional = document.getElementById("acesso-institucional-contador");
  const progressoInstitucional = document.getElementById("acesso-institucional-progresso");

  if (itensInstitucionais.length && tituloInstitucional && conteudoInstitucional) {
    let indiceInstitucional = 0;
    const intervalo = Math.max(1, Number(faixaInstitucional.segundosPorItem) || 8) * 1000;

    function mostrarItemInstitucional(item) {
      tituloInstitucional.textContent = item.titulo || "";
      tituloInstitucional.classList.remove("acesso-visao-trocando");
      void tituloInstitucional.offsetWidth;
      tituloInstitucional.classList.add("acesso-visao-trocando");
      if (contadorInstitucional) {
        contadorInstitucional.textContent = String(indiceInstitucional + 1).padStart(2, "0") + " / " + String(itensInstitucionais.length).padStart(2, "0");
      }
      conteudoInstitucional.replaceChildren();
      conteudoInstitucional.classList.remove("acesso-institucional-trocando");
      void conteudoInstitucional.offsetWidth;
      conteudoInstitucional.classList.add("acesso-institucional-trocando");

      if (Array.isArray(item.valores)) {
        const lista = document.createElement("ul");
        lista.className = "acesso-valores";
        item.valores.forEach(function (valor, indice) {
          const linha = document.createElement("li");
          linha.textContent = valor;
          linha.style.setProperty("--atraso", (indice * 0.1) + "s");
          lista.appendChild(linha);
        });
        conteudoInstitucional.appendChild(lista);
      } else {
        const texto = document.createElement("p");
        texto.textContent = item.texto || "";
        conteudoInstitucional.appendChild(texto);
      }

      if (progressoInstitucional) {
        progressoInstitucional.style.animation = "none";
        void progressoInstitucional.offsetWidth;
        progressoInstitucional.style.animationDuration = intervalo + "ms";
        progressoInstitucional.style.animationName = "acesso-institucional-progresso";
      }
    }

    mostrarItemInstitucional(itensInstitucionais[indiceInstitucional]);
    if (itensInstitucionais.length > 1) {
      window.setInterval(function () {
        indiceInstitucional = (indiceInstitucional + 1) % itensInstitucionais.length;
        mostrarItemInstitucional(itensInstitucionais[indiceInstitucional]);
      }, intervalo);
    }
  }

  function mostrarPortal() { raiz.classList.remove("sem-sessao"); raiz.classList.add("com-sessao"); }
  function mostrarAcesso() { raiz.classList.remove("com-sessao"); raiz.classList.add("sem-sessao"); }

  // Sem a biblioteca (ex.: sem internet e sem cópia guardada) o portal abre como antes
  if (!cfg || !window.supabase || !window.supabase.createClient) { mostrarPortal(); return; }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseChave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const ENDERECO = location.origin + location.pathname;
  const dominio = cfg.dominioCadastro;

  const url = location.hash + location.search;
  const pedido = new URLSearchParams(location.search).get("acesso");
  let modo = /type=recovery/.test(url) ? "nova-senha" : pedido === "cadastro" ? "cadastro" : pedido === "senha" ? "esqueci" : "entrar";
  let emailAtual = "";
  let aviso = erroDoLink(url);

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function limparUrl() {
    if (location.hash || location.search) history.replaceState(null, "", location.pathname);
  }
  function erroDoLink(u) {
    if (!/error=|error_code=/.test(u)) return null;
    if (/otp_expired|expired/i.test(u)) return { tipo: "erro", texto: "O link expirou ou já foi usado. Peça um novo abaixo." };
    return { tipo: "erro", texto: "Não foi possível usar este link. Peça um novo abaixo." };
  }
  function dominioOk(email) { return (email.trim().toLowerCase().split("@")[1] || "") === dominio; }
  function emailValido(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }

  // Erros do Supabase em português, sem culpar a pessoa e com o próximo passo
  function traduzir(erro) {
    const m = (erro && erro.message) || "";
    if (/invalid login credentials/i.test(m)) return "E-mail ou senha não conferem. Confira e tente de novo.";
    if (/email not confirmed/i.test(m)) return "nao-confirmado";
    if (/already registered|already exists/i.test(m)) return "Este e-mail já tem acesso. Entre com sua senha ou use “Esqueci minha senha”.";
    if (/rate limit|too many|security purposes/i.test(m)) return "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";
    if (/Cadastro permitido apenas|Database error saving new user/i.test(m)) return "O cadastro é só para e-mails @" + dominio + ".";
    if (/password should|weak|at least/i.test(m)) return "Senha fraca. Use pelo menos 8 caracteres, com letras e números.";
    if (/different from the old|same password/i.test(m)) return "A nova senha precisa ser diferente da anterior.";
    if (/failed to fetch|networkerror|network/i.test(m)) return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
    return "Não foi possível concluir agora. Tente de novo em instantes.";
  }

  const olho = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  function campo(id, rotulo, tipo, extra) {
    extra = extra || {};
    const senha = tipo === "password";
    return '<div class="campo-acesso">' +
      '<label for="' + id + '">' + rotulo + "</label>" +
      '<div class="campo-acesso-caixa">' +
      '<input id="' + id + '" name="' + id + '" type="' + tipo + '"' +
      (extra.autocomplete ? ' autocomplete="' + extra.autocomplete + '"' : "") +
      (extra.valor ? ' value="' + esc(extra.valor) + '"' : "") +
      (extra.placeholder ? ' placeholder="' + esc(extra.placeholder) + '"' : "") +
      (extra.dica ? ' aria-describedby="' + id + '-dica"' : "") + ">" +
      (senha ? '<button type="button" class="mostrar-senha" data-alvo="' + id + '" aria-label="Mostrar a senha" aria-pressed="false">' + olho + "</button>" : "") +
      "</div>" +
      (extra.dica ? '<p class="dica-campo" id="' + id + '-dica">' + extra.dica + "</p>" : "") +
      "</div>";
  }
  function caixaAviso() {
    if (!aviso) return "";
    return '<p class="aviso-acesso ' + aviso.tipo + '" role="' + (aviso.tipo === "erro" ? "alert" : "status") + '">' + aviso.texto + "</p>";
  }
  function link(acao, texto) { return '<button type="button" class="link-acesso" data-ir="' + acao + '">' + texto + "</button>"; }

  // ---------- Telas ----------
  function desenhar() {
    let html = "";
    if (modo === "entrar") {
      titulo.textContent = "Acessar sistemas";
      sub.textContent = "Use o mesmo e-mail e senha do CS Flow e do Roadmap.";
      html = '<form id="form-acesso" novalidate>' + caixaAviso() +
        campo("a-email", "E-mail", "email", { autocomplete: "username", valor: emailAtual, placeholder: "nome@" + dominio }) +
        campo("a-senha", "Senha", "password", { autocomplete: "current-password" }) +
        '<button type="submit" class="botao-acesso">Entrar</button>' +
        "</form>" +
        '<div class="links-acesso">' + link("esqueci", "Esqueci minha senha") +
        "<p>Ainda não tem acesso? " + link("cadastro", "Criar acesso") + "</p></div>";
    } else if (modo === "cadastro") {
      titulo.textContent = "Criar acesso";
      sub.textContent = "Para colaboradores da Transdata. Enviaremos um link para confirmar o seu e-mail.";
      html = '<form id="form-acesso" novalidate>' + caixaAviso() +
        campo("a-nome", "Nome completo", "text", { autocomplete: "name" }) +
        campo("a-email", "E-mail corporativo", "email", { autocomplete: "email", valor: emailAtual, placeholder: "nome@" + dominio, dica: "Use seu e-mail @" + dominio + "." }) +
        campo("a-senha", "Senha", "password", { autocomplete: "new-password", dica: "Pelo menos 8 caracteres, com letras e números." }) +
        campo("a-senha2", "Confirmar senha", "password", { autocomplete: "new-password" }) +
        '<button type="submit" class="botao-acesso">Criar acesso</button>' +
        "</form>" +
        '<div class="links-acesso"><p>Já tem acesso? ' + link("entrar", "Entrar") + "</p></div>";
    } else if (modo === "esqueci") {
      titulo.textContent = "Redefinir senha";
      sub.textContent = "Informe o seu e-mail. Enviaremos um link para criar uma nova senha.";
      html = '<form id="form-acesso" novalidate>' + caixaAviso() +
        campo("a-email", "E-mail", "email", { autocomplete: "email", valor: emailAtual, placeholder: "nome@" + dominio }) +
        '<button type="submit" class="botao-acesso">Enviar link</button>' +
        "</form>" +
        '<div class="links-acesso">' + link("entrar", "Voltar para o login") + "</div>";
    } else if (modo === "confirmar" || modo === "link-enviado") {
      const cadastro = modo === "confirmar";
      titulo.textContent = cadastro ? "Confirme o seu e-mail" : "Verifique o seu e-mail";
      sub.textContent = "";
      html = caixaAviso() +
        '<div class="enviado-acesso">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>' +
        "<p>" + (cadastro
          ? "Enviamos um link de confirmação para <b>" + esc(emailAtual) + "</b>. Abra o e-mail e clique no link para ativar o seu acesso."
          : "Se houver um acesso com <b>" + esc(emailAtual) + "</b>, enviamos um link para criar uma nova senha.") + "</p>" +
        '<p class="dica-campo">Não chegou em alguns minutos? Veja a caixa de spam ou reenvie.</p>' +
        "</div>" +
        '<button type="button" class="botao-acesso secundario" data-reenviar="' + (cadastro ? "signup" : "senha") + '">Reenviar e-mail</button>' +
        '<div class="links-acesso">' + link("entrar", "Voltar para o login") + "</div>";
    } else if (modo === "nova-senha") {
      titulo.textContent = "Criar nova senha";
      sub.textContent = "Escolha a nova senha do seu acesso.";
      html = '<form id="form-acesso" novalidate>' + caixaAviso() +
        campo("a-senha", "Nova senha", "password", { autocomplete: "new-password", dica: "Pelo menos 8 caracteres, com letras e números." }) +
        campo("a-senha2", "Confirmar nova senha", "password", { autocomplete: "new-password" }) +
        '<button type="submit" class="botao-acesso">Salvar nova senha</button>' +
        "</form>" +
        '<div class="links-acesso">' + link("entrar", "Voltar para o login") + "</div>";
    }
    conteudo.innerHTML = html;
    const primeiro = conteudo.querySelector("input");
    if (primeiro && raiz.classList.contains("sem-sessao") && !raiz.classList.contains("abertura")) {
      (primeiro.value ? conteudo.querySelectorAll("input")[1] || primeiro : primeiro).focus();
    }
  }

  function ir(novo, novoAviso) { modo = novo; aviso = novoAviso || null; desenhar(); }
  function ocupado(sim) {
    const botao = conteudo.querySelector(".botao-acesso");
    if (botao) { botao.disabled = sim; botao.classList.toggle("carregando", sim); }
  }
  function valor(id) { const el = document.getElementById(id); return el ? el.value : ""; }

  // ---------- Ações ----------
  async function enviar() {
    const email = valor("a-email").trim().toLowerCase();
    if (email) emailAtual = email;

    if (modo === "entrar") {
      if (!emailValido(email) || !valor("a-senha")) return ir("entrar", { tipo: "erro", texto: "Informe o e-mail e a senha." });
      ocupado(true);
      const r = await sb.auth.signInWithPassword({ email: email, password: valor("a-senha") });
      ocupado(false);
      if (r.error) {
        const t = traduzir(r.error);
        if (t === "nao-confirmado") return ir("confirmar", { tipo: "erro", texto: "Falta confirmar o seu e-mail. Use o link que enviamos ou reenvie abaixo." });
        return ir("entrar", { tipo: "erro", texto: t });
      }
      return; // onAuthStateChange abre o portal
    }

    if (modo === "cadastro") {
      const nome = valor("a-nome").trim(), senha = valor("a-senha"), senha2 = valor("a-senha2");
      if (!nome) return ir("cadastro", { tipo: "erro", texto: "Informe o seu nome completo." });
      if (!emailValido(email) || !dominioOk(email)) return ir("cadastro", { tipo: "erro", texto: "Use o seu e-mail corporativo @" + dominio + "." });
      if (senha.length < 8 || !/[a-z]/i.test(senha) || !/[0-9]/.test(senha)) return ir("cadastro", { tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres, com letras e números." });
      if (senha !== senha2) return ir("cadastro", { tipo: "erro", texto: "As senhas não conferem." });
      ocupado(true);
      const r = await sb.auth.signUp({ email: email, password: senha, options: { data: { full_name: nome }, emailRedirectTo: ENDERECO } });
      ocupado(false);
      if (r.error) return ir("cadastro", { tipo: "erro", texto: traduzir(r.error) });
      // E-mail que já tinha acesso: o Supabase responde sem erro, mas sem identidade nova
      if (r.data && r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) {
        return ir("entrar", { tipo: "erro", texto: "Este e-mail já tem acesso. Entre com a sua senha ou use “Esqueci minha senha”." });
      }
      if (r.data && r.data.session) return; // confirmação desligada: já entra
      return ir("confirmar");
    }

    if (modo === "esqueci") {
      if (!emailValido(email)) return ir("esqueci", { tipo: "erro", texto: "Informe o seu e-mail." });
      ocupado(true);
      const r = await sb.auth.resetPasswordForEmail(email, { redirectTo: ENDERECO });
      ocupado(false);
      if (r.error) return ir("esqueci", { tipo: "erro", texto: traduzir(r.error) });
      return ir("link-enviado");
    }

    if (modo === "nova-senha") {
      const senha = valor("a-senha"), senha2 = valor("a-senha2");
      if (senha.length < 8 || !/[a-z]/i.test(senha) || !/[0-9]/.test(senha)) return ir("nova-senha", { tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres, com letras e números." });
      if (senha !== senha2) return ir("nova-senha", { tipo: "erro", texto: "As senhas não conferem." });
      ocupado(true);
      const r = await sb.auth.updateUser({ password: senha });
      ocupado(false);
      if (r.error) return ir("nova-senha", { tipo: "erro", texto: traduzir(r.error) });
      modo = "entrar";
      aviso = null;
      limparUrl();
      mostrarPortal();
      return;
    }
  }

  async function reenviar(tipo) {
    if (!emailAtual) return ir("entrar");
    const botao = conteudo.querySelector("[data-reenviar]");
    if (botao) { botao.disabled = true; botao.classList.add("carregando"); }
    const r = tipo === "signup"
      ? await sb.auth.resend({ type: "signup", email: emailAtual, options: { emailRedirectTo: ENDERECO } })
      : await sb.auth.resetPasswordForEmail(emailAtual, { redirectTo: ENDERECO });
    ir(modo, r.error ? { tipo: "erro", texto: traduzir(r.error) } : { tipo: "ok", texto: "E-mail reenviado para " + esc(emailAtual) + "." });
  }

  conteudo.addEventListener("submit", function (e) { e.preventDefault(); enviar(); });
  conteudo.addEventListener("click", function (e) {
    const alvo = e.target.closest("[data-ir], [data-reenviar], .mostrar-senha");
    if (!alvo) return;
    if (alvo.dataset.ir) {
      const email = valor("a-email").trim();
      if (email) emailAtual = email.toLowerCase();
      if (alvo.dataset.ir === "entrar" && modo === "nova-senha") sb.auth.signOut();
      return ir(alvo.dataset.ir);
    }
    if (alvo.dataset.reenviar) return reenviar(alvo.dataset.reenviar);
    if (alvo.classList.contains("mostrar-senha")) {
      const input = document.getElementById(alvo.dataset.alvo);
      const mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      alvo.setAttribute("aria-pressed", String(mostrar));
      alvo.setAttribute("aria-label", mostrar ? "Esconder a senha" : "Mostrar a senha");
    }
  });

  // ---------- Conta no rodapé ----------
  function mostrarConta(sessao) {
    if (!sessao) { conta.hidden = true; conta.innerHTML = ""; return; }
    const u = sessao.user || {};
    const nome = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.nome)) || u.email || "";
    conta.innerHTML = "Conectado como <b>" + esc(nome) + '</b> · <button type="button" class="link-sair" id="sair">Sair</button>';
    conta.hidden = false;
    document.getElementById("sair").addEventListener("click", async function () {
      await sb.auth.signOut();
      emailAtual = u.email || "";
      ir("entrar");
      mostrarAcesso();
    });
  }

  // ---------- Sessão ----------
  sb.auth.onAuthStateChange(function (evento, sessao) {
    if (evento === "PASSWORD_RECOVERY") { modo = "nova-senha"; aviso = null; desenhar(); mostrarAcesso(); return; }
    if (modo === "nova-senha" && sessao) { desenhar(); mostrarAcesso(); return; }
    if (sessao) {
      mostrarConta(sessao);
      mostrarPortal();
      if (/access_token=|[?&]code=/.test(location.hash + location.search)) limparUrl();
    } else {
      mostrarConta(null);
      mostrarAcesso();
      desenhar();
    }
  });

  desenhar();
})();
