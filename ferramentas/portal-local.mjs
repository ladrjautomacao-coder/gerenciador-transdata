// Portal completo no computador, como na Vercel: o Gerenciador na raiz e os sistemas em
// /transdata/ (CS Flow), /transmobile/ e /roadmap/, todos no mesmo endereço e com um só login.
//
// Uso (na pasta do Gerenciador):
//   node ferramentas/portal-local.mjs
//     serve o build de cada sistema (rode "npm run build" em cada um antes)
//   node ferramentas/portal-local.mjs --transdata=http://localhost:8080
//     repassa /transdata/ para o "npm run dev" do CS Flow (vale para qualquer sistema)
// Endereço: http://localhost:4173 (ou a porta em PORTA).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raizGerenciador = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pastaTransdata = path.resolve(raizGerenciador, "..");
const porta = Number(process.env.PORTA) || 4173;

const SISTEMAS = {
  transdata: path.join(pastaTransdata, "projetostransdata", "dist", "transdata"),
  transmobile: path.join(pastaTransdata, "Projeto Transmobile", "dist", "transmobile"),
  roadmap: path.join(pastaTransdata, "RoadMap de Evolução", "dist", "roadmap"),
};
for (const arg of process.argv.slice(2)) {
  const m = /^--(transdata|transmobile|roadmap)=(https?:\/\/.+)$/.exec(arg);
  if (m) SISTEMAS[m[1]] = new URL(m[2]);
}

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".woff": "font/woff", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf",
};

function arquivoDentro(raiz, caminho) {
  const alvo = path.resolve(raiz, "." + decodeURIComponent(caminho));
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) return null; // nada fora da pasta
  try {
    const info = fs.statSync(alvo);
    if (info.isDirectory()) {
      const indice = path.join(alvo, "index.html");
      return fs.existsSync(indice) ? indice : null;
    }
    return alvo;
  } catch { return null; }
}

function enviar(res, arquivo, status = 200) {
  res.writeHead(status, {
    "Content-Type": TIPOS[path.extname(arquivo).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(arquivo).pipe(res);
}

function repassar(req, res, destino) {
  const pedido = http.request(new URL(req.url, destino), {
    method: req.method, headers: { ...req.headers, host: destino.host },
  }, (resposta) => { res.writeHead(resposta.statusCode || 502, resposta.headers); resposta.pipe(res); });
  pedido.on("error", () => { res.writeHead(502); res.end("Sistema fora do ar: " + destino.href); });
  req.pipe(pedido);
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, "http://local");
  if (url.pathname === "/reset-password") { res.writeHead(302, { Location: "/" + url.search }); return res.end(); }

  const m = /^\/(transdata|transmobile|roadmap)(\/.*)?$/.exec(url.pathname);
  if (m) {
    const destino = SISTEMAS[m[1]];
    if (destino instanceof URL) return repassar(req, res, destino);
    const arquivo = arquivoDentro(destino, m[2] || "/");
    if (arquivo) return enviar(res, arquivo);
    // rota do app (ex.: /transdata/projetos/123): a página do app cuida
    const indice = path.join(destino, "index.html");
    if (path.extname(url.pathname) === "" && fs.existsSync(indice)) return enviar(res, indice);
    res.writeHead(404); return res.end("Não encontrado");
  }

  const arquivo = arquivoDentro(raizGerenciador, url.pathname);
  if (arquivo && !arquivo.includes(`${path.sep}.`)) return enviar(res, arquivo);
  res.writeHead(404); res.end("Não encontrado");
});

// HMR do "npm run dev" dos sistemas repassados
servidor.on("upgrade", (req, socket, cabeca) => {
  const m = /^\/(transdata|transmobile|roadmap)(\/|$)/.exec(req.url || "");
  const destino = m && SISTEMAS[m[1]];
  if (!(destino instanceof URL)) return socket.destroy();
  const pedido = http.request(new URL(req.url, destino), { headers: { ...req.headers, host: destino.host } });
  pedido.on("upgrade", (resposta, socketDestino, cabecaDestino) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(resposta.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")}\r\n\r\n`);
    if (cabecaDestino?.length) socket.write(cabecaDestino);
    if (cabeca?.length) socketDestino.write(cabeca);
    socketDestino.pipe(socket).pipe(socketDestino);
  });
  pedido.on("error", () => socket.destroy());
  pedido.end();
});

servidor.listen(porta, () => {
  console.log(`Portal local: http://localhost:${porta}`);
  for (const [nome, destino] of Object.entries(SISTEMAS)) {
    console.log(`  /${nome}/ -> ${destino instanceof URL ? destino.href : destino}${destino instanceof URL || fs.existsSync(destino) ? "" : "  (falta o build)"}`);
  }
});
