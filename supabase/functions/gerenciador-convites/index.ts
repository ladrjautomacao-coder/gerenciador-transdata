// Convites do portal (Gerenciador Transdata). Só os super admins do portal convidam pessoas.
//   POST { acao: "verificar" }                  -> { pode: boolean }
//   POST { acao: "convidar", nome, email }      -> { ok: true } ou { erro: "<código>" }
// O e-mail sai com o modelo "Convidar usuário" do Supabase (modelos-email/convidar-usuario.html). O link
// abre a tela de acesso do portal, que pede a senha depois do clique. A conta nova entra no CS Flow como
// "pendente" (gatilho public.handle_new_user), como quem usa "Criar acesso".
// Publicar: Supabase "Portal oficial - Transdata", verify_jwt ligado.
import { createClient } from "npm:@supabase/supabase-js@2";

// Super admins do portal, pelo id (o e-mail pode mudar): luiz.junior e ladrj.automacao.
// Quando a base central de acessos existir, esta lista passa a vir de lá.
const SUPER_ADMINS = new Set([
  "882e1a2e-c711-4feb-948c-0e6a118801d5",
  "a86eb535-857c-4f8c-80ef-2c6ffce8e296",
]);
const PORTAL = "https://gerenciador-transdata.vercel.app";

function cabecalhos(origem: string | null): Record<string, string> {
  const permitida = origem && (origem === PORTAL || /^http:\/\/localhost:\d+$/.test(origem));
  return {
    "Access-Control-Allow-Origin": permitida ? origem! : PORTAL,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

Deno.serve(async (req) => {
  const h = cabecalhos(req.headers.get("origin"));
  const responder = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: h });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return responder({ erro: "metodo" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: quem, error: erroQuem } = token ? await admin.auth.getUser(token) : { data: null, error: true };
  if (erroQuem || !quem?.user) return responder({ erro: "sem-sessao" }, 401);
  const pode = SUPER_ADMINS.has(quem.user.id);

  let corpo: { acao?: string; nome?: string; email?: string } = {};
  try { corpo = await req.json(); } catch { /* corpo vazio */ }

  if (corpo.acao === "verificar") return responder({ pode });
  if (corpo.acao !== "convidar") return responder({ erro: "acao" }, 400);
  if (!pode) return responder({ erro: "sem-permissao" }, 403);

  const nome = String(corpo.nome || "").trim().slice(0, 120);
  const email = String(corpo.email || "").trim().toLowerCase();
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return responder({ erro: "dados" }, 400);

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: nome },
    redirectTo: PORTAL + "/",
  });
  if (error) {
    const m = `${error.code ?? ""} ${error.message}`;
    if (/email_exists|already been registered|already registered|already exists/i.test(m)) return responder({ erro: "ja-existe" }, 409);
    // gatilho public.enforce_signup_domain: só domínios liberados
    if (/Database error|Cadastro permitido|check_violation/i.test(m)) return responder({ erro: "dominio" }, 400);
    if (/rate_limit|rate limit|too many/i.test(m)) return responder({ erro: "limite" }, 429);
    console.error("convite não enviado", m);
    return responder({ erro: "falhou" }, 500);
  }
  console.log("convite enviado", { por: quem.user.id });
  return responder({ ok: true });
});
