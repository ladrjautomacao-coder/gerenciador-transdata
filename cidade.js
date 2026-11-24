// Cidade ao fundo da tela inicial e abertura animada.
// Na abertura a cidade sobe no horizonte, as janelas acendem e rastros de luz
// saem das ruas até o T do logo; depois entram o título e os cartões (CSS em
// style.css, classes "abertura" e "abertura-roda"). Toca uma vez por visita;
// depois a cidade fica parada como fundo. Um clique ou tecla pula a abertura.
(function () {
  const raiz = document.documentElement;
  const DURACAO = 4.6; // segundos até tudo estar no lugar

  const fundo = document.createElement("canvas");
  fundo.className = "cidade";
  fundo.setAttribute("aria-hidden", "true");
  document.body.prepend(fundo);
  const ctx = fundo.getContext("2d");
  if (!ctx) {
    raiz.classList.remove("abertura", "abertura-roda");
    return;
  }

  // ---------- Utilitários ----------
  const clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  const suave = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const saida = function (x) { return 1 - Math.pow(1 - x, 3); };
  const linear = function (x) { return x; };
  function trecho(t, a, b, f) { return (f || saida)(clamp((t - a) / (b - a))); }
  // Sorteio com semente: a mesma cidade em toda visita
  function sorteio(semente) {
    return function () {
      semente |= 0; semente = (semente + 0x6d2b79f5) | 0;
      let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Rastros de luz: vêm de baixo (das ruas) e convergem no T do logo
  const rastros = (function () {
    const r = sorteio(29);
    return Array.from({ length: 38 }, function () {
      return {
        ang: Math.PI * (0.06 + 0.88 * r()),
        atraso: r() * 0.6,
        dur: 0.65 + r() * 0.4,
        len: 140 + r() * 260,
        larg: 1.2 + r() * 2.6,
        dist: 700 + r() * 420,
        cor: r() < 0.55 ? "255,122,0" : "255,26,82",
      };
    });
  })();

  let W = 0, H = 0, dpr = 1, cena = null, luz = null, emAbertura = false;

  // ---------- Monta a cidade para o tamanho da tela ----------
  function montarCena() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    fundo.width = Math.round(W * dpr);
    fundo.height = Math.round(H * dpr);
    if (luz) { luz.width = fundo.width; luz.height = fundo.height; }

    const r = sorteio(21);
    const escala = Math.min(1.3, Math.max(0.6, W / 1280));
    // Prédios mais altos nas laterais e mais baixos no centro, para abrir espaço ao logo
    const lateral = function (xc, expo) { return Math.pow(Math.min(1, Math.abs(xc - W / 2) / (W / 2)), expo); };
    const camada = function () {
      const c = document.createElement("canvas");
      c.width = fundo.width; c.height = fundo.height;
      const g = c.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [c, g];
    };

    // Fileira de trás, em roxo
    const [longe, gl] = camada();
    gl.fillStyle = "#3a1257";
    let x = -20;
    while (x < W + 20) {
      const w = (40 + r() * 70) * escala;
      const h = H * (0.19 + r() * 0.21 + 0.36 * lateral(x + w / 2, 1.3));
      gl.fillRect(x, H - h, w, h);
      x += w + r() * 8 * escala;
    }

    // Fileira da frente: silhuetas escuras com janelas
    const [perto, gp] = camada();
    gp.fillStyle = "#16051f";
    const janelas = [];
    x = -10;
    while (x < W + 10) {
      const w = (50 + r() * 80) * escala;
      const h = H * (0.11 + r() * 0.17 + 0.42 * lateral(x + w / 2, 1.5));
      gp.fillRect(x, H - h, w, h);
      if (r() < 0.3) gp.fillRect(x + w / 2 - 1, H - h - 18, 2, 18);
      for (let wy = H - h + 10; wy < H - 8; wy += 10) {
        for (let wx = x + 6; wx < x + w - 6; wx += 9) {
          if (r() < 0.3) {
            janelas.push({
              x: wx, y: wy,
              t0: 0.5 + r() * 1.9,
              a: 0.35 + r() * 0.5,
              cor: "rgba(255," + (160 + Math.floor(r() * 70)) + ",110,",
            });
          }
        }
      }
      x += w + r() * 10 * escala;
    }
    // Todas as janelas acesas, prontas para o quadro final
    const [acesas, ga] = camada();
    janelas.forEach(function (j) {
      ga.fillStyle = j.cor + j.a.toFixed(3) + ")";
      ga.fillRect(j.x, j.y, 3, 4);
    });

    const noite = ctx.createLinearGradient(0, 0, 0, H);
    noite.addColorStop(0, "#0b0214");
    noite.addColorStop(1, "#1c0630");
    const ceu = ctx.createLinearGradient(0, 0, 0, H);
    ceu.addColorStop(0, "#14041f");
    ceu.addColorStop(0.45, "#3d0f5e");
    ceu.addColorStop(0.72, "#a3207a");
    ceu.addColorStop(0.88, "#f0523d");
    ceu.addColorStop(1, "#ffa62b");
    const raioSol = 0.55 * Math.max(W, H * 1.4);
    const sol = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, raioSol);
    sol.addColorStop(0, "rgba(255,170,80,0.7)");
    sol.addColorStop(0.3, "rgba(255,90,60,0.3)");
    sol.addColorStop(0.65, "rgba(214,36,143,0.1)");
    sol.addColorStop(1, "rgba(214,36,143,0)");
    const nevoa = ctx.createLinearGradient(0, H * 0.78, 0, H);
    nevoa.addColorStop(0, "rgba(255,120,80,0)");
    nevoa.addColorStop(1, "rgba(255,120,80,0.18)");
    // Véu roxo que escurece a cidade para os cartões ficarem legíveis
    const veu = ctx.createLinearGradient(0, 0, 0, H);
    veu.addColorStop(0, "rgba(18,3,31,0.55)");
    veu.addColorStop(0.45, "rgba(36,8,58,0.25)");
    veu.addColorStop(1, "rgba(18,3,31,0.5)");

    cena = {
      longe, perto, acesas, janelas, noite, ceu, sol, nevoa, veu,
      estrelas: Array.from({ length: 60 }, function () { return { x: r() * W, y: r() * H * 0.45, a: 0.3 + r() * 0.6 }; }),
    };
  }

  // ---------- Desenha a cidade no instante t da abertura (Infinity = quadro final) ----------
  function desenharCidade(t) {
    const c = cena;
    const ceuAceso = 0.12 + 0.88 * trecho(t, 0.2, 1.9, suave);
    const sobe = 1 - trecho(t, 0.1, 1.7, suave);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.noite; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = ceuAceso;
    ctx.fillStyle = c.ceu; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c.sol; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    const brilhoEstrelas = 1 - ceuAceso;
    if (brilhoEstrelas > 0.02) {
      c.estrelas.forEach(function (s) {
        ctx.fillStyle = "rgba(255,255,255," + (s.a * brilhoEstrelas).toFixed(3) + ")";
        ctx.fillRect(s.x, s.y, 1.6, 1.6);
      });
    }

    const dy = 0.22 * H * sobe;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c.longe, 0, Math.round(0.125 * H * sobe * dpr));
    ctx.drawImage(c.perto, 0, Math.round(dy * dpr));
    if (t >= 2.6) {
      ctx.drawImage(c.acesas, 0, Math.round(dy * dpr));
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.janelas.forEach(function (j) {
        if (t < j.t0) return;
        ctx.fillStyle = j.cor + (j.a * clamp((t - j.t0) / 0.15)).toFixed(3) + ")";
        ctx.fillRect(j.x, j.y + dy, 3, 4);
      });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = c.nevoa; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    const v = trecho(t, 2.4, 3.2, suave);
    if (v > 0) {
      ctx.globalAlpha = v;
      ctx.fillStyle = c.veu; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    const preto = 1 - trecho(t, 0, 0.45, linear);
    if (preto > 0) {
      ctx.fillStyle = "rgba(11,2,20," + preto.toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- Rastros de luz e clarão no T do logo ----------
  function desenharLuzes(lctx, t, alvo) {
    const tt = t - 0.4;
    const s = Math.max(W / 1280, H / 720);
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, W, H);
    lctx.globalCompositeOperation = "lighter";
    lctx.lineCap = "round";
    rastros.forEach(function (r) {
      const k = (tt - 0.2 - r.atraso) / r.dur;
      if (k <= 0 || k >= 1) return;
      const d = r.dist * s * (1 - k * k);
      const cs = Math.cos(r.ang), sn = Math.sin(r.ang) * 0.62;
      const hx = alvo.x + cs * d, hy = alvo.y + sn * d;
      const cauda = r.len * s * (0.5 + k);
      const tx = alvo.x + cs * (d + cauda), ty = alvo.y + sn * (d + cauda);
      const alfa = 1 - trecho(k, 0.8, 1, linear);
      const g = lctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, "rgba(" + r.cor + ",0)");
      g.addColorStop(1, "rgba(" + r.cor + "," + alfa.toFixed(3) + ")");
      lctx.strokeStyle = g;
      lctx.lineWidth = r.larg * Math.max(1, s * 0.8);
      lctx.beginPath(); lctx.moveTo(tx, ty); lctx.lineTo(hx, hy); lctx.stroke();
    });
    const f = tt > 1.15 && tt < 2.3 ? Math.sin(((tt - 1.15) / 1.15) * Math.PI) : 0;
    if (f > 0) {
      const raio = (60 + 260 * f) * Math.min(s, 1.4);
      const g = lctx.createRadialGradient(alvo.x, alvo.y, 0, alvo.x, alvo.y, raio);
      g.addColorStop(0, "rgba(255,210,160," + (0.85 * f).toFixed(3) + ")");
      g.addColorStop(0.35, "rgba(255,90,40," + (0.45 * f).toFixed(3) + ")");
      g.addColorStop(1, "rgba(255,26,82,0)");
      lctx.fillStyle = g;
      lctx.fillRect(alvo.x - raio, alvo.y - raio, raio * 2, raio * 2);
    }
    lctx.globalCompositeOperation = "source-over";
  }

  function pontoDoLogo() {
    // O logo visível: o da tela de acesso (antes do login) ou o do portal
    const logo = Array.prototype.find.call(document.querySelectorAll(".logo"), function (l) { return l.offsetParent !== null; });
    if (!logo) return { x: W / 2, y: H * 0.15 };
    const ret = logo.getBoundingClientRect();
    return { x: ret.left + ret.width * 0.24, y: ret.top + ret.height * 0.5 };
  }

  // ---------- Abertura ----------
  function tocarAbertura() {
    clearTimeout(window.__aberturaReserva);
    emAbertura = true;
    luz = document.createElement("canvas");
    luz.className = "cidade-luz";
    luz.setAttribute("aria-hidden", "true");
    luz.width = fundo.width;
    luz.height = fundo.height;
    document.body.appendChild(luz);
    const lctx = luz.getContext("2d");
    raiz.classList.add("abertura-roda");
    try { sessionStorage.setItem("transdata-abertura", "1"); } catch (e) { /* sem armazenamento: toca de novo na próxima */ }

    const inicio = performance.now();
    function encerrar() {
      if (!emAbertura) return;
      emAbertura = false;
      luz.remove();
      luz = null;
      raiz.classList.remove("abertura", "abertura-roda");
      window.removeEventListener("pointerdown", encerrar);
      window.removeEventListener("keydown", encerrar);
      desenharCidade(Infinity);
    }
    window.addEventListener("pointerdown", encerrar);
    window.addEventListener("keydown", encerrar);

    function quadro(agora) {
      if (!emAbertura) return;
      const t = (agora - inicio) / 1000;
      if (t >= DURACAO) { encerrar(); return; }
      desenharCidade(t);
      if (lctx) desenharLuzes(lctx, t, pontoDoLogo());
      requestAnimationFrame(quadro);
    }
    quadro(inicio);
  }

  montarCena();
  if (raiz.classList.contains("abertura")) tocarAbertura();
  else desenharCidade(Infinity);

  // Redesenha ao mudar o tamanho da janela. No celular a barra de endereço muda
  // a altura ao rolar; pequenas mudanças só esticam o desenho, sem refazer a cidade.
  let espera = null;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () {
      const mudouLargura = window.innerWidth !== W;
      const mudouAltura = Math.abs(window.innerHeight - H) > H * 0.2;
      if (!mudouLargura && !mudouAltura) return;
      montarCena();
      if (!emAbertura) desenharCidade(Infinity);
    }, 150);
  });
})();
