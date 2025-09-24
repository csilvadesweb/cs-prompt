/***********************
 * SUPER BIBLIOTECA JS *
 ***********************/

/* ------------------ Seeds de exemplo ------------------ */
const seeds = (() => {
  const personas = [
    "Advogado Consumerista",
    "Copywriter",
    "Social Media",
    "Professor de Tecnologia",
    "Especialista em SEO",
    "Mentor de Carreira",
    "Programador",
    "Nutricionista",
    "Designer UX",
    "Gestor de Projetos"
  ];
  const temas = [
    "Marketing","Criação de Conteúdo","Desenvolvimento Web","Negócios","Direito",
    "Educação","Saúde e Bem-Estar","Produtividade","Inovação","Finanças Pessoais"
  ];
  const tipos = [
    "Carrossel Instagram","Tweet/Thread","Post LinkedIn","Reels/TikTok","Legenda",
    "Vídeo Longo","Título de Blog","E-mail Marketing","Script de YouTube","Checklist"
  ];
  const base = [];
  let id = 1;
  for (let p = 0; p < personas.length; p++) {
    for (let i = 0; i < 8; i++) {
      const tema = temas[(p + i) % temas.length];
      const tipo = tipos[(p + i) % tipos.length];
      base.push({
        id: id++,
        titulo: `${tipo} • ${tema} • ${personas[p]} • #${i+1}`,
        persona: personas[p],
        tema,
        tipo,
        tags: [tema.toLowerCase(), personas[p].split(" ")[0].toLowerCase()],
        prompt: `Atue como ${personas[p]} e crie um ${tipo.toLowerCase()} sobre ${tema}.
- Público: iniciante
- Tom: claro e prático
- Entregue: 3 variações + CTA final.
Inclua exemplos do mercado brasileiro.`
      });
    }
  }
  return base;
})();

/* ------------------ Estado e utilitários ------------------ */
let DATA = [...seeds];            // será substituída por prompts_5000.json se existir
let ROUTE = "#/";                 // "#/", "#/favoritos", "#/sobre"

let state = {
  tab: "persona",
  query: "",
  primary: "Todos",
  secondary: "Todos",
  pageSize: 30,
  page: 1,
  showOnlyFavorites: false,
};

const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const normalize = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const uniq = (arr) => [...new Set(arr)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ------------------ Elementos ------------------ */
const countEl = $("#count");
const tabs = $$(".tab");
const primarySelect = $("#primarySelect");
const secondarySelect = $("#secondarySelect");
const primaryLabel = $("#primaryLabel");
const searchInput = $("#search");
const pageSizeEl = $("#pageSize");
const list = $("#list");
const prev = $("#prev");
const next = $("#next");
const pageInfo = $("#pageInfo");
const chips = $("#chips");
const cardTpl = $("#cardTemplate");

const btnExport = $("#btnExport");
const fileInput = $("#fileInput");
const btnGen = $("#btnGen");
const genQty = $("#genQty");
const btnClear = $("#btnClear");
const btnToggleTheme = $("#btnToggleTheme");

/* ------------------ Tema (persistência) ------------------ */
const THEME_KEY = "promptstar_theme";
function loadTheme(){
  const t = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", t);
}
function toggleTheme(){
  const now = document.documentElement.getAttribute("data-theme")==="dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", now);
  localStorage.setItem(THEME_KEY, now);
}

/* ------------------ Favoritos ------------------ */
const FAVORITES_KEY = "promptstar_favs";
function getFavs(){
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]"); } catch { return []; }
}
function setFavs(ids){ localStorage.setItem(FAVORITES_KEY, JSON.stringify(uniq(ids))); }
function isFav(id){ return getFavs().includes(id); }
function toggleFav(id){
  const f = getFavs();
  if(f.includes(id)) setFavs(f.filter(x=>x!==id));
  else setFavs([...f, id]);
}

/* ------------------ Busca + realce ------------------ */
function matchScore(text, q){
  const hay = normalize(text);
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if(!terms.length) return 1;
  let score = 0;
  for(const t of terms){ if(hay.includes(t)) score += 1; }
  return score / terms.length;
}
function highlight(text, q){
  if(!q) return text;
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if(!terms.length) return text;
  let result = text;
  for(const t of terms){
    if(!t) continue;
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    result = result.replace(re, "<mark>$1</mark>");
  }
  return result;
}

/* ------------------ Group keys ------------------ */
const groupKey = () => state.tab === "persona" ? "persona" : state.tab === "tema" ? "tema" : "tipo";
const otherKey = () => state.tab === "persona" ? "tema" : state.tab === "tema" ? "tipo" : "persona";

/* -------- Auto-carregamento de prompts_5000.json -------- */
async function tryLoadExternalJSON(){
  try{
    const res = await fetch('prompts_5000.json', { cache: 'no-store' });
    if(res.ok){
      const arr = await res.json();
      if(Array.isArray(arr) && arr.length){
        DATA = arr.map((x,i)=> ({
          id: x.id ?? i+1,
          titulo: x.titulo ?? `Prompt #${i+1}`,
          persona: x.persona ?? 'N/D',
          tema: x.tema ?? 'N/D',
          tipo: x.tipo ?? 'N/D',
          tags: Array.isArray(x.tags) ? x.tags : [],
          prompt: x.prompt ?? ''
        }));
        state.page = 1;
      }
    }
  }catch(e){ /* fallback nos seeds */ }
}

/* ------------------ Renderização ------------------ */
function renderSelects(){
  const gk = groupKey();
  const ok = otherKey();
  const source = state.showOnlyFavorites ? DATA.filter(d=>isFav(d.id)) : DATA;

  const primaryValues = ["Todos", ...uniq(source.map(x => x[gk])).sort()];
  const secondaryValues = ["Todos", ...uniq(source.map(x => x[ok])).sort()];

  primarySelect.innerHTML = primaryValues.map(v => `<option ${v===state.primary?"selected":""}>${v}</option>`).join("");
  secondarySelect.innerHTML = secondaryValues.map(v => `<option ${v===state.secondary?"selected":""}>${v}</option>`).join("");

  primaryLabel.textContent = state.tab==="persona" ? "Todas as Personas" :
                             state.tab==="tema" ? "Todos os Temas" : "Todos os Tipos de Post";
}

function renderChips(total, filtered){
  chips.innerHTML = "";
  const mk = (t)=>{ const s=document.createElement("span"); s.className="chip"; s.textContent=t; return s; };
  chips.append(mk(`Total: ${total}`), mk(`Filtrados: ${filtered}`), mk(`Exibindo: ${Math.min(state.pageSize, filtered)}`));
  if(state.showOnlyFavorites) chips.append(mk("⭐ Exibindo favoritos"));
}

function similarOf(item){
  const pool = (state.showOnlyFavorites ? DATA.filter(d=>isFav(d.id)) : DATA).filter(d => d.id !== item.id);
  const scored = pool.map(d => {
    let s = 0;
    if(d.persona === item.persona) s += 3;
    if(d.tema === item.tema) s += 2;
    if(d.tipo === item.tipo) s += 1;
    s += matchScore(`${d.titulo} ${d.prompt}`, item.persona + " " + item.tema + " " + item.tipo) * .5;
    return {d, s};
  }).sort((a,b)=>b.s-a.s);
  return scored.slice(0,3).map(x=>x.d);
}

function render(){
  const gk = groupKey();
  const ok = otherKey();

  if((location.hash||"#/") === "#/sobre"){
    const about = document.getElementById("about");
    if(about) about.scrollIntoView({behavior:"smooth", block:"start"});
  }

  const base = state.showOnlyFavorites ? DATA.filter(d => isFav(d.id)) : DATA;

  let filtered = base.filter(d => {
    const passesQuery = !state.query || matchScore(`${d.titulo} ${d.prompt} ${d.persona} ${d.tema} ${d.tipo}`, state.query) > 0;
    return passesQuery;
  });
  if(state.primary !== "Todos") filtered = filtered.filter(d => d[gk] === state.primary);
  if(state.secondary !== "Todos") filtered = filtered.filter(d => d[ok] === state.secondary);

  if(state.query){
    filtered = filtered
      .map(d => ({ d, s: matchScore(`${d.titulo} ${d.prompt}`, state.query) }))
      .sort((a,b)=>b.s-a.s).map(x=>x.d);
  }

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = clamp(state.page, 1, pages);
  const start = (state.page - 1) * state.pageSize;
  const slice = filtered.slice(start, start + state.pageSize);

  countEl.textContent = `${(state.showOnlyFavorites ? DATA.filter(d=>isFav(d.id)).length : DATA.length)} prompts`;

  renderSelects();
  renderChips(base.length, total);

  list.innerHTML = "";
  slice.forEach(item => {
    const node = cardTpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".title").innerHTML = highlight(item.titulo, state.query);
    node.querySelector(".meta").textContent = `${item.persona} • ${item.tema} • ${item.tipo}`;
    node.querySelector(".prompt").innerHTML = highlight(item.prompt, state.query);

    const tagsWrap = node.querySelector(".tags");
    (item.tags||[]).forEach(t => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tag";
      b.textContent = `#${t}`;
      b.addEventListener("click", () => {
        searchInput.value = t;
        state.query = t;
        state.page = 1;
        render();
      });
      tagsWrap.appendChild(b);
    });

    const sWrap = node.querySelector(".suggestions");
    const sims = similarOf(item);
    sims.forEach(sim => {
      const s = document.createElement("button");
      s.className = "suggestion";
      s.textContent = `Relacionado: ${sim.titulo}`;
      s.addEventListener("click", () => {
        state.primary = "Todos";
        state.secondary = "Todos";
        state.query = sim.persona + " " + sim.tema + " " + sim.tipo;
        searchInput.value = state.query;
        state.page = 1;
        render();
      });
      sWrap.appendChild(s);
    });

    const copyBtn = node.querySelector(".copy");
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(item.prompt);
      copyBtn.textContent = "Copiado!";
      setTimeout(() => copyBtn.textContent = "Copiar", 1200);
    });

    const favBtn = node.querySelector(".fav");
    const paintFav = () => favBtn.textContent = isFav(item.id) ? "⭐ Favorito" : "⭐ Favoritar";
    paintFav();
    favBtn.addEventListener("click", () => { toggleFav(item.id); paintFav(); });

    list.appendChild(node);
  });

  pageInfo.textContent = `Página ${state.page} de ${pages}`;
  prev.disabled = state.page <= 1;
  next.disabled = state.page >= pages;
}

/* ------------------ Eventos UI ------------------ */
tabs.forEach(btn => btn.addEventListener("click", () => {
  state.tab = btn.dataset.tab;
  state.primary = "Todos";
  state.secondary = "Todos";
  state.page = 1;
  tabs.forEach(t => t.classList.toggle("active", t === btn));
  render();
}));
searchInput.addEventListener("input", (e) => { state.query = e.target.value; state.page = 1; render(); });
primarySelect.addEventListener("change", (e) => { state.primary = e.target.value; state.page = 1; render(); });
secondarySelect.addEventListener("change", (e) => { state.secondary = e.target.value; state.page = 1; render(); });
pageSizeEl.addEventListener("change", (e) => { state.pageSize = parseInt(e.target.value,10); state.page = 1; render(); });
prev.addEventListener("click", () => { state.page = Math.max(1, state.page-1); render(); });
next.addEventListener("click", () => { state.page = state.page+1; render(); });

/* ------------------ Import/Export ------------------ */
btnExport.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "prompts.json";
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); a.remove();
});
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if(!file) return;
  try{
    const text = await file.text();
    const json = JSON.parse(text);
    if(!Array.isArray(json)) throw new Error("JSON inválido: esperado um array de prompts.");
    DATA = json.map((x,i) => ({
      id: x.id ?? i+1,
      titulo: x.titulo ?? `Prompt #${i+1}`,
      persona: x.persona ?? "N/D",
      tema: x.tema ?? "N/D",
      tipo: x.tipo ?? "N/D",
      tags: Array.isArray(x.tags) ? x.tags : [],
      prompt: x.prompt ?? ""
    }));
    state.page = 1;
    render();
  }catch(err){
    alert("Falha ao importar JSON: " + err.message);
  }finally{
    e.target.value = "";
  }
});

/* ------------------ Gerador ------------------ */
function poolFromData(){
  const p = uniq(DATA.map(x => x.persona)).filter(Boolean);
  const t = uniq(DATA.map(x => x.tema)).filter(Boolean);
  const k = uniq(DATA.map(x => x.tipo)).filter(Boolean);
  return {
    personas: p.length ? p : ["Advogado Consumerista","Copywriter","Social Media","Professor de Tecnologia","Especialista em SEO","Mentor de Carreira","Programador","Nutricionista","Designer UX","Gestor de Projetos"],
    temas: t.length ? t : ["Marketing","Criação de Conteúdo","Desenvolvimento Web","Negócios","Direito","Educação","Saúde e Bem-Estar","Produtividade","Inovação","Finanças Pessoais"],
    tipos: k.length ? k : ["Carrossel Instagram","Tweet/Thread","Post LinkedIn","Reels/TikTok","Legenda","Vídeo Longo","Título de Blog","E-mail Marketing","Script de YouTube","Checklist"]
  };
}
function generateRandom(n=50){
  const pool = poolFromData();
  const nextIdStart = (DATA.reduce((m, x) => Math.max(m, x.id||0), 0) || 0) + 1;
  for(let i=0;i<n;i++){
    const persona = pool.personas[Math.floor(Math.random()*pool.personas.length)];
    const tema = pool.temas[Math.floor(Math.random()*pool.temas.length)];
    const tipo = pool.tipos[Math.floor(Math.random()*pool.tipos.length)];
    const id = nextIdStart + i;
    const titulo = `${tipo} • ${tema} • ${persona} • #${id}`;
    const tags = [tema.toLowerCase(), persona.split(" ")[0].toLowerCase(), tipo.split(" ")[0].toLowerCase()];
    const prompt = `Atue como ${persona} e crie um ${tipo.toLowerCase()} sobre ${tema}. ` +
                   `Use linguagem clara, 3 exemplos práticos do contexto brasileiro, ` +
                   `passo a passo, e finalize com um CTA.`;
    DATA.push({ id, titulo, persona, tema, tipo, tags, prompt });
  }
  state.page = 1;
  render();
}
btnGen.addEventListener("click", () => {
  let n = parseInt(genQty.value, 10);
  if(isNaN(n) || n < 1) n = 1;
  if(n > 1000) n = 1000;
  generateRandom(n);
});

/* ------------------ Limpar biblioteca ------------------ */
btnClear.addEventListener("click", () => {
  if(!confirm("Limpar todos os prompts carregados nesta sessão? (Não remove seus arquivos)")) return;
  DATA = [];
  state.page = 1;
  render();
});

/* ------------------ Tema & Roteamento ------------------ */
btnToggleTheme.addEventListener("click", toggleTheme);
function handleRoute(){
  ROUTE = location.hash || "#/";
  state.showOnlyFavorites = ROUTE === "#/favoritos";
  state.page = 1;
  render();
  if(ROUTE === "#/"){ window.scrollTo({ top: 0, behavior: "smooth" }); }
}
window.addEventListener("hashchange", handleRoute);

/* ------------------ Inicialização ------------------ */
loadTheme();
tryLoadExternalJSON().then(()=>{ render(); handleRoute(); });
