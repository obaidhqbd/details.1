(() => {
  const root = document.documentElement;
  const body = document.body;
  const base = window.__PORTFOLIO__?.base || '';
  const data = window.__PORTFOLIO__ || {index:[],projects:[],blogs:[],profile:{}};
  const qs=(s,e=document)=>e.querySelector(s), qsa=(s,e=document)=>[...e.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const prefersReduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fine=matchMedia('(pointer:fine)').matches;
  let sessionEvents=7;

  // 1) Cinematic boot, kept intentionally short so the interface remains usable.
  const boot=qs('#boot-screen');
  const bootLine=qs('[data-boot-line]');
  if(boot && !prefersReduce){
    const lines=['initializing signal…','mapping public identity…','warming ambient field…','index online.']; let i=0;
    const timer=setInterval(()=>{ if(bootLine) bootLine.textContent=lines[i++]||lines.at(-1); if(i>lines.length){clearInterval(timer);setTimeout(()=>boot.classList.add('is-done'),260);} },180);
  } else boot?.classList.add('is-done');

  // 2) Live clock + shifting system state. Small changes keep the hero feeling alive.
  const liveTime=qs('[data-live-time]');
  const systemState=qs('[data-system-state]');
  const signal=qs('[data-signal]');
  const states=[['READY','CALM SIGNAL'],['SCANNING','SEARCHING FIELD'],['BUILDING','LIVE CONTENT'],['OBSERVING','LOW NOISE'],['IDEATING','HIGH SIGNAL']];
  let stateIndex=0;
  const tick=()=>{const d=new Date(); if(liveTime) liveTime.textContent=d.toLocaleTimeString([], {hour12:false});};
  tick(); setInterval(tick,1000);
  if(!prefersReduce) setInterval(()=>{stateIndex=(stateIndex+1)%states.length;if(systemState)systemState.textContent=states[stateIndex][0];if(signal)signal.textContent=states[stateIndex][1];},9000);

  // 3) Ambient particle field. No library. Automatically scales down on small screens.
  const canvas=qs('#ambient-canvas');
  if(canvas && !prefersReduce){
    const ctx=canvas.getContext('2d',{alpha:true});
    const points=[]; let w=0,h=0,dpr=1,mx=innerWidth/2,my=innerHeight/2;
    const setSize=()=>{dpr=Math.min(devicePixelRatio||1,1.6);w=innerWidth;h=innerHeight;canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
    const count=Math.min(70,Math.max(26,Math.floor(innerWidth/18)));
    for(let i=0;i<count;i++) points.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,r:Math.random()*1.2+.35});
    setSize(); addEventListener('resize',setSize,{passive:true}); addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
    const draw=()=>{ctx.clearRect(0,0,w,h);for(const p of points){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;const dx=p.x-mx,dy=p.y-my,dist=Math.hypot(dx,dy);if(dist<130){p.x+=dx*.0009;p.y+=dy*.0009;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=dist<150?'rgba(121,245,255,.38)':'rgba(140,160,180,.16)';ctx.fill();}requestAnimationFrame(draw);};
    draw();
  }

  // 4) Pointer halo + cursor beam. CSS variables do the visual work.
  if(fine && !prefersReduce){
    let raf=0,mx=innerWidth*.5,my=innerHeight*.4; const beam=qs('.cursor-beam');
    addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(beam)beam.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;if(!raf)raf=requestAnimationFrame(()=>{root.style.setProperty('--mx',`${mx}px`);root.style.setProperty('--my',`${my}px`);raf=0;});},{passive:true});
  }

  // 5) Reveal only when needed.
  const reveal=qsa('.reveal'); if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});reveal.forEach(x=>io.observe(x));}else reveal.forEach(x=>x.classList.add('in'));

  // 6) Subtle 3D tilt and magnetic controls.
  if(fine && !prefersReduce){
    qsa('[data-tilt]').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg)`;},{passive:true});el.addEventListener('pointerleave',()=>el.style.transform='');});
    qsa('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`translate(${(x*5).toFixed(1)}px,${(y*4).toFixed(1)}px)`;},{passive:true});el.addEventListener('pointerleave',()=>el.style.transform='');});
  }

  // 7) Scroll velocity leaves a temporary signal imprint.
  let lastY=scrollY,lastT=performance.now(); addEventListener('scroll',()=>{const now=performance.now(),dy=Math.abs(scrollY-lastY),dt=Math.max(16,now-lastT);lastY=scrollY;lastT=now;const meter=qs('#scroll-meter span');if(meter){const max=document.documentElement.scrollHeight-innerHeight;meter.style.height=`${max?scrollY/max*100:0}%`;}if(!prefersReduce && dy/dt>.8){root.style.setProperty('--scroll-energy',Math.min(1,dy/dt/4));}} ,{passive:true});

  // 8) Thought lab.
  const thoughts=['“A good interface hides complexity without hiding intent.”','“The fastest feature is often the one you never ship.”','“Automate repetition before you automate ambition.”','“A portfolio should prove decisions, not decorate a résumé.”','“Performance is part of design because waiting is an interaction.”','“A missing file should become a fallback, not a disaster.”','“Good automation feels boring. The result should not.”'];
  const thought=qs('[data-thought]'); qs('[data-new-thought]')?.addEventListener('click',()=>{if(!thought)return;let n=Math.floor(Math.random()*thoughts.length);if(thought.textContent===thoughts[n])n=(n+1)%thoughts.length;thought.textContent=thoughts[n];toast('Thought field shifted locally');microEvent();});

  // 9) Visitor lens.
  qsa('[data-lens]').forEach(btn=>btn.addEventListener('click',()=>{qsa('[data-lens]').forEach(x=>x.classList.toggle('is-active',x===btn));const lens=btn.dataset.lens;body.dataset.lens=lens;const target=lens==='learn'?'#writing':'#work';document.querySelector(target)?.scrollIntoView({behavior:prefersReduce?'auto':'smooth',block:'start'});toast(`${btn.querySelector('span')?.textContent||'Lens'} view activated`);microEvent();}));

  // 10) Project filters.
  const projectCards=qsa('[data-content-card="project"]'); qsa('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{qsa('[data-mode]').forEach(x=>{x.classList.toggle('is-active',x===btn);x.setAttribute('aria-selected',x===btn?'true':'false');});const mode=btn.dataset.mode;projectCards.forEach(card=>{let show=true;if(mode==='featured')show=card.dataset.featured==='true';if(mode==='recent')show=card.dataset.recent==='true';card.hidden=!show;});microEvent();}));

  // 11) Signal orb: an unexpected but harmless micro-event generator.
  const messages=['There is no “correct” way to enter.','You are looking at the interface. The interface is looking back.','A folder became a page. A page became a memory.','Some details are deliberately not announced.','The boring part is automated. The fun part is visible.','This is a static site behaving like a small system.'];
  const signalMessage=qs('[data-signal-message]'),signalCount=qs('[data-signal-count]');
  function microEvent(){sessionEvents++;if(signalCount)signalCount.textContent=String(sessionEvents).padStart(4,'0');}
  qs('[data-signal-orb]')?.addEventListener('click',()=>{const msg=messages[Math.floor(Math.random()*messages.length)];if(signalMessage){signalMessage.classList.remove('flash-signal');void signalMessage.offsetWidth;signalMessage.textContent=msg;signalMessage.classList.add('flash-signal');}microEvent();toast('Signal changed');anomaly('the interface changed its mind.');});

  // 12) Reality shift: temporary visual mode with no destructive changes.
  qs('[data-reality]')?.addEventListener('click',()=>{body.classList.toggle('anomaly-on');microEvent();const on=body.classList.contains('anomaly-on');toast(on?'Reality layer shifted':'Reality layer restored');anomaly(on?'alternate visual field online.':'normal field restored.');});
  const eggAction=qs('[data-egg-action]'),eggStatus=qs('[data-egg-status]');
  eggAction?.addEventListener('click',()=>{body.classList.add('anomaly-on');if(eggStatus)eggStatus.textContent='ANOMALOUS';microEvent();anomaly('you found the side door. it only contains another door.');setTimeout(()=>{body.classList.remove('anomaly-on');if(eggStatus)eggStatus.textContent='LISTENING';},1800);});

  // 13) Secret keyboard sequence: OBX. Harmless easter egg.
  let keySeq=''; addEventListener('keydown',e=>{if(e.key.length===1){keySeq=(keySeq+e.key.toLowerCase()).slice(-3);if(keySeq==='obx'){microEvent();anomaly('OBX protocol accepted. nothing important happened. intentionally.');keySeq='';}}});
  let secretClicks=0; qs('[data-secret-trigger]')?.addEventListener('click',()=>{secretClicks++;if(secretClicks>=5){secretClicks=0;microEvent();anomaly('five taps. surprisingly, the logo still says O.');}});

  // 14) Local-first AI. It only claims what the generated profile/index supports.
  const layer=qs('#command-layer'),input=qs('#command-input'),results=qs('#command-results'),answer=qs('#assistant-answer'); let active=0,filtered=[];
  const openCommand=(ai=false)=>{if(!layer)return;layer.classList.add('is-open');layer.setAttribute('aria-hidden','false');body.classList.add('command-open');if(answer){answer.hidden=!ai;answer.innerHTML=ai?`<strong>OB/AI · local intelligence</strong><br>Ask about the public profile, indexed projects, writing, technologies, or the thinking model.<div class="ai-meta"><b>GROUNDED</b><span>profile + generated content index</span></div>`:'';}if(input){input.value='';input.focus();}render('');microEvent();};
  const closeCommand=()=>{layer?.classList.remove('is-open');layer?.setAttribute('aria-hidden','true');body.classList.remove('command-open');};
  const score=(item,q)=>{const hay=`${item.title} ${item.description} ${item.type} ${(item.tags||[]).join(' ')} ${(item.technologies||[]).join(' ')}`.toLowerCase();let s=0;q.toLowerCase().split(/\s+/).filter(Boolean).forEach(w=>{if(hay.includes(w))s+=2;if(item.title.toLowerCase().includes(w))s+=5;});return s;};
  const render=q=>{const query=q.trim();filtered=query?data.index.map(x=>({...x,_score:score(x,query)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score||new Date(b.date)-new Date(a.date)):data.index.slice(0,8);active=0;if(!results)return;results.innerHTML=filtered.length?filtered.slice(0,12).map((x,i)=>`<a class="command-item${i===0?' is-active':''}" href="${esc(base+x.url)}"><strong>${esc(x.title)}</strong><small>${esc((x.type||'').toUpperCase())} · ${esc((x.technologies||[]).slice(0,4).join(' · '))}</small></a>`).join(''):'<div class="empty-state">No grounded result. Ask a broader question.</div>';};
  const profile=data.profile||{};
  function answerQuestion(q){if(!answer||!q.trim()){if(answer)answer.hidden=true;return;}const t=q.toLowerCase();const projects=data.projects||[],blogs=data.blogs||[],tech=[...new Set((data.index||[]).flatMap(x=>x.technologies||[]))];let out='',tone='GROUNDED';
    if(t.includes('who')||t.includes('name')) out=`${profile.name||'Mohammed Obaidul Hoque'} is presented here as a ${profile.role||'Full Stack Web Developer'} and ${profile.secondaryRole||'Web Development Mentor'}. ${profile.description||''}`;
    else if(t.includes('contact')||t.includes('email')||t.includes('phone')) out=contactAnswer();
    else if(t.includes('build')||t.includes('project')){out=projects.length?`The public project index currently contains ${projects.length} build${projects.length===1?'':'s'}. ${projects.slice(0,5).map(p=>p.title).join(', ')}${projects.length>5?' …':''}.`:'No projects are indexed yet.';}
    else if(t.includes('blog')||t.includes('write')||t.includes('article')){out=blogs.length?`The writing field currently contains ${blogs.length} published item${blogs.length===1?'':'s'}. Latest signals include ${blogs.slice(0,4).map(p=>p.title).join(', ')}.`:'No writing is indexed yet.';}
    else if(t.includes('skill')||t.includes('tech')) out=`The public profile explicitly references ${tech.length?tech.slice(0,12).join(' · '):'HTML, CSS, JavaScript, Git/GitHub, responsive design, SEO, and static automation'}.`;
    else if(t.includes('think')||t.includes('approach')) out=`The published thinking model is simple: start with the real friction, keep complexity on a budget, and automate repetition. The rest is implementation detail.`;
    else if(t.includes('youtube')||t.includes('brand')) out=`Public branding references include TechObaidul, DevMasterObaidul, and ObaidHQ.`;
    else {const hits=data.index.filter(x=>score(x,t)>0).slice(0,3);out=hits.length?`I found a grounded path through ${hits.map(x=>x.title).join(', ')}. Open the result below for context.`:`I won't invent a fact about Obaidul. Ask about identity, projects, writing, technologies, thinking, or public branding.`;tone=hits.length?'GROUNDED':'BOUNDARY';}
    answer.hidden=false;answer.innerHTML=`<strong>OB/AI</strong> · ${esc(out)}<div class="ai-meta"><b>${tone}</b><span>source: public profile + indexed content</span></div>`;}
  function contactAnswer(){const c=data.contact||{};const parts=[];if(c.email)parts.push(`email ${c.email}`);if(c.phone)parts.push(`phone ${c.phone}`);if(c.github)parts.push('GitHub');if(c.socials?.length)parts.push(c.socials.join(', '));return parts.length?`Public contact routes currently include ${parts.join(' · ')}.`:'Contact details are not configured in the public build yet. The interface intentionally does not invent them.';}
  qsa('[data-open-command]').forEach(el=>el.addEventListener('click',()=>openCommand(el.hasAttribute('data-ai-entry'))));qsa('[data-close-command]').forEach(el=>el.addEventListener('click',closeCommand));
  input?.addEventListener('input',()=>{render(input.value);answerQuestion(input.value);});
  qsa('[data-question]').forEach(btn=>btn.addEventListener('click',()=>{const q=btn.dataset.question||'';if(input)input.value=q;render(q);answerQuestion(q);microEvent();}));
  qsa('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>{const map={work:'#work',writing:'#writing',mind:'#mind',contact:'#contact'};const t=map[btn.dataset.cmd];closeCommand();document.querySelector(t)?.scrollIntoView({behavior:prefersReduce?'auto':'smooth'});microEvent();}));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();layer?.classList.contains('is-open')?closeCommand():openCommand();}if(e.key==='Escape'&&layer?.classList.contains('is-open'))closeCommand();if(!layer?.classList.contains('is-open'))return;const items=qsa('.command-item',results);if(!items.length)return;if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(active+1,items.length-1);items.forEach((x,i)=>x.classList.toggle('is-active',i===active));items[active]?.scrollIntoView({block:'nearest'});}if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(active-1,0);items.forEach((x,i)=>x.classList.toggle('is-active',i===active));items[active]?.scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();items[active]?.click();}});

  function anomaly(text){const a=qs('#anomaly'),t=qs('[data-anomaly-text]');if(!a)return;if(t)t.textContent=text;a.classList.add('show');setTimeout(()=>a.classList.remove('show'),900);}
  function toast(message){const t=qs('#toast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),1800);}
})();
