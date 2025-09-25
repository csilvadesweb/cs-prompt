// ===== Helpers =====
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
$('#ano').textContent=new Date().getFullYear();

// Tema
(function(){
  const root=document.documentElement;
  const saved=localStorage.getItem('cs_theme');
  if(saved) root.setAttribute('data-theme',saved);
  $('#btn-tema').addEventListener('click',()=>{
    const cur=root.getAttribute('data-theme')||'auto';
    const next=cur==='auto'?'dark':cur==='dark'?'light':'auto';
    root.setAttribute('data-theme',next);
    localStorage.setItem('cs_theme',next);
    toast(`Tema: ${next}`);
  });
})();

// Estado & Toast
function setEstado(t,show=true){ const e=$('#estado'); if(!e) return; e.textContent=t; e.hidden=!show; }
function toast(msg){
  let el=$('#toast'); if(!el){ el=document.createElement('div'); el.id='toast';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',background:'rgba(0,0,0,.85)',color:'#fff',padding:'10px 14px',borderRadius:'10px',zIndex:'9999',fontSize:'14px',boxShadow:'0 6px 20px rgba(0,0,0,.3)'}); document.body.appendChild(el); }
  el.textContent=msg; el.style.opacity='1'; setTimeout(()=>{el.style.transition='opacity .4s';el.style.opacity='0';},1600);
}

// PIX & Doação
const PIX='csdesweb@gmail.com';
$('#pix-chave').textContent=PIX; $('#pix-chave-modal').textContent=PIX;
$('#copiar-pix').addEventListener('click',()=>navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!')));
$('#copiar-pix-modal').addEventListener('click',(e)=>{e.preventDefault();navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!'));});
$$('.doe').forEach(b=>b.addEventListener('click',()=>toast(`Obrigado! Doe R$ ${b.dataset.valor}.`)));
const dlg=$('#dlg-doacao'); $('.modal__close',dlg).addEventListener('click',()=>dlg.close());
setTimeout(()=>{ if(!sessionStorage.getItem('cs_doacao_popup')){ try{dlg.showModal();}catch{} sessionStorage.setItem('cs_doacao_popup','1'); }},30000);

// Voltar topo
$('#voltar-topo').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});

// ===== Favoritos =====
const STORAGE_FAV='cs_prompt_favs';
function getFavs(){ try{return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]')}catch{return[]} }
function setFavs(v){ localStorage.setItem(STORAGE_FAV,JSON.stringify(v)); }
function toggleFav(id){ const s=new Set(getFavs()); s.has(id)?s.delete(id):s.add(id); setFavs([...s]); syncFavButtons(); renderFavoritos(); toast(s.has(id)?'Adicionado aos favoritos':'Removido dos favoritos'); }
function syncFavButtons(){ const s=new Set(getFavs()); $$('.card').forEach(c=>{ const b=c.querySelector('.btn-fav'); if(!b) return; const on=s.has(c.dataset.id); b.textContent=on?'★':'☆'; b.setAttribute('aria-pressed',on?'true':'false'); }); }
function renderFavoritos(){
  const wrap=$('#lista-favoritos'), vazio=$('#vazio-fav'); wrap.innerHTML='';
  const s=new Set(getFavs()); const cards=$$('.card').filter(c=>s.has(c.dataset.id));
  if(cards.length===0){ vazio.style.display='block'; return; } vazio.style.display='none';
  cards.forEach(c=>{ const clone=c.cloneNode(true);
    clone.querySelector('.btn-copy')?.addEventListener('click',()=>copyPromptFromCard(clone));
    clone.querySelector('.btn-fav')?.addEventListener('click',()=>toggleFav(clone.dataset.id));
    wrap.appendChild(clone);
  });
}
function copyPromptFromCard(card){
  const code=card.querySelector('pre code'); if(!code) return;
  navigator.clipboard.writeText(code.innerText.trim()).then(()=>{
    toast('Prompt copiado!');
    if(!sessionStorage.getItem('cs_doacao_popup')){ setTimeout(()=>{try{dlg.showModal();}catch{}},300); sessionStorage.setItem('cs_doacao_popup','1'); }
  });
}

// ===== Dados & UI =====
const lista=$('#lista-prompts'), contagem=$('#resultado-contagem'), chips=$('#chips');
const btnMais=$('#btn-carregar-mais'), ordenarSel=$('#ordenar'), limparBtn=$('#limpar-filtros'), loadAllBtn=$('#carregar-todas');

let CATEGORIES_INDEX=[];           // nomes das categorias
const LOADED_BY_CAT=new Map();     // cat => array de prompts carregados
let CURRENT_VIEW=[];               // prompts filtrados/ordenados
let PAGE=0; const PAGE_SIZE=24;

function createCard(p){
  const el=document.createElement('article'); el.className='card'; el.dataset.id=p.id; el.dataset.cat=p.category;
  el.innerHTML=`<header class="card__head"><h3>${p.title}</h3>
    <div class="card__actions"><button class="btn icon btn-copy" title="Copiar prompt">📋</button>
    <button class="btn icon btn-fav" title="Favoritar">☆</button></div></header>
    <p>${p.summary||''}</p>
    <details><summary>Ver prompt</summary><pre><code>${p.content.trim()}</code></pre></details>`;
  el.querySelector('.btn-copy').addEventListener('click',()=>copyPromptFromCard(el));
  el.querySelector('.btn-fav').addEventListener('click',()=>toggleFav(p.id));
  return el;
}

function renderChips(){
  chips.innerHTML='';
  const mk=(name,active=false)=>{
    const b=document.createElement('button'); b.className='chip'+(active?' is-active':''); b.dataset.cat=name;
    b.textContent=name.charAt(0).toUpperCase()+name.slice(1);
    b.addEventListener('click',()=>{ $$('.chip',chips).forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active'); applyFiltersAndRender(); });
    chips.appendChild(b);
  };
  mk('todas',true);
  CATEGORIES_INDEX.forEach(c=>mk(c));
}

function normalize(raw,idx){
  const id=String(raw.id ?? raw.ID ?? raw.slug ?? `item_${idx+1}`);
  const title=String(raw.title ?? raw.titulo ?? raw.name ?? 'Sem título');
  const category=String(raw.category ?? raw.categoria ?? raw.cat ?? 'outros').toLowerCase();
  const summary=String(raw.summary ?? raw.descricao ?? raw.desc ?? '');
  const content=String(raw.content ?? raw.prompt ?? raw.texto ?? raw.text ?? '').trim();
  if(!content) return null; return {id,title,category,summary,content};
}

function catUrl(cat){
  const base=(location.pathname.endsWith('/')?location.pathname:location.pathname.replace(/[^/]+$/,''));
  return new URL(`data/${encodeURIComponent(cat)}.json`, location.origin+base).toString();
}

async function loadCategory(cat){
  if(LOADED_BY_CAT.has(cat)) return LOADED_BY_CAT.get(cat);
  setEstado(`Carregando ${cat}…`, true);
  let arr=[];
  try{
    const r=await fetch(catUrl(cat),{cache:'no-store'});
    if(r.ok){
      const j=await r.json();
      const a=Array.isArray(j)?j:(Array.isArray(j.prompts)?j.prompts:[]);
      arr=a.map(normalize).filter(Boolean);
    }
  }catch{}
  LOADED_BY_CAT.set(cat, arr);
  setEstado('', false);
  return arr;
}

function currentSelectedCategory(){
  const chip=$('.chip.is-active',chips); return chip?chip.dataset.cat:'todas';
}

function applyFiltersAndRender(){
  const termo=($('#q').value||'').toLowerCase().trim();
  const sel=currentSelectedCategory();
  let pool=[];
  if(sel==='todas'){
    // junta as categorias já carregadas
    LOADED_BY_CAT.forEach(v=>pool=pool.concat(v));
  }else{
    pool = LOADED_BY_CAT.get(sel) || [];
  }
  // filtro + ordenação
  CURRENT_VIEW = pool.filter(p=>{
    const okCat = sel==='todas' || p.category===sel;
    const txt = (p.title+' '+(p.summary||'')+' '+p.content).toLowerCase();
    const okTermo = !termo || txt.includes(termo);
    return okCat && okTermo;
  });
  const ord=ordenarSel.value;
  CURRENT_VIEW.sort((a,b)=>{
    if(ord==='categoria') return (a.category||'').localeCompare(b.category||'') || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
  // paginação
  PAGE=0; lista.innerHTML=''; renderPage();
  contagem.textContent = CURRENT_VIEW.length ? `${CURRENT_VIEW.length} prompt(s) encontrados` : 'Nenhum prompt encontrado.';
  syncFavButtons(); renderFavoritos();
}

function renderPage(){
  const start=PAGE*PAGE_SIZE, end=Math.min(start+PAGE_SIZE, CURRENT_VIEW.length);
  const frag=document.createDocumentFragment();
  for(let i=start;i<end;i++) frag.appendChild(createCard(CURRENT_VIEW[i]));
  lista.appendChild(frag);
  PAGE++;
  $('#btn-carregar-mais').hidden = (PAGE*PAGE_SIZE >= CURRENT_VIEW.length);
}

// Eventos
$('#btn-carregar-mais').addEventListener('click', renderPage);
$('#busca').addEventListener('submit', e=>{e.preventDefault(); applyFiltersAndRender();});
$('#ordenar').addEventListener('change', applyFiltersAndRender);
$('#limpar-filtros').addEventListener('click', ()=>{
  $('#q').value=''; $$('.chip',chips).forEach(c=>c.classList.remove('is-active')); $('.chip',chips)?.classList.add('is-active');
  $('#ordenar').value='titulo'; applyFiltersAndRender();
});
$('#carregar-todas').addEventListener('click', async ()=>{
  setEstado('Carregando todas as categorias…', true);
  for(const cat of CATEGORIES_INDEX){ await loadCategory(cat); }
  setEstado('', false);
  // Seleciona "todas"
  $$('.chip',chips).forEach(c=>c.classList.remove('is-active')); $('.chip',chips)?.classList.add('is-active');
  applyFiltersAndRender(); toast('Todas as categorias carregadas!');
});

// ===== Inicialização: ler o índice de categorias e carregar a primeira =====
(async function init(){
  // 1) Lê categories.json
  const base=(location.pathname.endsWith('/')?location.pathname:location.pathname.replace(/[^/]+$/,''));
  const idxUrl=new URL('categories.json', location.origin+base).toString();
  try{
    const r=await fetch(idxUrl,{cache:'no-store'});
    if(!r.ok) throw 0;
    const j=await r.json();
    CATEGORIES_INDEX = Array.isArray(j)?j:(Array.isArray(j.categories)?j.categories:[]);
  }catch{
    CATEGORIES_INDEX = ['produtividade']; // fallback mínimo
  }
  renderChips();

  // 2) Carrega automaticamente a primeira categoria do índice
  const first = CATEGORIES_INDEX[0] || 'produtividade';
  await loadCategory(first);
  applyFiltersAndRender();
})();