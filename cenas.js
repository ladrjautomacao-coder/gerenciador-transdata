// Cenas animadas de fundo dos cartões da tela inicial: uma por módulo, escolhida
// pelo campo "cena" no config.js. São desenhadas em canvas no roxo da marca, com
// a luz na cor de cada módulo, e ficam no lugar das imagens que podem vir do
// Runway depois. Ficam paradas e só se mexem com o mouse em cima do cartão.
(function () {
  const telas = Array.from(document.querySelectorAll(".quadrante-cena"));
  if (!telas.length) return;
  const reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Utilitários ----------
  function sorteio(semente) {
    return function () {
      semente |= 0; semente = (semente + 0x6d2b79f5) | 0;
      let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const frac = function (x) { return x - Math.floor(x); };
  function fundo(ctx, w, h, a, b) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function brilho(ctx, x, y, r, rgb, a) {
    if (r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + rgb + "," + a + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function arredondado(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function cubo(ctx, X, Y, s, luz) {
    const a = s * 0.87, b = s * 0.5;
    const topo = [[X, Y - b], [X + a, Y], [X, Y + b], [X - a, Y]];
    const esq = [[X - a, Y], [X, Y + b], [X, Y + b + s], [X - a, Y + s]];
    const dir = [[X, Y + b], [X + a, Y], [X + a, Y + s], [X, Y + b + s]];
    const face = function (pts, cor) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = cor; ctx.fill();
      ctx.strokeStyle = "rgba(230,210,255,0.28)"; ctx.lineWidth = 0.8; ctx.stroke();
    };
    if (luz > 0.05) {
      face(esq, "rgba(214,36,143," + (0.18 + 0.3 * luz).toFixed(3) + ")");
      face(dir, "rgba(160,20,110," + (0.22 + 0.3 * luz).toFixed(3) + ")");
      face(topo, "rgba(255,110,200," + (0.2 + 0.38 * luz).toFixed(3) + ")");
    } else {
      face(esq, "rgba(120,70,210,0.16)");
      face(dir, "rgba(80,40,170,0.22)");
      face(topo, "rgba(190,150,255,0.2)");
    }
  }

  // ---------- As seis cenas ----------
  const CENAS = {
    // Projetos Transdata: superfície ondulada com um rastro de luz laranja (ônibus no corredor)
    corredor: function (ctx, w, h, t) {
      fundo(ctx, w, h, "#1d0735", "#0a0213");
      const hz = h * 0.04;
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, w * 0.5, hz, w * 0.75, "140,70,230", 0.3);
      ctx.globalCompositeOperation = "source-over";
      const N = 30, passos = 40;
      for (let i = 0; i <= N; i++) {
        const p = i / N;
        const y0 = hz + (h - hz) * Math.pow(p, 1.6);
        const amp = h * (0.004 + 0.028 * p);
        const ondas = 7 - 4 * p;
        ctx.beginPath();
        for (let s = 0; s <= passos; s++) {
          const x = (s / passos) * w;
          const y = y0 + Math.sin((s / passos) * ondas * Math.PI * 2 + i * 0.7 + t * 0.9) * amp;
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(170,110,255," + (0.06 + 0.3 * p).toFixed(3) + ")";
        ctx.lineWidth = 0.8 + 1.4 * p;
        ctx.stroke();
      }
      const c = (t / 4.5) % 1;
      const hx = (-0.15 + 1.3 * c) * w, hy = h * 0.3;
      const cauda = w * 0.42;
      const g = ctx.createLinearGradient(hx - cauda, hy + h * 0.025, hx, hy);
      g.addColorStop(0, "rgba(255,122,0,0)");
      g.addColorStop(1, "rgba(255,180,100,0.95)");
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(1.5, h * 0.009);
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx - cauda, hy + h * 0.025); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, hx, hy, w * 0.1, "255,130,30", 0.8);
      brilho(ctx, hx, hy, Math.max(4, w * 0.022), "255,240,220", 1);
      const fg = ctx.createLinearGradient(hx - w * 0.14, 0, hx + w * 0.14, 0);
      fg.addColorStop(0, "rgba(255,160,70,0)");
      fg.addColorStop(0.5, "rgba(255,200,140,0.85)");
      fg.addColorStop(1, "rgba(255,160,70,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(hx - w * 0.14, hy - 0.75, w * 0.28, 1.5);
      ctx.globalCompositeOperation = "source-over";
    },

    // Projetos Transmobile: horizonte de planeta com uma órbita e um satélite coral
    orbita: function (ctx, w, h, t, d) {
      fundo(ctx, w, h, "#160528", "#0a0213");
      if (!d.estrelas) {
        const r = sorteio(7);
        d.estrelas = Array.from({ length: 46 }, function () { return [r(), r() * 0.7, 0.2 + r() * 0.6]; });
      }
      d.estrelas.forEach(function (e) {
        ctx.fillStyle = "rgba(255,255,255," + (e[2] * 0.7).toFixed(2) + ")";
        ctx.fillRect(e[0] * w, e[1] * h, 1.2, 1.2);
      });
      const R = h * 1.1, cx = w * 0.5, cy = h * 0.5 + R;
      const pg = ctx.createRadialGradient(cx, cy - R * 0.9, R * 0.1, cx, cy, R);
      pg.addColorStop(0, "#3a1462");
      pg.addColorStop(0.6, "#1a0730");
      pg.addColorStop(1, "#0d0319");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(190,130,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      brilho(ctx, cx, cy - R, w * 0.55, "150,80,240", 0.35);
      const rx = w * 0.62, ry = h * 0.12;
      ctx.save();
      ctx.translate(w * 0.5, h * 0.27);
      ctx.rotate(-0.16);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.72, ry * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      const a = t * 0.7;
      for (let k = 14; k >= 1; k--) {
        const b = a - k * 0.035;
        ctx.fillStyle = "rgba(240,82,61," + ((1 - k / 15) * 0.5).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(Math.cos(b) * rx, Math.sin(b) * ry, Math.max(1, h * 0.006) * (1 - k / 20), 0, Math.PI * 2);
        ctx.fill();
      }
      const sx = Math.cos(a) * rx, sy = Math.sin(a) * ry;
      brilho(ctx, sx, sy, w * 0.08, "240,82,61", 0.85);
      brilho(ctx, sx, sy, Math.max(3, w * 0.02), "255,235,225", 1);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    },

    // Gestão de Contratos: painéis de vidro como documentos, com luz rosa passando por trás
    vidro: function (ctx, w, h, t) {
      fundo(ctx, w, h, "#1b0633", "#0a0213");
      ctx.globalCompositeOperation = "lighter";
      const lx = (-0.25 + 1.5 * ((t / 5) % 1)) * w;
      ctx.save();
      ctx.translate(lx, h * 0.3);
      ctx.scale(1, 2.4);
      brilho(ctx, 0, 0, w * 0.22, "255,26,82", 0.55);
      ctx.restore();
      brilho(ctx, w * 0.5, h * 0.55, w * 0.6, "120,50,200", 0.25);
      ctx.globalCompositeOperation = "source-over";
      for (let i = 6; i >= 0; i--) {
        const e = 1 - i * 0.06;
        const pw = w * 0.17 * e, ph = h * 0.44 * e;
        const x = w * 0.16 + i * w * 0.088, y = h * 0.3 - ph / 2 + i * h * 0.004;
        ctx.save();
        ctx.translate(x, y);
        ctx.transform(1, -0.06, 0, 1, 0, 0);
        const pg = ctx.createLinearGradient(0, 0, pw, ph);
        pg.addColorStop(0, "rgba(200,170,255,0.2)");
        pg.addColorStop(1, "rgba(120,80,220,0.08)");
        ctx.fillStyle = pg;
        arredondado(ctx, 0, 0, pw, ph, Math.min(pw, ph) * 0.06);
        ctx.fill();
        ctx.strokeStyle = "rgba(230,215,255,0.38)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(pw * 0.08, ph * 0.04, pw * 0.84, 1.2);
        ctx.restore();
      }
    },

    // Assistência Técnica: campo de discos até o horizonte, alguns acendendo em âmbar
    discos: function (ctx, w, h, t) {
      fundo(ctx, w, h, "#1c0736", "#0a0213");
      const hz = h * 0.02;
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, w * 0.5, hz, w * 0.8, "150,80,240", 0.3);
      ctx.globalCompositeOperation = "source-over";
      const linhas = 16;
      const onda = -0.2 + 1.4 * ((t / 3.2) % 1);
      const acesos = [];
      for (let r = 0; r < linhas; r++) {
        const p = r / (linhas - 1);
        const y = hz + (h - hz) * Math.pow(p, 1.5);
        const rx = w * (0.01 + 0.06 * p), ry = rx * 0.34;
        const passo = rx * 2.5;
        const desloc = (r % 2) * passo / 2;
        for (let x = -passo + desloc; x < w + passo; x += passo) {
          const hsh = frac(Math.sin(r * 91.7 + Math.round(x / passo) * 37.3) * 43758.5);
          const aceso = (Math.abs(x / w - onda) < 0.05 && hsh > 0.45) || hsh > 0.94;
          ctx.fillStyle = "rgba(20,8,36," + (0.5 + 0.4 * p).toFixed(2) + ")";
          ctx.beginPath(); ctx.ellipse(x, y + ry * 0.55, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = aceso ? "rgba(255,166,43,0.95)" : "rgba(150,100,230," + (0.14 + 0.36 * p).toFixed(2) + ")";
          ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          if (aceso) acesos.push([x, y, rx]);
        }
      }
      ctx.globalCompositeOperation = "lighter";
      acesos.forEach(function (a) { brilho(ctx, a[0], a[1], a[2] * 2.6, "255,150,40", 0.55); });
      ctx.globalCompositeOperation = "source-over";
    },

    // Estoques: pilhas de cubos de vidro em vista isométrica, alguns acesos em magenta
    cubos: function (ctx, w, h, t, d) {
      fundo(ctx, w, h, "#170530", "#0a0213");
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, w * 0.5, h * 0.12, w * 0.7, "150,80,240", 0.28);
      ctx.globalCompositeOperation = "source-over";
      if (!d.pilhas) {
        const r = sorteio(17);
        d.pilhas = [];
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 6; j++) {
            d.pilhas.push({ i: i, j: j, n: 1 + Math.floor(r() * 3), luz: r() < 0.2 ? r() * 6.28 : null });
          }
        }
        d.pilhas.sort(function (a, b) { return a.i + a.j - (b.i + b.j); });
      }
      const s = Math.min(w, h * 1.6) * 0.085;
      const ox = w * 0.5, oy = h * 0.55 - 7.5 * s;
      const brilhos = [];
      d.pilhas.forEach(function (c) {
        for (let k = 0; k < c.n; k++) {
          const X = ox + (c.i - c.j) * s * 0.87;
          const Y = oy + (c.i + c.j) * s * 0.5 - k * s;
          const luz = c.luz !== null && k === c.n - 1 ? 0.5 + 0.5 * Math.sin(t * 2 + c.luz) : 0;
          cubo(ctx, X, Y, s, luz);
          if (luz > 0.05) brilhos.push([X, Y + s * 0.5, s, luz]);
        }
      });
      ctx.globalCompositeOperation = "lighter";
      brilhos.forEach(function (b) { brilho(ctx, b[0], b[1], b[2] * 1.8, "214,36,143", 0.32 * b[3]); });
      ctx.globalCompositeOperation = "source-over";
    },

    // RoadMap de Evolução: linha que sobe com esferas como marcos; a etapa atual brilha
    marcos: function (ctx, w, h, t) {
      fundo(ctx, w, h, "#1a0633", "#0a0213");
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, w * 0.7, h * 0.08, w * 0.6, "150,80,240", 0.3);
      ctx.globalCompositeOperation = "source-over";
      const P = [[-0.05 * w, 0.62 * h], [0.35 * w, 0.5 * h], [0.62 * w, 0.14 * h], [1.08 * w, 0.06 * h]];
      const ponto = function (u) {
        const v = 1 - u;
        return [
          v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0],
          v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1],
        ];
      };
      const caminho = function () {
        ctx.beginPath();
        ctx.moveTo(P[0][0], P[0][1]);
        ctx.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]);
      };
      ctx.lineCap = "round";
      caminho(); ctx.strokeStyle = "rgba(166,75,244,0.25)"; ctx.lineWidth = Math.max(4, h * 0.03); ctx.stroke();
      caminho(); ctx.strokeStyle = "rgba(220,200,255,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();

      const us = [0.06, 0.2, 0.34, 0.48, 0.62, 0.76, 0.9];
      const atual = 3;
      const prog = (t / 2.6) % 1;
      const p = ponto(us[atual] * prog);
      ctx.globalCompositeOperation = "lighter";
      brilho(ctx, p[0], p[1], w * 0.06, "200,150,255", 0.8 * (1 - prog * 0.6));
      ctx.globalCompositeOperation = "source-over";

      for (let k = us.length - 1; k >= 0; k--) {
        const q = ponto(us[k]);
        const x = q[0], y = q[1];
        const r = w * (0.045 - 0.028 * us[k]);
        if (k === atual) {
          ctx.globalCompositeOperation = "lighter";
          brilho(ctx, x, y, r * 3.2, "166,75,244", 0.45 + 0.3 * Math.sin(t * 3));
          ctx.globalCompositeOperation = "source-over";
        }
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        if (k < atual) { g.addColorStop(0, "#e7d6ff"); g.addColorStop(0.5, "#8b4ee0"); g.addColorStop(1, "#2a0d4a"); }
        else if (k === atual) { g.addColorStop(0, "#ffffff"); g.addColorStop(0.45, "#b77bff"); g.addColorStop(1, "#4a1a85"); }
        else { g.addColorStop(0, "#9c7cc9"); g.addColorStop(0.5, "#45206e"); g.addColorStop(1, "#160628"); }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    },
  };

  // ---------- Desenho e laço de animação ----------
  function desenhar(cv, t) {
    const cena = CENAS[cv.dataset.cena];
    const caixa = cv.parentElement;
    const w = caixa.offsetWidth, h = caixa.offsetHeight;
    if (!cena || !w || !h) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv._w !== w || cv._h !== h || cv._dpr !== dpr) {
      cv._w = w; cv._h = h; cv._dpr = dpr;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv._dados = {};
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    cena(ctx, w, h, t, cv._dados);
    return true;
  }

  // Paradas por padrão, para a tela ficar mais limpa. A cena só se mexe com o
  // mouse em cima do cartão (ou o foco do teclado nele) e, ao sair, fica parada
  // onde estava. O cartão "Em breve" e quem pediu menos movimento não animam.
  const REPOUSO = 2; // instante do quadro parado: a luz de cada cena já está à vista
  const ativas = new Set();
  let rodando = false, anterior = 0;

  function quadro(agora) {
    if (!ativas.size) { rodando = false; return; }
    const dt = Math.min(0.1, (agora - anterior) / 1000);
    anterior = agora;
    ativas.forEach(function (cv) {
      cv._t += dt;
      desenhar(cv, cv._t);
    });
    requestAnimationFrame(quadro);
  }
  function acordar() {
    if (rodando) return;
    rodando = true;
    anterior = performance.now();
    requestAnimationFrame(quadro);
  }

  telas.forEach(function (cv) {
    cv._t = REPOUSO;
    desenhar(cv, cv._t);
    const cartao = cv.parentElement;
    if (reduzir || cartao.classList.contains("quadrante-breve")) return;
    const ligar = function () { ativas.add(cv); acordar(); };
    const desligar = function () { ativas.delete(cv); };
    cartao.addEventListener("mouseenter", ligar);
    cartao.addEventListener("mouseleave", desligar);
    cartao.addEventListener("focus", ligar);
    cartao.addEventListener("blur", desligar);
  });

  // Redesenha o quadro parado quando o cartão muda de tamanho (fontes, janela, celular)
  const redesenhar = function (cv) { if (!ativas.has(cv)) desenhar(cv, cv._t); };
  if ("ResizeObserver" in window) {
    const observador = new ResizeObserver(function (entradas) {
      entradas.forEach(function (e) {
        const cv = e.target.querySelector(".quadrante-cena");
        if (cv) redesenhar(cv);
      });
    });
    telas.forEach(function (cv) { observador.observe(cv.parentElement); });
  } else {
    window.addEventListener("resize", function () { telas.forEach(redesenhar); });
  }
})();
