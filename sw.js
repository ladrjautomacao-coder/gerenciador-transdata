// Service worker do portal: guarda os arquivos da tela inicial para o app
// abrir rápido e funcionar mesmo sem internet. Sempre tenta a versão mais
// nova na rede primeiro; só usa a cópia guardada se estiver offline.
// Ao mudar a lista abaixo, aumente o número da versão.
const CACHE = "portal-transdata-v1";
const ARQUIVOS = [
  "/",
  "/style.css",
  "/config.js",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/logo-transdata.png",
  "/assets/icon-192.png",
  "/assets/favicon-32.png",
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(ARQUIVOS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== CACHE; })
        .map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (evento) {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  // Só cuida dos arquivos do próprio portal; links externos seguem direto
  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then(function (resposta) {
        if (resposta.ok && !resposta.redirected) {
          const copia = resposta.clone();
          caches.open(CACHE).then(function (cache) { cache.put(pedido, copia); });
        }
        return resposta;
      })
      .catch(function () {
        return caches.match(pedido).then(function (guardado) {
          if (guardado) return guardado;
          if (pedido.mode === "navigate") return caches.match("/");
          return Response.error();
        });
      })
  );
});
