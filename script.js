// ===== Helpers =====
const $ = (sel, ctx=document)=>ctx.querySelector(sel);
const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

// Ano rodapé
$('#ano').textContent = new Date().getFullYear();

// ===== Tema (auto/dark/light) =====
(function temaInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('cs_theme'); // 'dark' | 'light' | 'auto'
  if(saved) root.setAttribute('data-theme', saved);
  $('#btn-tema').addEventListener('click', ()=>{
    const cur = root.getAttribute('data-theme') || 'auto';
    const next = cur==='auto' ? 'dark' : cur==='dark' ? 'light' : 'auto';
    root.setAttribute('data-theme', next);
    localStorage.setItem('cs_theme', next);
    toast(`Tema: ${next}`);
  });
})();

// ===== Estado =====
function setEstado(text, show=true){ const e=$('#estado'); if(!e) return; e.textContent=text; e.hidden=!show; }

// ===== Toast =====
function toast(msg){
  let el=$('#toast');
  if(!el){
    el=document.createElement('div');
    el.id='toast';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',background:'rgba(0,0,0,.85)',color:'#fff',padding:'10px 14px',borderRadius:'10px',zIndex:'9999',fontSize:'14px',boxShadow:'0 6px 20px rgba(0,0,0,.3)',maxWidth:'92vw'});
    document.body.appendChild(el);
  }
  el.textContent=msg; el.style.opacity='1';
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; }, 1600);
}

// ===== Favoritos =====
const STORAGE_FAV = 'cs_prompt_favs';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]'); }catch{ return []; } }
function setFavs(ids){ localStorage.setItem(STORAGE_FAV, JSON.stringify(ids)); }

function syncFavButtons(){
  const favs = new Set(getFavs());
  $$('.card').forEach(card=>{
    const btn = card.querySelector('.btn-fav');
    if(!btn) return;
    const active = favs.has(card.dataset.id);
    btn.textContent = active ? '★' : '☆';
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderFavoritos(){
  const favs = new Set(getFavs());
  const favWrap = $('#lista-favoritos');
  const vazio = $('#vazio-fav');
  favWrap.innerHTML = '';
  const favoritos = $$('.card').filter(c=>favs.has(c.dataset.id));
  if(favoritos.length===0){ vazio.style.display='block'; return; }
  vazio.style.display='none';
  favoritos.forEach(c=>{
    const clone = c.cloneNode(true);
    // reata listeners
    const btnFav = clone.querySelector('.btn-fav');
    const btnCopy = clone.querySelector('.btn-copy');
    btnFav?.addEventListener('click', ()=>toggleFav(clone.dataset.id));
    btnCopy?.addEventListener('click', ()=>copyPromptFromCard(clone));
    favWrap.appendChild(clone);
  });
}

function toggleFav(id){
  const favs = new Set(getFavs());
  favs.has(id) ? favs.delete(id) : favs.add(id);
  setFavs([...favs]);
  syncFavButtons();
  renderFavoritos();
  toast(favs.has(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
}

function copyPromptFromCard(card){
  const code = card.querySelector('pre code');
  if(!code) return;
  navigator.clipboard.writeText(code.innerText.trim()).then(()=>{
    toast('Prompt copiado!');
    if(!sessionStorage.getItem('cs_doacao_popup')){
      setTimeout(()=>openDoacao(), 300);
      sessionStorage.setItem('cs_doacao_popup','1');
    }
  });
}

// ===== Busca + filtros =====
const contagem = $('#resultado-contagem');
function aplicarFiltros(){
  const termo = ($('#q').value || '').toLowerCase().trim();
  const catBtn = $('.chip.is-active');
  const cat = catBtn ? catBtn.dataset.cat : 'todas';
  let visiveis=0;
  $$('.card').forEach(card=>{
    const txt = card.innerText.toLowerCase();
    const okTermo = !termo || txt.includes(termo);
    const okCat = cat==='todas' || card.dataset.cat===cat;
    const show = okTermo && okCat;
    card.style.display = show ? '' : 'none';
    if(show) visiveis++;
  });
  contagem.textContent = visiveis ? `${visiveis} prompt(s) encontrados` : 'Nenhum prompt encontrado.';
}
$('#busca').addEventListener('submit', e=>{ e.preventDefault(); aplicarFiltros(); });

// ===== Doação / PIX =====
const PIX='csdesweb@gmail.com';
$('#pix-chave').textContent=PIX;
$('#pix-chave-modal').textContent=PIX;
$('#copiar-pix').addEventListener('click', ()=>navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!')));
$('#copiar-pix-modal').addEventListener('click', (e)=>{e.preventDefault(); navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!'));});
$$('.doe').forEach(b=>b.addEventListener('click', ()=>toast(`Obrigado! Doe R$ ${b.dataset.valor} no app do seu banco.`)));

// Popup de doação
const dlg = $('#dlg-doacao');
function openDoacao(){ try{ dlg.showModal(); }catch{} }
$('.modal__close', dlg).addEventListener('click', ()=> dlg.close() );
setTimeout(()=>{ if(!sessionStorage.getItem('cs_doacao_popup')){ openDoacao(); sessionStorage.setItem('cs_doacao_popup','1'); } }, 30000);

// Voltar ao topo
$('#voltar-topo').addEventListener('click', e=>{ e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });

// ===== Criação de cards =====
function createCard(item){
  const art = document.createElement('article');
  art.className='card';
  art.dataset.id = item.id;
  art.dataset.cat = item.category || 'outros';
  art.innerHTML = `
    <header class="card__head">
      <h3>${item.title}</h3>
      <div class="card__actions">
        <button class="btn icon btn-copy" title="Copiar prompt" aria-label="Copiar prompt">📋</button>
        <button class="btn icon btn-fav" title="Favoritar" aria-label="Favoritar">☆</button>
      </div>
    </header>
    <p>${item.summary || ''}</p>
    <details>
      <summary>Ver prompt</summary>
      <pre><code>${item.content.trim()}</code></pre>
    </details>
  `;
  $('.btn-copy', art).addEventListener('click', ()=>copyPromptFromCard(art));
  $('.btn-fav', art).addEventListener('click', ()=>toggleFav(item.id));
  return art;
}

// ===== Chips dinâmicos =====
function renderChips(cats){
  const wrap = $('#chips'); wrap.innerHTML='';
  const mk = (name, active=false)=>{
    const b=document.createElement('button');
    b.className='chip'+(active?' is-active':''); b.dataset.cat=name;
    b.textContent = name.charAt(0).toUpperCase()+name.slice(1);
    b.addEventListener('click', ()=>{
      $$('.chip', wrap).forEach(x=>x.classList.remove('is-active'));
      b.classList.add('is-active'); aplicarFiltros();
    });
    wrap.appendChild(b);
  };
  mk('todas', true);
  [...cats].sort().forEach(c=>mk(c));
}

// ===== Carregar prompts (JSON na raiz, com fallback) =====
(async function loadPrompts(){
  setEstado('Carregando prompts…', true);

  // Caminho absoluto (funciona em GitHub Pages dentro de /cs-prompt/)
  const base = (location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/[^/]+$/, ''));
  const jsonURL = new URL('prompts_5000.json', location.origin + base).toString();

  // Fallback interno (caso JSON não exista)
  const FALLBACK = [
    {id:'p1', title:'Resumo inteligente de reuniões', category:'produtividade', summary:'Decisões, responsáveis e prazos.', content:`Atue como secretária executiva. Gere resumo com: decisões, responsáveis, prazos e riscos. Datas DD/MM/AAAA.`},
    {id:'p2', title:'Contestação de cobrança prescrita', category:'advocacia', summary:'Base legal objetiva.', content:`Atue como advogado especialista em CDC. Conteste cobrança prescrita (art. 206, §5º, CC). Peça retirada de anotações e danos morais se cabível.`},
    {id:'p3', title:'Plano de estudos personalizado', category:'estudos', summary:'Cronograma por metas.', content:`Você é mentor. Com [objetivo] e [horas/semana], crie plano com metas semanais, checkpoints e materiais gratuitos.`}
  ];

  let data=[];
  try{
    const r = await fetch(jsonURL, {cache:'no-store'});
    if(!r.ok) throw 0;
    const raw = await r.json();
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw.prompts) ? raw.prompts : [];
    data = arr.map((it,idx)=>{
      const id = String(it.id ?? it.ID ?? it.slug ?? `item_${idx+1}`);
      const title = String(it.title ?? it.titulo ?? it.name ?? 'Sem título');
      const category = String(it.category ?? it.categoria ?? it.cat ?? 'outros').toLowerCase();
      const summary = String(it.summary ?? it.descricao ?? it.desc ?? '');
      const content = String(it.content ?? it.prompt ?? it.texto ?? it.text ?? '').trim();
      if(!content) return null;
      return {id,title,category,summary,content};
    }).filter(Boolean);
    if(!data.length) data = FALLBACK;
  }catch{ data = FALLBACK; }

  // Render cards e chips
  const frag = document.createDocumentFragment();
  const catSet = new Set();
  data.forEach(item=>{ frag.appendChild(createCard(item)); catSet.add(item.category); });
  $('#lista-prompts').appendChild(frag);
  renderChips(catSet);

  setEstado('', false);
  aplicarFiltros();
  syncFavButtons();
  renderFavoritos();
})();

// ===== Lazy básico =====
const imgs = $$('img[loading="lazy"]');
if('IntersectionObserver' in window){
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) io.unobserve(e.target); }));
  imgs.forEach(i=>io.observe(i));
}
