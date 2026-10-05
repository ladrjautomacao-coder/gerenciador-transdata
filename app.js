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

    link.append(nome, descricao, seta);
    container.appendChild(link);
  });
})();
