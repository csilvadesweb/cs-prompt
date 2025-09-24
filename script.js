const $ = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
$('#ano').textContent = new Date().getFullYear();

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
  });
})();

// Toast
function toast(msg){
  let el=$('#toast');
  if(!el){
    el=document.createElement('div');
    el.id='toast';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',background:'rgba(0,0,0,.85)',color:'#fff',padding:'8px 12px',borderRadius:'10px',zIndex:'9999'});
    document.body.appendChild(el);
  }
  el.textContent=msg; el.style.opacity='1';
  setTimeout(()=>el.style.opacity='0',1600);
}

// Favoritos
const STORAGE_FAV='cs_prompt_favs';
function getFavs(){try{return JSON.parse(localStorage.getItem(STORAGE_FAV)||'[]')}catch{return[]}}
function setFavs(ids){localStorage.setItem(STORAGE_FAV,JSON.stringify(ids))}

// Chips + Filtros
function renderChips(cats){
  const wrap=$('#chips'); wrap.innerHTML='';
  const make=(c,a=false)=>{
    const b=document.createElement('button');
    b.className='chip'+(a?' is-active':''); b.dataset.cat=c;
    b.textContent=c.charAt(0).toUpperCase()+c.slice(1);
    b.addEventListener('click',()=>{
      $$('.chip').forEach(x=>x.classList.remove('is-active'));
      b.classList.add('is-active'); aplicarFiltros();
    });
    wrap.appendChild(b);
  }
  make('todas',true);
  cats.forEach(c=>make(c));
}

function aplicarFiltros(){
  const termo=($('#q').value||'').toLowerCase();
  const cat=$('.chip.is-active').dataset.cat;
  let visiveis=0;
  $$('.card').forEach(card=>{
    const okCat=cat==='todas'||card.dataset.cat===cat;
    const okTxt=card.innerText.toLowerCase().includes(termo);
    card.style.display=(okCat&&okTxt)?'':'none';
    if(okCat&&okTxt) visiveis++;
  });
  $('#resultado-contagem').textContent=visiveis?`${visiveis} prompt(s) encontrados`:'Nenhum prompt encontrado.';
}

$('#busca').addEventListener('submit',e=>{e.preventDefault();aplicarFiltros();});

// Render prompts
const lista=$('#lista-prompts');
function createCard(p){
  const el=document.createElement('article');
  el.className='card'; el.dataset.cat=p.category;
  el.innerHTML=`<h3>${p.title}</h3><p>${p.summary||''}</p><details><summary>Ver prompt</summary><pre><code>${p.content}</code></pre></details>
  <button class="btn" onclick="navigator.clipboard.writeText('${p.content.replace(/'/g,"\\'")}').then(()=>toast('Copiado!'))">📋 Copiar</button>`;
  return el;
}

(async()=>{
  $('#estado').hidden=false;
  let data=[];
  try{
    const r=await fetch('./prompts_5000.json',{cache:'no-store'});
    if(r.ok){data=await r.json(); data=Array.isArray(data)?data:data.prompts;}
  }catch{}
  if(!data||!data.length) data=[
    {title:'Resumo inteligente de reuniões',category:'produtividade',content:'Atue como secretária...'},
    {title:'Contestação de cobrança prescrita',category:'advocacia',content:'Atue como advogado...'},
    {title:'Plano de estudos personalizado',category:'estudos',content:'Você é mentor...'}
  ];
  const cats=new Set();
  data.forEach(p=>{lista.appendChild(createCard(p)); cats.add(p.category)});
  renderChips([...cats]);
  $('#estado').hidden=true;
})();
