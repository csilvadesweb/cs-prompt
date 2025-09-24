// Helpers
const $ = (sel, ctx=document)=>ctx.querySelector(sel);
const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

// Ano rodapé
$('#ano').textContent = new Date().getFullYear();

// Tema (auto/dark/light)
(function temaInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('cs_theme');
  if(saved) root.setAttribute('data-theme', saved);
  $('#btn-tema').addEventListener('click', ()=>{
    const cur = root.getAttribute('data-theme') || 'auto';
    const next = cur==='auto' ? 'dark' : cur==='dark' ? 'light' : 'auto';
    root.setAttribute('data-theme', next);
    localStorage.setItem('cs_theme', next);
    toast(`Tema: ${next}`);
  });
})();

// Estado
function setEstado(text, show=true){ const e=$('#estado'); if(!e) return; e.textContent=text; e.hidden=!show; }

// ======== CATEGORIAS ========
// Lista ampla de categorias pré-definidas (pode adicionar mais à vontade)
const PRESET_CATS = [
  'produtividade','advocacia','estudos','marketing','programação','design','seo','copywriting','redes-sociais',
  'instagram','tiktok','youtube','telegram','whatsapp','ecommerce','vendas','atendimento','finanças','investimentos',
  'empreendedorismo','recursos-humanos','contratos','jurídico','saúde','bem-estar','educação','idiomas','viagens',
  'gastronomia','imobiliário','logística','dados','automação','low-code','no-code','analytics','ux','ui','email',
  'blog','noticias','tradução','roteiro','publicidade','fotografia','áudio','podcast','video','newsletter','gestão',
  'projetos','okrs','crm','suporte','helpdesk','teste','qa','segurança','devops','cloud','documentação','legal'
];

// ======== FALLBACK DE PROMPTS (caso JSON não exista) ========
const FALLBACK_PROMPTS = [
  {id:'p1', title:'Resumo inteligente de reuniões', category:'produtividade', summary:'Decisões, responsáveis e prazos.', content:`Atue como secretária executiva. Com base no texto abaixo, gere um resumo em tópicos com: decisões, responsáveis, prazos e riscos. Use datas DD/MM/AAAA.`},
  {id:'p2', title:'Contestação de cobrança prescrita', category:'advocacia', summary:'Base legal objetiva.', content:`Atue como advogado especialista em CDC. Elabore contestação para cobrança prescrita (art. 206, §5º, CC). Fundamente e peça retirada de anotações e danos morais se cabível.`},
  {id:'p3', title:'Plano de estudos personalizado', category:'estudos', summary:'Cronograma por metas.', content:`Você é mentor. Com [objetivo] e [horas/semana], crie plano com metas semanais, checkpoints, materiais gratuitos e técnica de revisão espaçada.`},
  {id:'p4', title:'Roteiro de Reels 30s', category:'marketing', summary:'Gancho + valor + CTA.', content:`Escreva um roteiro de 30s: (1) Gancho 3s, (2) 3 bullets de valor, (3) CTA para salvar e seguir. Linguagem simples e energética.`},
  {id:'p5', title:'Checklist de SEO on-page', category:'seo', summary:'Título, meta, H1-H3, links.', content:`Gere um checklist on-page para a página [URL ou tema], cobrindo: title, meta description, H1-H3, densidade semântica, links internos, schema apropriado e FAQs.`},
  {id:'p6', title:'Copy para página de vendas', category:'copywriting', summary:'Headline, benefícios, prova, CTA.', content:`Crie uma página de vendas com: headline forte, promessa clara, bullets de benefícios, prova social, garantia e 2 CTAs. Tom confiante e objetivo.`},
  {id:'p7', title:'Calendário editorial Instagram', category:'instagram', summary:'30 dias de posts.', content:`Gere um calendário de 30 dias de posts para [nicho]. Inclua ideia, legenda sugerida, formato (Carrossel/Reels/Story) e CTA em cada dia.`},
  {id:'p8', title:'Roteiro de vídeo YouTube', category:'youtube', summary:'Abertura, tópicos, CTA.', content:`Crie roteiro de 8-10min: abertura com promessa, 4-6 tópicos com exemplos, CTA para comentar/inscrever e resumo final com próxima ação.`},
  {id:'p9', title:'Atendimento empático no WhatsApp', category:'whatsapp', summary:'Tom humano e objetivo.', content:`Responda ao cliente irritado de forma empática, reconhecendo o problema, propondo solução em 3 passos e confirmando satisfação ao final.`},
  {id:'p10', title:'Estratégia de funil para e-commerce', category:'ecommerce', summary:'Topo, meio, fundo.', content:`Crie estratégia de funil para loja [segmento] com ações de topo, meio e fundo: conteúdos, ofertas, e-mails e remarketing.`},
  {id:'p11', title:'Follow-up de vendas', category:'vendas', summary:'Sequência de 5 mensagens.', content:`Escreva sequência de 5 follow-ups para lead frio, espaçados em 2/3/5/7/10 dias. Cada mensagem com novo ângulo de valor e CTA leve.`},
  {id:'p12', title:'Onboarding de cliente (SaaS)', category:'atendimento', summary:'Passos e métricas.', content:`Monte um onboarding de 14 dias para SaaS [produto], com objetivos, mensagens de ativação, marcos de sucesso e métricas a monitorar.`},
  {id:'p13', title:'Planejamento financeiro pessoal', category:'finanças', summary:'50/30/20 + metas.', content:`Crie plano mensal usando 50/30/20, metas SMART e checklist de emergência. Inclua dicas de negociação e cortes sem perder qualidade de vida.`},
  {id:'p14', title:'Estratégia de conteúdo para blog', category:'blog', summary:'Pilares e calendário.', content:`Sugira 4 pilares de conteúdo e 12 títulos SEO por pilar para [nicho], com intenção de busca e estrutura H2/H3.`},
  {id:'p15', title:'Prompt seguro para DevOps', category:'devops', summary:'Checklist de release.', content:`Crie checklist de release: versionamento, changelog, testes, rollback plan, observabilidade, comunicação e validação pós-deploy.`},
  {id:'p16', title:'Esqueleto de contrato simples', category:'contratos', summary:'Cláusulas essenciais.', content:`Crie estrutura de contrato de prestação de serviços (escopo, prazo, pagamento, confidencialidade, propriedade intelectual, rescisão, foro).`},
  {id:'p17', title:'Briefing de design', category:'design', summary:'Tom, paleta, assets.', content:`Gere briefing para identidade visual: público, atributos da marca, paleta sugerida (HEX), tipografia, referências e entregáveis.`},
  {id:'p18', title:'Plano de estudo de programação', category:'programação', summary:'Front ou Back.', content:`Monte trilha de estudos para [front/back] em 12 semanas com metas, projetos práticos e avaliação semanal.`},
  {id:'p19', title:'Roteiro de podcast', category:'podcast', summary:'Estrutura e perguntas.', content:`Crie roteiro para episódio sobre [tema] com abertura, pauta, perguntas-guia, transições e encerramento com CTA.`},
  {id:'p20', title:'Política de privacidade básica', category:'legal', summary:'Coleta, uso, direitos.', content:`Redija política de privacidade para site simples, cobrindo dados coletados, finalidade, base legal, direitos do titular e contato.`}
];

// ======== Renderização ========
const lista = $('#lista-prompts');
const favWrap = $('#lista-favoritos');
const vazioFav = $('#vazio-fav');
const contagem = $('#resultado-contagem');
const chipsWrap = $('#chips');

const STORAGE_FAV = 'cs_prompt_favs';
function getFavs(){ try{ return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]'); }catch{ return []; } }
function setFavs(ids){ localStorage.setItem(STORAGE_FAV, JSON.stringify(ids)); }

function createCard(item){
  const art = document.createElement('article');
  art.className='card';
  art.dataset.id=item.id;
  art.dataset.cat=item.category||'outros';
  art.innerHTML = `
    <header class="card__head">
      <h3>${item.title}</h3>
      <div class="card__actions">
        <button class="btn icon btn-copy" title="Copiar prompt" aria-label="Copiar prompt">📋</button>
        <button class="btn icon btn-fav" title="Favoritar" aria-label="Favoritar">☆</button>
      </div>
    </header>
    <p>${item.summary||''}</p>
    <details><summary>Ver prompt</summary><pre><code>${item.content.trim()}</code></pre></details>
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
  favWrap.innerHTML='';
  const favs = new Set(getFavs());
  const cards = $$('.card', lista).filter(c=>favs.has(c.dataset.id));
  if(cards.length===0){ vazioFav.style.display='block'; return; }
  vazioFav.style.display='none';
  cards.forEach(c=>{
    const clone=c.cloneNode(true);
    $('.btn-fav', clone)?.addEventListener('click', ()=>toggleFav(clone.dataset.id));
    $('.btn-copy', clone)?.addEventListener('click', ()=>copyPromptFromCard(clone));
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

// Busca + filtros
function aplicarFiltros(){
  const termo = ($('#q').value||'').toLowerCase().trim();
  const activeChip = $('.chip.is-active', chipsWrap);
  const cat = activeChip ? activeChip.dataset.cat : 'todas';
  let visiveis=0;
  $$('.card', lista).forEach(card=>{
    const texto = card.innerText.toLowerCase();
    const okTermo = !termo || texto.includes(termo);
    const okCat = cat==='todas' || card.dataset.cat===cat;
    const show = okTermo && okCat;
    card.style.display = show ? '' : 'none';
    if(show) visiveis++;
  });
  contagem.textContent = visiveis ? `${visiveis} prompt(s) encontrados` : 'Nenhum prompt encontrado.';
}
$('#busca').addEventListener('submit', e=>{ e.preventDefault(); aplicarFiltros(); });

// Chips dinâmicos (preset + categorias encontradas)
function renderChips(allCats){
  chipsWrap.innerHTML='';
  const make = (name, active=false)=>{
    const b=document.createElement('button');
    b.className='chip' + (active?' is-active':'');
    b.dataset.cat=name;
    b.textContent = name.charAt(0).toUpperCase()+name.slice(1);
    b.addEventListener('click', ()=>{
      $$('.chip', chipsWrap).forEach(c=>c.classList.remove('is-active'));
      b.classList.add('is-active');
      aplicarFiltros();
    });
    chipsWrap.appendChild(b);
  };
  make('todas', true);
  [...allCats].sort().forEach(c=>make(c));
}

// Doação / PIX
const PIX='csdesweb@gmail.com';
$('#pix-chave').textContent=PIX;
$('#pix-chave-modal').textContent=PIX;
$('#copiar-pix').addEventListener('click', ()=>navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!')));
$('#copiar-pix-modal').addEventListener('click', (e)=>{e.preventDefault(); navigator.clipboard.writeText(PIX).then(()=>toast('Chave PIX copiada!'));});
$$('.doe').forEach(b=>b.addEventListener('click', ()=>toast(`Obrigado! Doe R$ ${b.dataset.valor} no seu app do banco.`)));

// Popup de doação
const dlg = $('#dlg-doacao');
function openDoacao(){ try{ dlg.showModal(); }catch{} }
$('.modal__close', dlg).addEventListener('click', ()=>dlg.close());
setTimeout(()=>{ if(!sessionStorage.getItem('cs_doacao_popup')){ openDoacao(); sessionStorage.setItem('cs_doacao_popup','1'); } }, 30000);

// Voltar topo
$('#voltar-topo').addEventListener('click', e=>{ e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });

// Toast
function toast(msg){
  let el=$('#toast');
  if(!el){
    el=document.createElement('div'); el.id='toast';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',background:'rgba(0,0,0,.85)',color:'#fff',padding:'10px 14px',borderRadius:'10px',zIndex:'9999',fontSize:'14px',boxShadow:'0 6px 20px rgba(0,0,0,.3)',maxWidth:'92vw'});
    document.body.appendChild(el);
  }
  el.textContent=msg; el.style.opacity='1';
  setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; },1600);
}

// ====== Carregar prompts (JSON externo com robustez) ======
(async function loadPrompts(){
  setEstado('Carregando prompts…', true);

  // Caminho absoluto correto no GitHub Pages
  const base = (location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/[^/]+$/, ''));
  const jsonURL = new URL('prompts_5000.json', location.origin + base).toString();

  let data=[];
  try{
    const r = await fetch(jsonURL, {cache:'no-store'});
    if(!r.ok) throw 0;
    const raw = await r.json();
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw.prompts) ? raw.prompts : [];
    data = arr.map((raw,idx)=>{
      const id = String(raw.id ?? raw.ID ?? raw.slug ?? `item_${idx+1}`);
      const title = String(raw.title ?? raw.titulo ?? raw.name ?? 'Sem título');
      const category = String(raw.category ?? raw.categoria ?? raw.cat ?? 'outros').toLowerCase();
      const summary = String(raw.summary ?? raw.descricao ?? raw.desc ?? '');
      const content = String(raw.content ?? raw.prompt ?? raw.texto ?? raw.text ?? '').trim();
      if(!content) return null;
      return {id,title,category,summary,content};
    }).filter(Boolean);
    if(!data.length) data = FALLBACK_PROMPTS;
  }catch{ data = FALLBACK_PROMPTS; }

  // Render cards
  const frag = document.createDocumentFragment();
  data.forEach(item=> frag.appendChild(createCard(item)));
  lista.appendChild(frag);

  // Monta set de categorias: preset + encontradas
  const found = new Set(data.map(d=>d.category));
  PRESET_CATS.forEach(c=>found.add(c));
  renderChips(found);

  setEstado('', false);
  aplicarFiltros();
  syncFavButtons();
  renderFavoritos();
})();

// Lazy básico
const imgs=$$('img[loading="lazy"]');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) io.unobserve(e.target); }));
  imgs.forEach(i=>io.observe(i));
}
