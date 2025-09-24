// Helpers
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
    const msg = next === 'auto' ? 'Tema: Automático' : next === 'dark' ? 'Tema: Escuro' : 'Tema: Claro';
    toast(msg);
  });
})();

// ===== Busca + filtros =====
const lista = $('#lista-prompts');
const cards = $$('.card', lista);
const chips = $$('.chip');
const contagem = $('#resultado-contagem');
function aplicarFiltros() {
  const termo = ($('#q').value || '').toLowerCase().trim();
  const cat = $('.chip.is-active')?.dataset.cat || 'todas';
  let visiveis = 0;
  cards.forEach(card => {
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
chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('is-active'));
    chip.classList.add('is-active');
    aplicarFiltros();
  });
});

// ===== Copiar prompt + favoritos =====
const STORAGE_FAV = 'cs_prompt_favs';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]'); }catch{ return []; } }
function setFavs(ids){ localStorage.setItem(STORAGE_FAV, JSON.stringify(ids)); }
function syncFavButtons(){
  const favs = new Set(getFavs());
  $$('.card').forEach(card=>{
    const id = card.dataset.id;
    const btn = $('.btn-fav', card);
    if(!btn) return;
    const active = favs.has(id);
    btn.textContent = active ? '★' : '☆';
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}
function renderFavoritos(){
  const favWrap = $('#lista-favoritos');
  const vazio = $('#vazio-fav');
  favWrap.innerHTML = '';
  const favs = new Set(getFavs());
  const favoritos = cards.filter(c=>favs.has(c.dataset.id));
  if(favoritos.length === 0){ vazio.style.display='block'; return; }
  vazio.style.display='none';
  favoritos.forEach(c=>{
    const clone = c.cloneNode(true);
    // evitar IDs duplicados e listeners antigos
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
    // Gatinho: abre o popup de doação após copiar (uma vez por sessão)
    if(!sessionStorage.getItem('cs_doacao_popup')){
      setTimeout(()=>openDoacao(), 300);
      sessionStorage.setItem('cs_doacao_popup','1');
    }
  });
}
$$('.btn-copy').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const card = e.currentTarget.closest('.card');
    copyPromptFromCard(card);
  });
});
$$('.btn-fav').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const card = e.currentTarget.closest('.card');
    toggleFav(card.dataset.id);
  });
});
syncFavButtons();
renderFavoritos();

// ===== PIX / Doação =====
const PIX = 'csdesweb@gmail.com';
$('#pix-chave').textContent = PIX;
$('#pix-chave-modal').textContent = PIX;
$('#copiar-pix').addEventListener('click', ()=>{
  navigator.clipboard.writeText(PIX).then(()=>{
    toast('Chave PIX copiada!');
  });
});
$('#copiar-pix-modal').addEventListener('click', (e)=>{
  e.preventDefault();
  navigator.clipboard.writeText(PIX).then(()=>{
    toast('Chave PIX copiada!');
  });
});
$$('.doe').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    toast(`Obrigado! Sugestão: doe R$ ${btn.dataset.valor} no seu app do banco usando o PIX.`);
  });
});

// Popup de doação (após 30s)
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
      background:'rgba(0,0,0,.8)', color:'#fff', padding:'10px 14px', borderRadius:'10px',
      zIndex:'9999', fontSize:'14px', boxShadow:'0 6px 20px rgba(0,0,0,.3)'
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; }, 1600);
}

// ===== Lazy-load simbólico (já usamos loading=lazy) =====
const imgs = $$('img[loading="lazy"]');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting) io.unobserve(entry.target);
    });
  });
  imgs.forEach(img=>io.observe(img));
}
