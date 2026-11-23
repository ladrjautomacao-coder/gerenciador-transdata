// Configuração do portal: edite os nomes, descrições e links aqui.
const PORTAL_CONFIG = {
  titulo: "Diretoria de Negócios",
  subtitulo: "Selecione o sistema que deseja acessar",
  // Cada cartão: nome, descricao, icone (ver app.js), cena (imagem animada de fundo,
  // ver cenas.js), rotulo (texto em âmbar no rodapé), url e novaAba.
  opcoes: [
    {
      nome: "Projetos Transdata",
      descricao: "Sistema de projetos Transdata",
      icone: "onibus",
      cena: "corredor",
      rotulo: "Sistema",
      url: "https://projetostransdata.vercel.app/",
      novaAba: true,
    },
    {
      nome: "Projetos Transmobile",
      descricao: "Sistema de projetos Transmobile",
      icone: "satelite",
      cena: "orbita",
      rotulo: "Sistema",
      url: "https://transmobile.vercel.app/login",
      novaAba: true,
    },
    {
      nome: "Gestão de Contratos",
      descricao: "Relatórios de gestão de contratos",
      icone: "cifrao",
      cena: "vidro",
      rotulo: "Relatório",
      url: "https://datastudio.google.com/reporting/06aa5370-0f65-4c85-8e1f-dc3ce4ad5b6d/page/p_3pu0qo75td",
      novaAba: true,
    },
    {
      nome: "Assistência Técnica",
      descricao: "Relatórios de assistência técnica",
      icone: "ferramenta",
      cena: "discos",
      rotulo: "Relatório",
      url: "https://datastudio.google.com/s/pL5Hmi-0wTg",
      novaAba: true,
    },
    {
      nome: "Estoques",
      descricao: "Relatórios de estoques",
      icone: "caixa",
      cena: "cubos",
      rotulo: "Relatório",
      url: "https://datastudio.google.com/s/pp_8AaZ8DQY",
      novaAba: true,
    },
    {
      nome: "RoadMap de Evolução",
      descricao: "Etapas e próximos passos de evolução",
      icone: "rota",
      cena: "marcos",
      rotulo: "Roadmap",
      // App próprio (projeto "RoadMap de Evolução"), com o mesmo login do Portal Transdata.
      url: "https://roadmap-de-evolucao.vercel.app",
      novaAba: true,
    },
  ],

  // Faixa animada com Missão, Visão e Valores.
  // RASCUNHO baseado em frases do site itstransdata.com — substituir pelo texto oficial.
  institucional: {
    segundosPorItem: 8,
    itens: [
      {
        titulo: "Missão",
        texto: "Criar novos caminhos para a mobilidade urbana através de ideias e soluções inovadoras.",
      },
      {
        titulo: "Visão",
        texto: "Tornar o transporte público mais atraente, com gestão inteligente e tecnologia a serviço da mobilidade.",
      },
      {
        titulo: "Valores",
        valores: ["Inovação", "Colaboração", "Precisão", "Proximidade com o cliente", "Foco no passageiro"],
      },
    ],
  },
};
