/* ============================================================
   MOTEUR DES QCM  —  fichier partagé par TOUTES les pages.
   Modifier ici se répercute sur tout le site.
   ------------------------------------------------------------
   TEXTES AFFICHÉS : à personnaliser dans l'objet MSG ci-dessous
   (ex. mettre incorrect: 'Incorrect' tout court).
   ============================================================ */
var MSG = {
  correct:   '✓ Correct',
  incorrect: '✗ Incorrect',
  skip:      'Non répondue',
  noAnswer:  '',
  score:     function(s, t){ return 'Score : ' + s + ' / ' + t; },
  solShow:   'Voir la solution',
  solHide:   'Masquer la solution',
  info:      'À traiter sur le polycopié.'
};

/* Les questions sont écrites À LA MAIN en HTML dans la page (voir le mode
   d'emploi). Ce moteur les lit depuis le DOM, puis les rend interactives.
   DATA/SOL sont reconstruits à partir du HTML par readAuthored(). */
var DATA=[], SOL=[], START=1, CHAP=null;
var quiz  = document.getElementById('quiz');
function qLabel(n){ return CHAP ? (CHAP + '.' + n) : String(n); }
let reg = [];

// lit une ligne « a = (signe) chiffres » -> structure
function parseValueRow(r){
  var row={lab:(r.getAttribute('data-lab')||'').trim(), sign:null, digits:[], digOk:null};
  [].forEach.call(r.children, function(el){
    if(!el.classList) return;
    if(el.classList.contains('sign')) row.sign={ok:el.hasAttribute('data-ok')?1:0};
    else if(el.classList.contains('dig')){
      var v=(el.textContent||'').trim(); row.digits.push(v);
      if(el.hasAttribute('data-ok')) row.digOk=v;
    }
  });
  return row;
}

// lit les questions écrites à la main dans #quiz
function readAuthored(){
  if(!quiz) return;
  CHAP  = quiz.dataset.chap ? parseInt(quiz.dataset.chap,10) : null;
  START = quiz.dataset.start ? parseInt(quiz.dataset.start,10) : 1;
  DATA=[]; SOL=[];
  [].forEach.call(quiz.children, function(qel){
    if(!qel.classList || !qel.classList.contains('q')) return;
    var type = qel.dataset.type || 'qcm';
    var solEl = qel.querySelector('.sol');
    SOL.push(solEl ? solEl.innerHTML.trim() : null);
    if(type==='qcm'){
      var c=[];
      [].forEach.call(qel.children, function(o){
        if(o.classList && o.classList.contains('opt')) c.push([o.innerHTML.trim(), o.hasAttribute('data-ok')?1:0, 'h']);
      });
      DATA.push({t:'mcq', c:c});
    } else if(type==='grille'){
      function cellsFrom(rowEl){
        var cells=[];
        [].forEach.call(rowEl.children, function(el){
          if(!el.classList) return;
          if(el.classList.contains('lab')) cells.push({lit:el.innerHTML.trim()});
          else if(el.classList.contains('case')) cells.push({check:{label:el.innerHTML.trim(), ok:el.hasAttribute('data-ok')?1:0}});
        });
        return cells;
      }
      var nodes=[];
      [].forEach.call(qel.children, function(ch){
        if(!ch.classList) return;
        if(ch.classList.contains('cadre')){
          var rows=[]; [].forEach.call(ch.children, function(r){ if(r.classList && r.classList.contains('row')) rows.push(cellsFrom(r)); });
          nodes.push({cadre:rows});
        } else if(ch.classList.contains('row')){ nodes.push({line:cellsFrom(ch)}); }
        else if(ch.classList.contains('lab')){ nodes.push({lit:ch.innerHTML.trim()}); }
        else if(ch.classList.contains('case')){ nodes.push({check:{label:ch.innerHTML.trim(), ok:ch.hasAttribute('data-ok')?1:0}}); }
      });
      DATA.push({t:'grid', nodes:nodes});
    } else if(type==='cercle'){
      var pts=[];
      [].forEach.call(qel.children, function(p){
        if(p.classList && p.classList.contains('pt'))
          pts.push({x:parseFloat(p.dataset.x), y:parseFloat(p.dataset.y), l:p.textContent.trim(), ok:p.hasAttribute('data-ok')?1:0});
      });
      DATA.push({t:'circle', pts:pts});
    } else if(type==='axe'){
      // droite graduée : cellules <span class="int"> (intervalle) et
      // <span class="pt"> (point gradué). data-ok = à cocher. Un bloc
      // facultatif <div class="trouve"> ajoute la grille « a= / b= » à droite.
      var acells=[], find=[];
      [].forEach.call(qel.children, function(el){
        if(!el.classList) return;
        if(el.classList.contains('int'))
          acells.push({kind:'int', ok:el.hasAttribute('data-ok')?1:0});
        else if(el.classList.contains('pt'))
          acells.push({kind:'pt', ok:el.hasAttribute('data-ok')?1:0,
                       lab:(el.getAttribute('data-lab')||el.innerHTML||'').trim()});
        else if(el.classList.contains('trouve'))
          [].forEach.call(el.children, function(r){
            if(r.classList && r.classList.contains('row')) find.push(parseValueRow(r));
          });
      });
      DATA.push({t:'axis', cells:acells, find:find,
                 left:(qel.getAttribute('data-left')||'$-\\infty$'),
                 right:(qel.getAttribute('data-right')||'$+\\infty$')});
    } else if(type==='valeur'){
      // « trouve la valeur » : lignes a = (signe) | chiffres (on en coche un).
      var vrows=[];
      [].forEach.call(qel.children, function(r){
        if(r.classList && r.classList.contains('row')) vrows.push(parseValueRow(r));
      });
      DATA.push({t:'values', rows:vrows});
    } else { DATA.push({t:'info'}); }
  });
}

/* --- Sauvegarde des réponses dans le navigateur de l'élève (localStorage).
   Persiste sur le MÊME appareil + navigateur ; effacé si l'élève nettoie
   ses données de navigation. Clé propre à chaque page de section. --- */
var SKEY = 'qcm:' + (location.pathname || 'quiz');
var verified = false;   // vrai une fois « Vérifier » cliqué -> on garde la correction
function saveState(){
  try{
    var a = reg.map(function(e){
      var box = e.box;
      if(e.t==='mcq'){ var c=[]; box.querySelectorAll('.ans input').forEach(function(inp,idx){ if(inp.checked) c.push(idx); }); return {t:'m',c:c}; }
      if(e.t==='grid'){ var s=[]; box.querySelectorAll('[data-slot]').forEach(function(sl){ var k=sl.dataset.slot; if(k==='sign'||k==='sqrt'||k==='check'){ s.push(sl.querySelector('input').checked?1:0); } else { var v=''; sl.querySelectorAll('input').forEach(function(x){ if(x.checked) v=x.value; }); s.push(v); } }); return {t:'g',s:s}; }
      if(e.t==='circle'){ var idx=-1,i=0; box.querySelectorAll('.cpt').forEach(function(g){ if(g.classList.contains('sel')) idx=i; i++; }); return {t:'c',i:idx}; }
      return null;
    });
    localStorage.setItem(SKEY, JSON.stringify({v:1,verified:verified,a:a}));
  }catch(err){}
}
function applyState(){
  var st=null; try{ st=JSON.parse(localStorage.getItem(SKEY)||'null'); }catch(err){}
  if(!st || !st.a || st.a.length!==reg.length) return null;
  reg.forEach(function(e,i){
    var d=st.a[i]; if(!d) return; var box=e.box;
    if(e.t==='mcq' && d.t==='m'){ var ins=box.querySelectorAll('.ans input'); d.c.forEach(function(idx){ if(ins[idx]) ins[idx].checked=true; }); }
    else if(e.t==='grid' && d.t==='g'){ box.querySelectorAll('[data-slot]').forEach(function(sl,si){ var val=d.s[si], k=sl.dataset.slot;
      if(k==='sign'||k==='sqrt'||k==='check'){ sl.querySelector('input').checked=!!val; }
      else if(val!=='' && val!=null){ sl.querySelectorAll('input').forEach(function(x){ if(x.value===String(val)){ x.checked=true; var cell=x.closest('.cell'); if(cell) cell.classList.add('sel'); } }); } }); }
    else if(e.t==='circle' && d.t==='c' && d.i>=0){ var g=box.querySelectorAll('.cpt')[d.i]; if(g) g.classList.add('sel'); }
  });
  return st;
}

// une question est « répondue » si au moins une saisie est active
function isAnswered(box){
  var a=false; box.querySelectorAll('input').forEach(function(i){ if(i.checked) a=true; });
  if(!a && box.querySelector('.cpt.sel')) a=true;
  return a;
}
// n'affiche l'icône « solution » qu'après « Vérifier », et seulement
// pour les questions qui ont été répondues (donc corrigées)
function updateSol(){
  reg.forEach(function(e){
    var tg=e.box.querySelector('.sol-toggle'); if(!tg) return;
    var graded = e.box.classList.contains('done') && !e.box.classList.contains('unanswered');
    if(graded){ tg.hidden=false; }
    else { tg.hidden=true; tg.setAttribute('aria-expanded','false'); tg.innerHTML=MSG.solShow;
           var sb=e.box.querySelector('.sol-box'); if(sb) sb.hidden=true; }
  });
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function M(t){return '\\('+t+'\\)';}

function renderMcq(q,n){
  let h='<div class="answers">';
  q.c.forEach(function(o,ci){
    const L = String.fromCharCode(65+ci);   // A, B, C, D, ...
    const body = o[2] ? o[0] : M(o[0]);
    h+='<label class="ans"><input type="checkbox" data-correct="'+(o[1]?1:0)+'"><span class="opt-box">'+L+'</span><span class="opt-body">'+body+'</span></label>';
  });
  return h+'</div>';
}
function gCell(c){   // une cellule de grille -> HTML (étiquette ou case à cocher)
  if(c.lit!==undefined) return '<span class="lit">'+c.lit+'</span>';
  return '<label class="signbox gridcheck" data-slot="check" data-ok="'+(c.check.ok?1:0)+'"><input type="checkbox"><span class="clab2">'+c.check.label+'</span></label>';
}
function renderGrid(q,n){
  let h='<div class="grid">';
  q.nodes.forEach(nd=>{
    if(nd.cadre){   // cadre pointillé gris : pavé de cases aligné en colonnes
      let cols=1; nd.cadre.forEach(r=>{ if(r.length>cols) cols=r.length; });
      h+='<div class="gcadre" style="grid-template-columns:repeat('+cols+',auto)">';
      nd.cadre.forEach(row=>{ row.forEach(c=>{ h+=gCell(c); }); for(let p=row.length;p<cols;p++) h+='<span class="gpad"></span>'; });
      h+='</div>';
    } else if(nd.line){   // une ligne pleine largeur
      h+='<div class="gline">'; nd.line.forEach(c=>{ h+=gCell(c); }); h+='</div>';
    } else { h+=gCell(nd); }   // étiquette / case inline
  });
  return h+'</div>';
}
function lbl(t){ // LaTeX court -> unicode lisible (pour le cercle, rendu en SVG)
  return t.replace(/^\$|\$$/g,'')
          .replace(/\\tfrac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2')
          .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'$1/$2')
          .replace(/\\pi/g,'π').replace(/\\,/g,'').replace(/[{}]/g,'')
          .replace(/-/g,'−').trim();
}
var _vgrp=0;
// lignes « a = [signe] | [chiffres] ». Signe = case (slot check, façon
// chiffre), chiffres = un seul à choisir (slot digit). Noté comme une grille.
function valueRowsHtml(rows,n){
  var h='';
  rows.forEach(function(row){
    var gid='vg'+n+'_'+(_vgrp++);
    h+='<div class="vrow">';
    if(row.lab) h+='<span class="vlab">'+row.lab+'</span>';
    if(row.sign){
      h+='<label class="cell signcell" data-slot="check" data-ok="'+(row.sign.ok?1:0)+'">'
        +'<input type="checkbox"><span>−</span></label>'
        +'<span class="vbar"></span>';
    }
    h+='<span class="digits" data-slot="digit" data-ok="'+(row.digOk==null?'':row.digOk)+'">';
    row.digits.forEach(function(v){
      h+='<label class="cell"><input type="radio" name="'+gid+'" value="'+v+'"><span>'+v+'</span></label>';
    });
    h+='</span></div>';
  });
  return h;
}
function renderValues(q,n){ return '<div class="valqs">'+valueRowsHtml(q.rows,n)+'</div>'; }
function renderAxis(q,n){
  // droite graduée : flèche horizontale + cellules cochables.
  // Chaque cellule porte data-slot="check" -> notée comme une case de grille.
  let h='<div class="axisq"><span class="aend aend-l"><span class="atop">'+q.left+'</span></span>';
  q.cells.forEach(function(c){
    if(c.kind==='int'){
      h+='<label class="aitem aint" data-slot="check" data-ok="'+(c.ok?1:0)+'">'
        +'<span class="atop"></span><input type="checkbox"><span class="abox abox-int"></span></label>';
    } else {
      h+='<label class="aitem apt" data-slot="check" data-ok="'+(c.ok?1:0)+'">'
        +'<span class="atop">'+c.lab+'</span><input type="checkbox">'
        +'<span class="abox abox-pt"><i class="atick"></i></span></label>';
    }
  });
  h+='<span class="aend aend-r"><span class="atop">'+q.right+'</span></span></div>';
  // bloc « trouve la valeur » facultatif, à droite de l'axe
  if(q.find && q.find.length){
    return '<div class="axiswrap">'+h
      +'<div class="avec"><span class="avec-lbl">avec</span>'
      +'<div class="valqs">'+valueRowsHtml(q.find,n)+'</div></div></div>';
  }
  return h;
}
function renderCircle(q,n){
  const R=112, C=150, off=22;
  let inner='<circle class="ring" cx="150" cy="150" r="112"/>'
    +'<line class="axis" x1="'+(C-R-16)+'" y1="150" x2="'+(C+R+16)+'" y2="150"/>'
    +'<line class="axis" x1="150" y1="'+(C-R-16)+'" x2="150" y2="'+(C+R+16)+'"/>';
  q.pts.forEach((p,idx)=>{
    const px=(C+R*p.x).toFixed(1), py=(C-R*p.y).toFixed(1);
    const lx=(C+(R+off)*p.x).toFixed(1), ly=(C-(R+off)*p.y+4).toFixed(1);
    inner+='<g class="cpt" data-ok="'+(p.ok?1:0)+'">'
      +'<circle class="hit" cx="'+px+'" cy="'+py+'" r="17" fill="transparent"/>'
      +'<circle class="dot" cx="'+px+'" cy="'+py+'" r="8"/>'
      +'<text class="clab" x="'+lx+'" y="'+ly+'" text-anchor="middle">'+lbl(p.l)+'</text></g>';
  });
  return '<div class="circlewrap"><svg class="trigsvg" viewBox="0 0 300 300" role="group" aria-label="cercle trigonométrique">'+inner+'</svg></div>';
}

function build(){
  if(!quiz) return;
  quiz.innerHTML=''; reg=[];
  DATA.forEach((q,i)=>{
    const n=START+i;
    const box=document.createElement('div');
    box.className='question';
    let body='';
    if(q.t==='mcq') body=renderMcq(q,n);
    else if(q.t==='grid') body=renderGrid(q,n);
    else if(q.t==='axis') body=renderAxis(q,n);
    else if(q.t==='values') body=renderValues(q,n);
    else if(q.t==='circle') body=renderCircle(q,n);
    else if(q.t==='info') body='<div class="q-info">'+MSG.info+'</div>';
    if(q.t==='info') box.classList.add('q-figure');
    box.innerHTML='<div class="qnum">'+qLabel(n)+'</div>'+body+'<div class="verdict"></div>';
    if(SOL[i] && q.t!=='info'){
      var tg=document.createElement('button'); tg.type='button'; tg.className='sol-toggle'; tg.hidden=true;
      tg.setAttribute('aria-expanded','false'); tg.innerHTML=MSG.solShow;
      var sb=document.createElement('div'); sb.className='sol-box'; sb.hidden=true; sb.innerHTML=SOL[i];
      box.appendChild(tg); box.appendChild(sb);
    }
    quiz.appendChild(box);
    // axe et « valeur » sont notés comme une grille (slots data-slot)
    reg.push({t:((q.t==='axis'||q.t==='values')?'grid':q.t), box});
  });
  var rg=document.getElementById('qrange');   // plage de numéros (mise à jour auto)
  if(rg && DATA.length){ var a=qLabel(START), b=qLabel(START+DATA.length-1); rg.textContent = a===b ? a : (a+' à '+b); }
  const st = applyState();   // restaure les réponses enregistrées
  updateSol();               // affiche l'icône solution des questions déjà répondues
  if(st && st.verified){ verifier(); }   // ré-affiche la correction (vert/rouge + score)
  typeset();
}

// écouteurs attachés UNE seule fois (pas à chaque build)
function attachListeners(){
  if(!quiz) return;
  // reflet visuel des cellules + sauvegarde
  quiz.addEventListener('change', function(e){
    const inp=e.target;
    if(inp.type==='radio'){
      const grp=quiz.querySelectorAll('input[name="'+inp.name+'"]');
      grp.forEach(function(x){ const cell=x.closest('.cell'); if(cell) cell.classList.toggle('sel', x.checked); });
    }
    saveState(); updateSol();
  });
  // sélection d'un point sur le cercle trigo + sauvegarde
  quiz.addEventListener('click', function(e){
    const g=e.target.closest('.cpt'); if(!g) return;
    const box=g.closest('.question'); if(box.classList.contains('locked')) return;
    g.parentNode.querySelectorAll('.cpt').forEach(function(x){ x.classList.remove('sel'); });
    g.classList.add('sel');
    saveState(); updateSol();
  });
  // ouverture / fermeture de l'encadré solution
  quiz.addEventListener('click', function(e){
    const t=e.target.closest('.sol-toggle'); if(!t) return;
    const sb=t.closest('.question').querySelector('.sol-box'); if(!sb) return;
    const willOpen=sb.hidden; sb.hidden=!willOpen;
    t.setAttribute('aria-expanded', willOpen?'true':'false');
    t.innerHTML = willOpen ? MSG.solHide : MSG.solShow;
  });
}

// dispose les réponses en colonnes adaptées à leur largeur (évite le 3+1)
function layoutAnswers(){
  const GAP=29, MAXCOLS=3;
  reg.forEach(e=>{
    if(e.t!=='mcq') return;
    const ans=e.box.querySelector('.answers'); if(!ans) return;
    const labels=[].slice.call(ans.children); const n=labels.length;
    const cw=ans.clientWidth||700;
    // mesurer la largeur naturelle de chaque proposition
    const prevD=ans.style.display; ans.style.display='block';
    labels.forEach(l=>l.style.display='inline-block');
    let maxW=0; labels.forEach(l=>{ if(l.offsetWidth>maxW) maxW=l.offsetWidth; });
    labels.forEach(l=>l.style.display=''); ans.style.display=prevD;
    let fit=Math.max(1, Math.floor((cw+GAP)/(maxW+GAP)));
    fit=Math.min(fit, n, MAXCOLS);
    while(fit>1 && n%fit===1) fit--;              // pas de dernière proposition esseulée
    ans.style.gridTemplateColumns='repeat('+fit+',minmax(0,1fr))';
  });
}
let _rz; window.addEventListener('resize',()=>{ clearTimeout(_rz); _rz=setTimeout(layoutAnswers,150); });

function verifier(){
  let score=0, total=0;
  reg.forEach(e=>{
    if(e.t==='info') return;   // question à figure : non notée
    const box=e.box; const verdict=box.querySelector('.verdict');
    box.querySelectorAll('.ans,.cell,.signbox,.cpt').forEach(el=>el.classList.remove('ok','bad','miss'));
    // une question est traitée si au moins une saisie est active
    let attempted=false;
    box.querySelectorAll('input').forEach(i=>{ if(i.checked) attempted=true; });
    if(!attempted && box.querySelector('.cpt.sel')) attempted=true;
    if(!attempted){
      // ne rien révéler ; laisser modifiable pour compléter plus tard
      box.classList.add('done','unanswered');
      verdict.className='verdict skip'; verdict.textContent=MSG.skip;
      return;
    }
    box.classList.add('done'); box.classList.remove('unanswered');
    let correct=true;
    if(e.t==='mcq'){
      box.querySelectorAll('.ans').forEach(l=>{
        const inp=l.querySelector('input'); const isC=inp.dataset.correct==='1';
        if(inp.checked&&isC)l.classList.add('ok');
        if(inp.checked&&!isC){l.classList.add('bad');correct=false;}
        if(!inp.checked&&isC){l.classList.add('miss');correct=false;}
        inp.disabled=true;
      });
    } else if(e.t==='grid'){
      box.querySelectorAll('[data-slot]').forEach(sl=>{
        const kind=sl.dataset.slot;
        if(kind==='sign'||kind==='sqrt'||kind==='check'){
          const inp=sl.querySelector('input'); const ok=sl.dataset.ok==='1';
          const good=(inp.checked===ok); if(!good)correct=false;
          if(inp.checked&&good)sl.classList.add('ok');
          if(inp.checked&&!good)sl.classList.add('bad');
          if(!inp.checked&&ok)sl.classList.add('miss');
          inp.disabled=true;
        } else if(kind==='digit'){
          const ok=sl.dataset.ok; let sel=null;
          sl.querySelectorAll('input').forEach(x=>{ if(x.checked){sel=x.value;} x.disabled=true; });
          if(sel!==ok)correct=false;
          sl.querySelectorAll('.cell').forEach(cell=>{
            const x=cell.querySelector('input');
            if(x.value===ok)cell.classList.add('miss');
            if(x.checked&&x.value===ok){cell.classList.remove('miss');cell.classList.add('ok');}
            if(x.checked&&x.value!==ok)cell.classList.add('bad');
          });
        }
      });
    } else if(e.t==='circle'){
      box.classList.add('locked');
      const sel=box.querySelector('.cpt.sel');
      box.querySelectorAll('.cpt').forEach(g=>{ if(g.dataset.ok==='1') g.classList.add('miss'); });
      if(sel){ const ok=sel.dataset.ok==='1'; sel.classList.remove('miss'); sel.classList.add(ok?'ok':'bad'); if(!ok)correct=false; }
      else correct=false;
    }
    total++;
    if(correct){ score++; verdict.className='verdict ok'; verdict.textContent=MSG.correct; }
    else { verdict.className='verdict no'; verdict.textContent=MSG.incorrect; }
  });
  const el=document.getElementById('resultat');
  el.textContent = total===0 ? MSG.noAnswer : MSG.score(score,total);
  verified = true; saveState();   // mémorise l'état corrigé
  updateSol();
  layoutAnswers();
}
function recommencer(){
  try{ localStorage.removeItem(SKEY); }catch(err){}   // efface les réponses enregistrées
  verified = false;
  document.getElementById('resultat').textContent='';
  build();
  window.scrollTo({top:0,behavior:'smooth'});
}
function typeset(){
  if(window.MathJax&&MathJax.typesetPromise){ MathJax.typesetClear&&MathJax.typesetClear(); MathJax.typesetPromise([quiz]).then(layoutAnswers); }
  else layoutAnswers();
}
readAuthored();   // lit les questions écrites à la main dans le HTML
attachListeners();
build();
