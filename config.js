// Configuração do portal: edite os nomes, descrições e links aqui.
const PORTAL_CONFIG = {
  titulo: "Gerenciador Transdata",
  subtitulo: "Selecione o sistema que deseja acessar",
  opcoes: [
    {
      nome: "Projetos Transdata",
      descricao: "Sistema de projetos Transdata",
      icone: "onibus",
      url: "https://projetostransdata.vercel.app/",
      novaAba: false,
    },
    {
      nome: "Projetos Transmobile",
      descricao: "Sistema de projetos Transmobile",
      icone: "satelite",
      url: "https://transmobile.vercel.app/login",
      novaAba: false,
    },
    {
      nome: "Gestão Financeira",
      descricao: "Relatórios de gestão financeira",
      icone: "cifrao",
      url: "https://datastudio.google.com/reporting/06aa5370-0f65-4c85-8e1f-dc3ce4ad5b6d/page/p_3pu0qo75td",
      novaAba: false,
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
