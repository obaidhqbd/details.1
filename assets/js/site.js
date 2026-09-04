(() => {
  const root = document.documentElement;
  const body = document.body;
  const base = window.__PORTFOLIO__?.base || '';
  const data = window.__PORTFOLIO__ || { index: [], projects: [], blogs: [] };
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  // Cursor energy field: visual-only and disabled on touch/reduced-motion.
  if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    let raf = 0, mx = innerWidth * .5, my = innerHeight * .4;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(() => { root.style.setProperty('--mx', `${mx}px`); root.style.setProperty('--my', `${my}px`); raf = 0; }); }, {passive:true});
    const beam = qs('.cursor-beam');
    addEventListener('pointermove', e => { if (beam) beam.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`; }, {passive:true});
  }

  // Reveal sections only when they enter the viewport.
  const reveal = qsa('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } }), {rootMargin:'0px 0px -8% 0px'});
    reveal.forEach(el => io.observe(el));
  } else reveal.forEach(el => el.classList.add('in'));

  // Gentle 3D portrait/cards.
  if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    qsa('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5; el.style.transform = `rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`; }, {passive:true});
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  // Thought Lab: tiny local idea generator, no external service or token.
  const thoughts = [
    '“A good interface hides complexity without hiding intent.”',
    '“The fastest feature is often the one you never ship.”',
    '“Automate repetition before you automate ambition.”',
    '“A portfolio should prove decisions, not decorate a résumé.”',
    '“Performance is part of design because waiting is an interaction.”',
    '“A missing file should become a fallback, not a disaster.”'
  ];
  const thought = qs('[data-thought]');
  qs('[data-new-thought]')?.addEventListener('click', () => { if (!thought) return; let next = Math.floor(Math.random()*thoughts.length); if (thought.textContent === thoughts[next]) next = (next+1)%thoughts.length; thought.textContent = thoughts[next]; toast('New thought generated locally'); });

  // Perspective lens.
  qsa('[data-lens]').forEach(btn => btn.addEventListener('click', () => {
    qsa('[data-lens]').forEach(x => x.classList.toggle('is-active', x === btn));
    const lens = btn.dataset.lens;
    body.dataset.lens = lens;
    const target = lens === 'learn' ? '#writing' : lens === 'hire' ? '#work' : '#work';
    document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'});
    toast(`${btn.querySelector('span')?.textContent || 'Lens'} view activated`);
  }));

  // Project filtering.
  const projectCards = qsa('[data-content-card="project"]');
  qsa('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
    qsa('[data-mode]').forEach(x => { x.classList.toggle('is-active', x===btn); x.setAttribute('aria-selected', x===btn ? 'true':'false'); });
    const mode = btn.dataset.mode;
    projectCards.forEach(card => {
      let show = true;
      if (mode === 'featured') show = card.dataset.featured === 'true';
      if (mode === 'recent') show = card.dataset.recent === 'true';
      card.hidden = !show;
    });
  }));

  // Command center + local content intelligence.
  const layer = qs('#command-layer');
  const input = qs('#command-input');
  const results = qs('#command-results');
  const answer = qs('#assistant-answer');
  let active = 0;
  let filtered = [];
  const openCommand = (ai=false) => { if (!layer) return; layer.classList.add('is-open'); layer.setAttribute('aria-hidden','false'); body.classList.add('command-open'); if (answer) { answer.hidden = !ai; answer.innerHTML = ai ? `<strong>Local-first AI copilot</strong><br>Ask about Obaidul's projects, writing, technologies, or thinking. Answers are grounded in the generated site index.` : ''; } input?.focus(); if(input) input.value=''; render(''); };
  const closeCommand = () => { layer?.classList.remove('is-open'); layer?.setAttribute('aria-hidden','true'); body.classList.remove('command-open'); };
  const score = (item, q) => {
    if (!q) return 0;
    const hay = `${item.title} ${item.description} ${item.type} ${(item.tags||[]).join(' ')} ${(item.technologies||[]).join(' ')}`.toLowerCase();
    const words = q.toLowerCase().split(/\s+/).filter(Boolean); let s = 0;
    words.forEach(w => { if (hay.includes(w)) s += hay.startsWith(w) ? 6 : 2; if (item.title.toLowerCase().includes(w)) s += 6; });
    return s;
  };
  const render = q => {
    const query = q.trim();
    filtered = query ? data.index.map(x=>({...x,_score:score(x,query)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score || new Date(b.date)-new Date(a.date)) : data.index.slice(0,8);
    active = 0;
    if (!results) return;
    results.innerHTML = filtered.length ? filtered.slice(0,12).map((x,i)=>`<a class="command-item${i===0?' is-active':''}" href="${esc(base+x.url)}"><strong>${esc(x.title)}</strong><small>${esc((x.type||'').toUpperCase())} · ${esc((x.technologies||[]).slice(0,4).join(' · '))}</small></a>`).join('') : '<div class="empty-state">Nothing matched that query. Try a project name, technology, or “blog”.</div>';
  };

  function answerQuestion(q){
    if(!answer || !q.trim()) { if(answer) answer.hidden=true; return; }
    const text=q.toLowerCase();
    let out='';
    if(text.includes('how') && (text.includes('think')||text.includes('approach'))){ out="Obaidul's public thinking model centers on reducing the real problem, keeping systems simple, automating repetition, and designing for the next iteration."; }
    else if(text.includes('what') && (text.includes('build')||text.includes('project'))){ const names=data.projects.slice(0,4).map(x=>x.title).join(', '); out=`The indexed work currently includes ${data.projects.length} project${data.projects.length===1?'':'s'}${names?`: ${names}.`:'.'}`; }
    else if(text.includes('blog')||text.includes('write')||text.includes('article')){ const names=data.blogs.slice(0,3).map(x=>x.title).join(', '); out=`There are ${data.blogs.length} indexed writing item${data.blogs.length===1?'':'s'}${names?`, including ${names}.`:'.'}`; }
    else if(text.includes('skill')||text.includes('tech')||text.includes('technology')){ const tech=[...new Set(data.index.flatMap(x=>x.technologies||[]))].slice(0,12).join(' · '); out=`The current content index signals these technologies: ${tech||'web development tools will appear here as content is added.'}`; }
    else { const hits=data.index.filter(x=>score(x,text)>0).slice(0,3); out=hits.length?`I found ${hits.map(x=>x.title).join(', ')}. Open a result below for the full context.`:'I can answer from the public site index. Try asking about projects, writing, technologies, or how Obaidul thinks.'; }
    answer.hidden=false; answer.innerHTML=`<strong>OB/AI</strong> · ${esc(out)}`;
  }

  qsa('[data-open-command]').forEach(el=>el.addEventListener('click',()=>openCommand(Boolean(el.hasAttribute('data-ai-entry')))));
  qsa('[data-close-command]').forEach(el=>el.addEventListener('click',closeCommand));
  input?.addEventListener('input', () => { const q=input.value; render(q); answerQuestion(q); });
  qsa('[data-question]').forEach(btn=>btn.addEventListener('click',()=>{ const q=btn.dataset.question||''; if(input) input.value=q; if(answer) answer.hidden=false; answerQuestion(q); render(q); }));
  qsa('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>{ const map={work:'#work',writing:'#writing',mind:'#mind',contact:'#contact'}; const target=map[btn.dataset.cmd]; closeCommand(); document.querySelector(target)?.scrollIntoView({behavior:'smooth'}); }));
  document.addEventListener('keydown',e=>{
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();layer?.classList.contains('is-open')?closeCommand():openCommand();}
    if(e.key==='Escape'&&layer?.classList.contains('is-open')) closeCommand();
    if(!layer?.classList.contains('is-open')) return;
    const items=qsa('.command-item',results); if(!items.length) return;
    if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(active+1,items.length-1);items.forEach((x,i)=>x.classList.toggle('is-active',i===active));items[active].scrollIntoView({block:'nearest'});}
    if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(active-1,0);items.forEach((x,i)=>x.classList.toggle('is-active',i===active));items[active].scrollIntoView({block:'nearest'});}
    if(e.key==='Enter'){e.preventDefault();items[active]?.click();}
  });

  // Optional “AI bridge”: if site.config exposes a safe same-origin endpoint, use it; otherwise stay local.
  const intelligence = qs('[data-intelligence]');
  if (intelligence) intelligence.addEventListener('click', async () => { toast('Local intelligence is already active'); });

  function toast(message){ const t=qs('#toast'); if(!t) return; t.textContent=message; t.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove('show'),1800); }
})();
