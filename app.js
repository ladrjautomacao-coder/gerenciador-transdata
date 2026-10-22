// Ícones dos cartões (traço arredondado, no estilo do logo). Use o nome em "icone" no config.js.
const ICONES = {
  onibus:
    '<svg viewBox="0 0 24 24"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5V17H5z"/>' +
    '<path d="M5 11h14"/><path d="M9 6.5h6"/><path d="M8 14h.01M16 14h.01"/><path d="M7 17v3M17 17v3"/></svg>',
  satelite:
    '<svg viewBox="0 0 24 24"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/>' +
    '<path d="m8 12 4 4 6-6-4-4z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>',
  cifrao:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/>' +
    '<path d="M15.5 8.5H11a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H8.5"/><path d="M12 6.5v11"/></svg>',
  ferramenta:
    '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94' +
    'l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  caixa:
    '<svg viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73' +
    'l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>' +
    '<path d="m7.5 4.27 9 5.15"/></svg>',
};

// Monta o portal a partir de PORTAL_CONFIG (config.js).
(function () {
  const cfg = PORTAL_CONFIG;

  document.title = cfg.titulo;
  document.getElementById("titulo").textContent = cfg.titulo;
  document.getElementById("subtitulo").textContent = cfg.subtitulo;
  document.getElementById("ano").textContent = new Date().getFullYear();

  const container = document.getElementById("quadrantes");

  cfg.opcoes.forEach(function (opcao, i) {
    const link = document.createElement("a");
    link.className = "quadrante quadrante-" + (i + 1);
    link.href = opcao.url;
    if (opcao.novaAba) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    if (ICONES[opcao.icone]) {
      const icone = document.createElement("span");
      icone.className = "quadrante-icone icone-" + opcao.icone;
      icone.setAttribute("aria-hidden", "true");
      icone.innerHTML = ICONES[opcao.icone];
      link.appendChild(icone);
    }

    const nome = document.createElement("span");
    nome.className = "quadrante-nome";
    nome.textContent = opcao.nome;

    const descricao = document.createElement("span");
    descricao.className = "quadrante-descricao";
    descricao.textContent = opcao.descricao;

    const seta = document.createElement("span");
    seta.className = "quadrante-seta";
    seta.setAttribute("aria-hidden", "true");
    seta.textContent = "→";

    const texto = document.createElement("span");
    texto.className = "quadrante-texto";
    texto.append(nome, descricao);

    link.append(texto, seta);
    container.appendChild(link);
  });

  montarInstitucional(cfg.institucional);
  configurarApp();
})();

// PWA: registra o service worker e oferece a instalação do app.
function configurarApp() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }

  const instalado = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (instalado) return;

  // No celular o botão fica no rodapé; no computador, discreto no canto
  // superior direito, para não empurrar a faixa de Missão/Visão/Valores.
  const celular = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  const botao = document.getElementById(celular ? "instalar" : "instalar-pc");
  const instrucoes = document.getElementById(celular ? "instrucoes" : "instrucoes-pc");
  botao.hidden = false;

  // Chrome/Edge/Samsung no Android avisam quando dá para instalar direto.
  // Esse aviso pode demorar (o Chrome espera a pessoa usar a página por ~30s)
  // ou nunca vir (iPhone, Firefox, navegador de dentro do WhatsApp/Instagram).
  let pedidoInstalacao = null;
  window.addEventListener("beforeinstallprompt", function (evento) {
    evento.preventDefault();
    pedidoInstalacao = evento;
  });

  botao.addEventListener("click", function () {
    if (pedidoInstalacao) {
      pedidoInstalacao.prompt();
      pedidoInstalacao.userChoice.finally(function () { pedidoInstalacao = null; });
      return;
    }
    // Sem o aviso do navegador: mostra o passo a passo do aparelho da pessoa
    instrucoes.innerHTML = celular ? textoInstrucoes() : textoInstrucoesPC();
    instrucoes.hidden = !instrucoes.hidden;
  });

  // No computador, clicar fora ou apertar Esc fecha o passo a passo
  if (!celular) {
    document.addEventListener("click", function (evento) {
      if (!instrucoes.hidden && !instrucoes.contains(evento.target) && !botao.contains(evento.target)) {
        instrucoes.hidden = true;
      }
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") instrucoes.hidden = true;
    });
  }

  window.addEventListener("appinstalled", function () {
    botao.hidden = true;
    instrucoes.hidden = true;
  });
}

function textoInstrucoesPC() {
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) {
    return "<strong>O Firefox não instala sites como aplicativo.</strong><br>" +
      "Abra este endereço no <strong>Microsoft Edge</strong> ou no <strong>Google Chrome</strong> e clique em Instalar app de novo.";
  }
  if (/Edg\//.test(ua)) {
    return "<strong>Para instalar no Edge:</strong><br>" +
      "1. Clique no ícone <strong>Aplicativo disponível</strong> (quadrado com +) na barra de endereço<br>" +
      "&nbsp;&nbsp;&nbsp;&nbsp;ou em <strong>⋯</strong> → <strong>Aplicativos</strong> → <strong>Instalar este site como aplicativo</strong><br>" +
      "2. Clique em <strong>Instalar</strong>";
  }
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    return "<strong>Para instalar no Mac:</strong><br>" +
      "No menu <strong>Arquivo</strong>, clique em <strong>Adicionar ao Dock</strong>.";
  }
  return "<strong>Para instalar no Chrome:</strong><br>" +
    "1. Clique no ícone de <strong>instalar</strong> (monitor com seta) na barra de endereço<br>" +
    "&nbsp;&nbsp;&nbsp;&nbsp;ou em <strong>⋮</strong> → <strong>Transmitir, salvar e compartilhar</strong> → <strong>Instalar página como app</strong><br>" +
    "2. Clique em <strong>Instalar</strong>";
}

function textoInstrucoes() {
  const ua = navigator.userAgent;
  const ehIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const appInterno = /FBAN|FBAV|Instagram|WhatsApp|LinkedInApp|; wv\)/i.test(ua);

  if (appInterno) {
    return "<strong>Você abriu o link por dentro de outro app</strong> (WhatsApp, Instagram...).<br>" +
      "Toque nos <strong>3 pontinhos</strong> e escolha <strong>Abrir no navegador</strong>. " +
      "Lá, toque em <strong>Instalar app</strong> de novo.";
  }
  if (ehIOS) {
    return "<strong>Para instalar no iPhone:</strong><br>" +
      "1. Toque em <strong>Compartilhar</strong> (quadrado com seta ⬆️) na barra do Safari<br>" +
      "2. Toque em <strong>Adicionar à Tela de Início</strong><br>" +
      "3. Toque em <strong>Adicionar</strong>";
  }
  return "<strong>Para instalar no Android:</strong><br>" +
    "1. Toque nos <strong>3 pontinhos ⋮</strong> no canto de cima do navegador<br>" +
    "2. Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong><br>" +
    "3. Confirme em <strong>Instalar</strong>";
}

// Faixa animada que alterna entre Missão, Visão e Valores.
function montarInstitucional(inst) {
  const secao = document.getElementById("institucional");
  if (!inst || !inst.itens || inst.itens.length === 0) {
    secao.remove();
    return;
  }

  const abas = document.getElementById("inst-abas");
  const palco = document.getElementById("inst-palco");
  const barra = document.getElementById("inst-barra");
  const duracao = (inst.segundosPorItem || 8) * 1000;
  let atual = 0;
  let timer = null;

  const slides = inst.itens.map(function (item, i) {
    const aba = document.createElement("button");
    aba.type = "button";
    aba.className = "inst-aba";
    aba.setAttribute("role", "tab");
    aba.textContent = item.titulo;
    aba.addEventListener("click", function () { mostrar(i); });
    abas.appendChild(aba);

    const slide = document.createElement("div");
    slide.className = "inst-slide";

    if (item.valores) {
      const lista = document.createElement("ul");
      lista.className = "inst-valores";
      item.valores.forEach(function (valor, j) {
        const li = document.createElement("li");
        li.textContent = valor;
        li.style.setProperty("--atraso", (j * 0.12) + "s");
        lista.appendChild(li);
      });
      slide.appendChild(lista);
    } else {
      const texto = document.createElement("p");
      texto.className = "inst-texto";
      texto.textContent = item.texto;
      slide.appendChild(texto);
    }

    palco.appendChild(slide);
    return { aba: aba, slide: slide };
  });

  function mostrar(i) {
    atual = i;
    slides.forEach(function (s, j) {
      const ativo = j === i;
      s.slide.classList.toggle("ativo", ativo);
      s.aba.classList.toggle("ativa", ativo);
      s.aba.setAttribute("aria-selected", ativo);
    });
    // Reinicia a barra de progresso
    barra.style.animation = "none";
    void barra.offsetWidth;
    barra.style.animation = "";
    barra.style.animationDuration = duracao + "ms";
    reiniciarTimer();
  }

  function reiniciarTimer() {
    clearInterval(timer);
    if (secao.classList.contains("pausado")) return;
    timer = setInterval(function () {
      mostrar((atual + 1) % slides.length);
    }, duracao);
  }

  // Pausa enquanto o mouse está em cima, para dar tempo de ler
  secao.addEventListener("mouseenter", function () {
    clearInterval(timer);
    secao.classList.add("pausado");
  });
  secao.addEventListener("mouseleave", function () {
    secao.classList.remove("pausado");
    mostrar(atual);
  });

  mostrar(0);
}
