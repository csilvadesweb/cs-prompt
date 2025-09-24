// Utilitários
const $ = (sel, ctx=document)=>ctx.querySelector(sel);
const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

// Ano no rodapé
$('#ano').textContent = new Date().getFullYear();

// ===== Tema (dark/light/auto) =====
(function temaInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('cs_theme'); // 'dark' | 'light' | 'auto'
  if(saved){ root.setAttribute('data-theme', saved); }
  $('#btn-tema').addEventListener('click', ()=>{
    const current = root.getAttribute('data-theme') || 'auto';
    const next = current === 'auto' ? 'dark' : current === 'dark' ? 'light' : 'auto';
    root.setAttribute('data-theme', next);
    localStorage.setItem('cs_theme', next);
    toast(next === 'auto' ? 'Tema: Automático' : next === 'dark' ? 'Tema: Escuro' : 'Tema: Claro');
  });
})();

// ===== Estado / feedback =====
function setEstado(text, show=true){
  const e = $('#estado');
  if(!e) return;
  e.textContent = text;
  e.hidden = !show;
}

// ===== Renderização de cards =====
const lista = $('#lista-prompts');
const favWrap = $('#lista-favoritos');
const vazioFav = $('#vazio-fav');
const contagem = $('#resultado-contagem');

const STORAGE_FAV = 'cs_prompt_favs';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]'); }catch{ return []; } }
function setFavs(ids){ localStorage.setItem(STORAGE_FAV, JSON.stringify(ids)); }

function createCard(item){
  const art = document.createElement('article');
  art.className = 'card';
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

function syncFavButtons(){
  const favs = new Set(getFavs());
  $$('.card', lista).forEach(card=>{
    const btn = $('.btn-fav', card);
    const active = favs.has(card.dataset.id);
    btn.textContent = active ? '★' : '☆';
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderFavoritos(){
  favWrap.innerHTML = '';
  const favs = new Set(getFavs());
  const cards = $$('.card', lista).filter(c=>favs.has(c.dataset.id));
  if(cards.length === 0){ vazioFav.style.display='block'; return; }
  vazioFav.style.display='none';
  cards.forEach(c=>{
    const clone = c.cloneNode(true);
    $('.btn-fav', clone)?.addEventListener('click', ()=>toggleFav(clone.dataset.id));
    $('.btn-copy', clone)?.addEventListener('click', ()=>copyPromptFromCard(clone));
    favWrap.appendChild(clone);
  });
}

function toggleFav(id){
  const favs = new Set(getFavs());
  if(favs.has(id)) favs.delete(id); else favs.add(id);
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
function aplicarFiltros() {
  const termo = ($('#q').value || '').toLowerCase().trim();
  const cat = $('.chip.is-active')?.dataset.cat || 'todas';
  let visiveis = 0;
  $$('.card', lista).forEach(card => {
    const texto = card.innerText.toLowerCase();
    const okTermo = !termo || texto.includes(termo);
    const okCat = cat === 'todas' || card.dataset.cat === cat;
    const show = okTermo && okCat;
    card.style.display = show ? '' : 'none';
    if (show) visiveis++;
  });
  contagem.textContent = visiveis ? `${visiveis} prompt(s) encontrados` : 'Nenhum prompt encontrado.';
}
$('#busca').addEventListener('submit', (e)=>{ e.preventDefault(); aplicarFiltros(); });
$$('.chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    $$('.chip').forEach(c=>c.classList.remove('is-active'));
    chip.classList.add('is-active');
    aplicarFiltros();
  });
});

// ===== Doações / PIX =====
const PIX = 'csdesweb@gmail.com';
$('#pix-chave').textContent = PIX;
$('#pix-chave-modal').textContent = PIX;
$('#copiar-pix').addEventListener('click', ()=>{
  navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!'));
});
$('#copiar-pix-modal').addEventListener('click', (e)=>{
  e.preventDefault();
  navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!'));
});
$$('.doe').forEach(btn=>{
  btn.addEventListener('click', ()=>toast(`Obrigado! Sugestão: doe R$ ${btn.dataset.valor} no app do seu banco usando o PIX.`));
});

// Popup de doação (30s)
const dlg = $('#dlg-doacao');
function openDoacao(){ try{ dlg.showModal(); }catch{} }
$('.modal__close', dlg).addEventListener('click', ()=> dlg.close() );
setTimeout(()=>{
  if(!sessionStorage.getItem('cs_doacao_popup')){
    openDoacao();
    sessionStorage.setItem('cs_doacao_popup','1');
  }
}, 30000);

// Voltar ao topo
$('#voltar-topo').addEventListener('click', (e)=>{
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Toast simples =====
function toast(msg){
  let el = $('#toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    Object.assign(el.style, {
      position:'fixed', left:'50%', bottom:'24px', transform:'translateX(-50%)',
      background:'rgba(0,0,0,.85)', color:'#fff', padding:'10px 14px', borderRadius:'10px',
      zIndex:'9999', fontSize:'14px', boxShadow:'0 6px 20px rgba(0,0,0,.3)', maxWidth:'92vw'
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; }, 1600);
}

// ===== Carregar prompts (JSON externo com fallback rápido) =====
(async function loadPrompts(){
  setEstado('Carregando prompts…', true);
  const fallback = [
    {id:'p1', title:'Resumo inteligente de reuniões', category:'produtividade', summary:'Gere resumo com decisões e prazos.', content:`Atue como secretária executiva. Gere um resumo em tópicos com: decisões, responsáveis, prazos e riscos. Datas em DD/MM/AAAA.`},
    {id:'p2', title:'Contestação de cobrança prescrita', category:'advocacia', summary:'Base legal e pedido objetivo.', content:`Atue como advogado (CDC). Redija contestação objetiva para cobrança prescrita (art. 206, §5º, CC). Requeira retirada de anotações e, se cabível, danos morais.`},
    {id:'p3', title:'Plano de estudos personalizado', category:'estudos', summary:'Cronograma adaptado ao tempo do aluno.', content:`Você é um mentor. Baseando-se em [objetivo] e [horas semanais], crie um plano com metas, checkpoints e materiais gratuitos.`},
    {id:'p4', title:'Roteiro de vídeo para Reels', category:'marketing', summary:'Gancho + valor + CTA.', content:`Escreva roteiro de 30s: (1) Gancho 3s, (2) 3 bullets de valor, (3) CTA para salvar e seguir. Linguagem direta.`}
  ];

  let data = [];
  try{
    const r = await fetch('./prompts_5000.json', {cache:'no-store'});
    if(!r.ok) throw 0;
    data = await r.json();
    if(!Array.isArray(data) || !data.length) data = fallback;
  }catch{ data = fallback; }

  // Render
  const frag = document.createDocumentFragment();
  data.forEach(item=> frag.appendChild(createCard(item)));
  lista.appendChild(frag);
  setEstado('', false);
  aplicarFiltros();
  syncFavButtons();
  renderFavoritos();
})();

// ===== Lazy-load simbólico (imagens com loading=lazy já ajudam) =====
const imgs = $$('img[loading="lazy"]');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{ if (entry.isIntersecting) io.unobserve(entry.target); });
  });
  imgs.forEach(img=>io.observe(img));
}
