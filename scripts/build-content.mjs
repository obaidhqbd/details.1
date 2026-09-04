import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const GENERATED = path.join(PUBLIC, 'generated');
const CONTENT = path.join(ROOT, 'content');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

const MEDIA = new Set(['.webp','.png','.jpg','.jpeg','.avif','.gif']);
const DEFAULT_DATE = '2000-01-01T00:00:00.000Z';

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const attr = esc;
const slugify = (s='') => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'untitled';
const titleize = s => String(s).replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,m=>m.toUpperCase()) || 'Untitled';
const write = (file, text) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, text); };
const rm = p => fs.rmSync(p, {recursive:true, force:true});
const read = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const exists = p => fs.existsSync(p);

function listFiles(dir){ return exists(dir) ? fs.readdirSync(dir, {withFileTypes:true}).filter(x=>!x.name.startsWith('.')) : []; }
function findFile(dir, names){ const lower = Object.fromEntries(names.map(n=>[n.toLowerCase(),n])); return listFiles(dir).find(e=>e.isFile() && lower[e.name.toLowerCase()])?.name || ''; }
function firstMedia(dir){ const found = listFiles(dir).find(e=>e.isFile() && MEDIA.has(path.extname(e.name).toLowerCase()) && !/^mentor\./i.test(e.name)); return found?.name || ''; }
function readJson(file){ try { return JSON.parse(read(file) || '{}'); } catch { return {}; } }
function stripHtml(html){ return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim(); }
function firstParagraph(html){ const m = html.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i); return m ? stripHtml(m[1]) : ''; }
function htmlTitle(html){ const a=html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i); const b=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return stripHtml(a?.[1] || b?.[1] || ''); }
function meta(html, name){ const m=html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i')); return m?.[1] || ''; }
function externalLinks(html){ return [...html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(m=>m[1]).filter((x,i,a)=>a.indexOf(x)===i); }
function extractDate(html, cfg){ return cfg.date || cfg.published || html.match(/<time[^>]*datetime=["']([^"']+)["']/i)?.[1] || meta(html,'date') || DEFAULT_DATE; }
function extractTechnologies(text){
  const candidates=['HTML','CSS','JavaScript','TypeScript','React','Next.js','Node.js','Express','MongoDB','Firebase','Supabase','Tailwind','Bootstrap','Three.js','GSAP','Framer Motion','GitHub Actions','Python','PHP','MySQL'];
  const lower=text.toLowerCase();
  return candidates.filter(t => lower.includes(t.toLowerCase().replace('.js',''))).slice(0,8);
}
function normalizeDate(v){ const d=new Date(v); return Number.isNaN(d.getTime()) ? new Date(DEFAULT_DATE) : d; }
function relativeLabel(date){ const diff=Math.max(0, Date.now()-normalizeDate(date).getTime()); const days=Math.floor(diff/86400000); if(days===0) return 'TODAY'; if(days===1) return '1 DAY AGO'; if(days<30) return `${days} DAYS AGO`; const months=Math.floor(days/30); return `${months} MONTH${months>1?'S':''} AGO`; }
function readingTime(text){ const words=(text.match(/\b[\w’'-]+\b/g)||[]).length; return Math.max(1, Math.ceil(words/190)); }
function fallbackSvg(title, kind){ const letters=titleize(title).split(/\s+/).map(x=>x[0]).slice(0,3).join(''); const label=kind==='blog'?'FIELD NOTE':'BUILD'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#081019"/><stop offset=".52" stop-color="#0c1c24"/><stop offset="1" stop-color="#121126"/></linearGradient><radialGradient id="r"><stop stop-color="#7cf7ff" stop-opacity=".25"/><stop offset="1" stop-color="#7cf7ff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="750" fill="url(#g)"/><circle cx="200" cy="130" r="260" fill="url(#r)"/><circle cx="990" cy="620" r="330" fill="#9d8cff" opacity=".08"/><g fill="none" stroke="#7cf7ff" opacity=".18"><circle cx="600" cy="375" r="180"/><circle cx="600" cy="375" r="280"/><ellipse cx="600" cy="375" rx="440" ry="160" transform="rotate(-18 600 375)"/></g><text x="64" y="90" fill="#7890a6" font-family="monospace" font-size="20" letter-spacing="4">${label} / OBAIDUL</text><text x="64" y="640" fill="#eefcff" font-family="monospace" font-size="72" font-weight="800" letter-spacing="-3">${esc(letters)}</text><text x="64" y="685" fill="#8ca0b2" font-family="monospace" font-size="18">${esc(titleize(title)).slice(0,50)}</text></svg>`; }

function detectImage(dir, cfg){
  const preferred = [cfg.image,cfg.thumbnail,cfg.cover,'thumbnail.webp','thumbnail.png','cover.webp','cover.png','preview.webp','preview.png'].filter(Boolean);
  for(const rel of preferred){ const p=path.join(dir,rel); if(exists(p) && fs.statSync(p).isFile()) return {source:rel, kind:'file'}; }
  const media=firstMedia(dir); if(media) return {source:media, kind:'file'};
  return {source:'', kind:'fallback'};
}

function materialFallback(dir, cfg, html){
  for(const f of ['material.md','material.txt','description.txt','caption.txt']){
    const p=path.join(dir,f); if(exists(p)){ const text=read(p).trim(); if(text) return {text, source:f}; }
  }
  if(cfg.description) return {text:cfg.description, source:'metadata'};
  const p=firstParagraph(html); if(p) return {text:p, source:'html'};
  const readme=findFile(dir,['README.md','README.txt']); if(readme){ const txt=read(path.join(dir,readme)).replace(/^#+.*$/gm,'').replace(/[*_`]/g,'').replace(/\s+/g,' ').trim(); if(txt) return {text:txt.slice(0,320), source:readme}; }
  return {text:'A web project built as part of an ongoing digital lab.', source:'fallback'};
}

function captionFallback(dir, cfg, image){
  if(cfg.caption) return cfg.caption;
  for(const f of ['caption.txt','caption.md']) if(exists(path.join(dir,f))) { const x=read(path.join(dir,f)).trim(); if(x) return x; }
  if(image.source) return titleize(path.basename(image.source,path.extname(image.source)));
  return titleize(cfg.title || path.basename(dir));
}

function collect(type){
  const dir=path.join(CONTENT,type==='project'?'projects':'blogs');
  const out=[];
  for(const e of listFiles(dir)){
    if(!e.isDirectory()) continue;
    const itemDir=path.join(dir,e.name);
    const htmlPath=path.join(itemDir,'index.html');
    if(!exists(htmlPath)) continue;
    const html=read(htmlPath);
    const cfg=readJson(path.join(itemDir,type==='project'?'project.json':'blog.json'));
    const rawTitle=cfg.title || htmlTitle(html) || titleize(e.name);
    const title=String(rawTitle).replace(/\s+[·|].*$/,'').trim();
    const material=materialFallback(itemDir,cfg,html);
    const description=String(material.text).replace(/\s+/g,' ').trim().slice(0,320);
    const image=detectImage(itemDir,cfg);
    const slug=slugify(cfg.slug || e.name);
    const date=extractDate(html,cfg);
    const text=stripHtml(html);
    const technologies=Array.isArray(cfg.technologies)&&cfg.technologies.length?cfg.technologies:extractTechnologies(`${text} ${JSON.stringify(cfg)} ${e.name}`);
    const links=externalLinks(html);
    const live=cfg.live || cfg.liveUrl || links.find(u=>!u.includes('github.com')) || '';
    const github=cfg.github || cfg.githubUrl || links.find(u=>u.includes('github.com')) || '';
    out.push({
      id:`${type}-${slug}`,
      type,
      folder:e.name,
      slug,
      title,
      description,
      materialSource:material.source,
      caption:captionFallback(itemDir,cfg,image),
      date,
      updated:cfg.updated || date,
      category:cfg.category || (type==='project'?'Web Project':'Web Development'),
      technologies,
      tags:Array.isArray(cfg.tags)?cfg.tags:[],
      live,
      github,
      featured:Boolean(cfg.featured),
      pinned:Boolean(cfg.pinned),
      status:String(cfg.status||'published').toLowerCase(),
      image,
      readingTime:type==='blog'?readingTime(text):null,
      summary:description,
      sourceTitle:cfg.title?'metadata':htmlTitle(html)?'html':'folder',
      originalEntry:htmlPath,
      sourceDir:itemDir
    });
  }
  return out.filter(x=>x.status!=='draft' && x.status!=='hidden');
}

function sortItems(a,b){ const pin=(b.pinned-a.pinned)||(b.featured-a.featured); return pin || (normalizeDate(b.date)-normalizeDate(a.date)) || a.title.localeCompare(b.title); }

function copyImage(item, assetRoot){
  if(item.image.kind!=='file') return;
  const src=path.join(item.sourceDir,item.image.source); const dest=path.join(assetRoot,item.image.source);
  fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(src,dest);
  item.publicImage=`/assets/content/${item.type}s/${item.slug}/${item.image.source}`;
  item.imageCaption=item.caption;
}

function buildFallbackMedia(item){
  const svg=fallbackSvg(item.title,item.type);
  const rel=`assets/content/${item.type}s/${item.slug}/fallback.svg`;
  write(path.join(PUBLIC,rel),svg); item.publicImage=`/${rel}`; item.imageCaption=item.caption;
}

function card(item, base=''){
  const href=`${base}/${item.type==='project'?'projects':'blogs'}/${item.slug}/`;
  const badges=(item.featured?'<span class="badge accent">FEATURED</span>':'') + `<span class="badge">${esc(item.type==='project'?relativeLabel(item.date):`${item.readingTime} MIN READ`)}</span>`;
  const media=item.publicImage?`<img src="${esc(base+item.publicImage)}" alt="${esc(item.caption)}" loading="lazy" decoding="async" width="1200" height="750">`:`<div class="media-fallback"><strong>${esc(titleize(item.title).slice(0,3).toUpperCase())}</strong></div>`;
  const tags=item.technologies.slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
  return `<article class="content-card reveal" data-content-card="${item.type}" data-featured="${item.featured}" data-recent="${Date.now()-normalizeDate(item.date).getTime()<1000*86400000*90}"><a href="${esc(href)}" aria-label="Open ${esc(item.title)}"><div class="card-media">${media}<div class="card-badges">${badges}</div></div><div class="card-body"><span class="card-kicker">${esc(item.category)}</span><h3 class="card-title">${esc(item.title)}</h3><p class="card-desc">${esc(item.description)}</p><div class="card-foot"><div class="tag-row">${tags}</div><span class="card-link">OPEN ↗</span></div></div></a></article>`;
}

function baseHead(title, description, canonical, image, base){
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#05070c"><meta name="description" content="${attr(description)}"><link rel="canonical" href="${attr(canonical)}"><link rel="icon" href="${base}/assets/icons/favicon.svg" type="image/svg+xml"><meta property="og:type" content="article"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(description)}"><meta property="og:url" content="${attr(canonical)}"><meta property="og:image" content="${attr(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(title)}"><meta name="twitter:description" content="${attr(description)}"><meta name="twitter:image" content="${attr(image)}"><title>${esc(title)}</title><link rel="stylesheet" href="${base}/assets/css/site.css">`;
}
function footer(base){ return `<footer class="footer shell"><div><a class="brand footer-brand" href="${base}/"><span class="brand-mark"><span>O</span></span><span class="brand-word">OBAIDUL<span>.</span></span></a><p>${esc(CONFIG.name)} · ${esc(CONFIG.secondaryRole)}</p></div><div class="footer-right"><span>© ${new Date().getFullYear()} · built as a system.</span><a href="${base}/">Home ↑</a></div></footer>`; }
function header(base){ return `<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="${base}/"><span class="brand-mark"><span>O</span></span><span class="brand-word">OBAIDUL<span>.</span></span></a><nav class="nav" aria-label="Primary"><a href="${base}/#work">Work</a><a href="${base}/#writing">Writing</a><a href="${base}/#mind">Mind</a><a href="${base}/#contact">Contact</a></nav><button class="command-trigger" data-open-command type="button"><span class="command-key">⌘</span><span>K</span></button></div></header>`; }

function detailPage(item, siteUrl, base){
  const route=item.type==='project'?'projects':'blogs'; const canonical=`${siteUrl}/${route}/${item.slug}/`;
  const media=item.publicImage||`${siteUrl}/assets/icons/icon.svg`;
  const dateText=normalizeDate(item.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const jsonLd=item.type==='blog'?{
    '@context':'https://schema.org','@type':'Article','headline':item.title,'description':item.description,'datePublished':normalizeDate(item.date).toISOString(),'dateModified':normalizeDate(item.updated).toISOString(),'author':{'@type':'Person','name':CONFIG.name,'url':siteUrl+'/'},'image':media,'mainEntityOfPage':canonical
  }:{
    '@context':'https://schema.org','@type':'CreativeWork','name':item.title,'description':item.description,'dateCreated':normalizeDate(item.date).toISOString(),'dateModified':normalizeDate(item.updated).toISOString(),'author':{'@type':'Person','name':CONFIG.name,'url':siteUrl+'/'},'url':canonical,'image':media,'keywords':item.technologies.join(', ')
  };
  const preview= item.type==='project' ? `<div class="detail-preview"><div class="preview-head"><span>RUNNABLE PREVIEW</span><a href="${base}/projects/${item.slug}/preview/" target="_blank" rel="noopener">Open full preview ↗</a></div><iframe src="${base}/projects/${item.slug}/preview/" loading="lazy" title="${esc(item.title)} live preview"></iframe></div>` : '';
  const links=`${item.live?`<a class="btn btn-primary" href="${attr(item.live)}" target="_blank" rel="noopener">Live ↗</a>`:''}${item.github?`<a class="btn btn-ghost" href="${attr(item.github)}" target="_blank" rel="noopener">Source ↗</a>`:''}`;
  const tags=item.technologies.map(t=>`<span class="tag">${esc(t)}</span>`).join('');
  const html=`<!doctype html><html lang="${CONFIG.language}"><head>${baseHead(`${item.title} · ${CONFIG.shortName}`,item.description,canonical,media,base)}<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body><div class="noise"></div>${header(base)}<main class="detail shell"><div class="detail-kicker">${item.type==='project'?'BUILD LOG':'FIELD NOTE'} / ${esc(dateText)}</div><div class="detail-grid"><div><h1>${esc(item.title)}</h1><p class="detail-lead">${esc(item.description)}</p><div class="detail-meta"><span>${esc(item.category)}</span><span>${item.type==='blog'?`${item.readingTime} min read`:esc(item.status)}</span><span>${esc(relativeLabel(item.updated))}</span></div><div class="detail-actions">${links}<a class="btn btn-ghost" href="${base}/${route}/">More ${route} ↗</a></div></div><figure class="detail-image"><img src="${esc(media)}" alt="${esc(item.caption)}" width="1200" height="750"><figcaption>${esc(item.caption)}</figcaption></figure></div><div class="detail-content"><div class="content-column"><div class="prose-intro"><span>MATERIAL / ${esc(item.materialSource.toUpperCase())}</span><p>${esc(item.description)}</p></div>${preview}<div class="source-note">The original ${esc(item.type)} files stay inside the content folder. This canonical page adds searchable context, metadata, and a stable URL without changing the source material.</div><div class="tag-row big-tags">${tags}</div></div><aside class="detail-aside"><div><span>INDEXED AS</span><strong>${esc(item.title)}</strong></div><div><span>TECH</span><strong>${esc(item.technologies.slice(0,5).join(' · ')||'Web')}</strong></div><div><span>LINKS</span><strong>${item.live||item.github?'available':'internal preview'}</strong></div></aside></div></main>${footer(base)}</body></html>`;
  write(path.join(PUBLIC,route,item.slug,'index.html'),html);
}

function listPage(type,items,siteUrl,base){
  const route=type==='project'?'projects':'blogs'; const title=type==='project'?'Projects':'Writing';
  const cards=items.map(i=>card(i,base)).join('');
  const description=type==='project'?`Projects and experiments by ${CONFIG.name}.`:`Technical writing and field notes by ${CONFIG.name}.`;
  const html=`<!doctype html><html lang="${CONFIG.language}"><head>${baseHead(`${title} · ${CONFIG.shortName}`,description,`${siteUrl}/${route}/`,`${siteUrl}${CONFIG.heroImage}`,base)}</head><body><div class="noise"></div>${header(base)}<main class="shell list-page"><div class="section-top"><div><p class="index-label">${type==='project'?'01 / BUILD LOG':'02 / FIELD NOTES'}</p><h1>${title}</h1><p class="section-sub">Everything published, ordered by signal instead of ceremony.</p></div><span class="section-link">${items.length} indexed</span></div><div class="list-grid">${cards||'<div class="empty-state">Nothing published yet. Add a folder under content and push.</div>'}</div></main>${footer(base)}</body></html>`;
  write(path.join(PUBLIC,route,'index.html'),html);
}

rm(PUBLIC); fs.mkdirSync(PUBLIC,{recursive:true}); fs.cpSync(path.join(ROOT,'assets'),path.join(PUBLIC,'assets'),{recursive:true});

const siteUrl=(CONFIG.siteUrl||'').replace(/\/$/,'') || (()=>{ const [owner,repo]=(process.env.GITHUB_REPOSITORY||'example/portfolio').split('/'); return `https://${owner}.github.io${repo===`${owner}.github.io`?'':`/${repo}`}`; })();
const basePath=new URL(siteUrl).pathname.replace(/\/$/,'');
const projects=collect('project').sort(sortItems); const blogs=collect('blog').sort(sortItems);
for(const item of [...projects,...blogs]){ const assetRoot=path.join(PUBLIC,'assets/content',`${item.type}s`,item.slug); if(item.image.kind==='file') copyImage(item,assetRoot); else buildFallbackMedia(item); fs.cpSync(item.sourceDir,path.join(PUBLIC,item.type==='project'?'projects':'blogs',item.slug,'preview'),{recursive:true}); }
for(const i of [...projects,...blogs]) detailPage(i,siteUrl,basePath);
listPage('project',projects,siteUrl,basePath); listPage('blog',blogs,siteUrl,basePath);

const homepageTpl=read(path.join(ROOT,'index.html'));
const projectHome=projects.slice(0,8).map(i=>card(i,basePath)).join('') || '<div class="empty-state">Projects will appear here automatically from <code>content/projects/</code>.</div>';
const blogHome=blogs.slice(0,8).map(i=>card(i,basePath)).join('') || '<div class="empty-state">Writing will appear here automatically from <code>content/blogs/</code>.</div>';
const contact=[]; if(CONFIG.github) contact.push(`<a class="btn btn-primary" href="${attr(CONFIG.github)}" target="_blank" rel="noopener">GitHub ↗</a>`); if(CONFIG.email) contact.push(`<a class="btn btn-ghost" href="mailto:${attr(CONFIG.email)}">Email</a>`); for(const [k,v] of Object.entries(CONFIG.social||{})) if(v) contact.push(`<a class="btn btn-ghost" href="${attr(v)}" target="_blank" rel="noopener">${esc(k)}</a>`); if(CONFIG.resume) contact.push(`<a class="btn btn-ghost" href="${attr(CONFIG.resume)}" target="_blank" rel="noopener">CV ↗</a>`); if(!contact.length) contact.push(`<a class="btn btn-primary" href="${basePath}/projects/">Browse the work ↗</a>`);
const jsonLd={'@context':'https://schema.org','@graph':[{'@type':'Person','name':CONFIG.name,'url':siteUrl+'/','image':siteUrl+CONFIG.heroImage,'jobTitle':CONFIG.role,'description':CONFIG.description,'sameAs':[CONFIG.github,...Object.values(CONFIG.social||{})].filter(Boolean)},{'@type':'WebSite','name':`${CONFIG.name} · Digital Lab`,'url':siteUrl+'/','description':CONFIG.description}]};
const homepage=homepageTpl.replaceAll('{{DESCRIPTION}}',attr(CONFIG.description)).replaceAll('{{CANONICAL}}',siteUrl+'/').replaceAll('{{BASE}}',basePath).replaceAll('{{BASE_JSON}}',JSON.stringify(basePath)).replaceAll('{{NAME}}',esc(CONFIG.name)).replaceAll('{{SHORT_NAME}}',esc(CONFIG.shortName)).replaceAll('{{ROLE}}',esc(CONFIG.role)).replaceAll('{{SECONDARY_ROLE}}',esc(CONFIG.secondaryRole)).replaceAll('{{TAGLINE}}',esc(CONFIG.tagline)).replaceAll('{{HERO_IMAGE}}',CONFIG.heroImage).replace('{{PROJECT_GRID}}',projectHome).replace('{{BLOG_GRID}}',blogHome).replace('{{PROJECT_COUNT}}',String(projects.length)).replace('{{LATEST_PROJECT}}',esc(projects[0]?.title||'awaiting first build')).replace('{{CONTACT_LINKS}}',contact.join('')).replace('{{YEAR}}',String(new Date().getFullYear())).replace('{{FRONTEND_DATA}}',JSON.stringify({base:basePath,index:[...projects,...blogs].map(i=>({id:i.id,type:i.type,title:i.title,description:i.description,url:`/${i.type==='project'?'projects':'blogs'}/${i.slug}/`,technologies:i.technologies,tags:i.tags,date:i.date}))}));
write(path.join(PUBLIC,'index.html'),homepage);
write(path.join(PUBLIC,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 · Obaidul</title><link rel="stylesheet" href="${basePath}/assets/css/site.css"></head><body><main class="shell" style="min-height:100vh;display:grid;place-items:center;text-align:center"><div><p class="index-label">404 / SIGNAL LOST</p><h1 style="font-size:clamp(60px,14vw,140px);line-height:.85;margin:0">404</h1><p style="color:#8393a5">The route does not exist, but the system does.</p><a class="btn btn-primary" href="${basePath}/">Return to the lab ↗</a></div></main></body></html>`);

const index=[...projects,...blogs].map(i=>({id:i.id,type:i.type,title:i.title,description:i.description,caption:i.caption,url:`/${i.type==='project'?'projects':'blogs'}/${i.slug}/`,technologies:i.technologies,tags:i.tags,date:i.date,updated:i.updated}));
write(path.join(GENERATED,'content.json'),JSON.stringify({generatedAt:new Date().toISOString(),projects,blogs},null,2));
write(path.join(GENERATED,'search-index.json'),JSON.stringify(index,null,2));
write(path.join(GENERATED,'ai-profile.json'),JSON.stringify({name:CONFIG.name,roles:[CONFIG.role,CONFIG.secondaryRole],tagline:CONFIG.tagline,about:CONFIG.description,projects:projects.map(i=>({title:i.title,description:i.description,technologies:i.technologies,url:`/projects/${i.slug}/`})),blogs:blogs.map(i=>({title:i.title,description:i.description,technologies:i.technologies,url:`/blogs/${i.slug}/`})),instructions:'Answer only from this profile and indexed content. Never invent projects, skills, roles or claims.'},null,2));
const urls=[{loc:`${siteUrl}/`,freq:'weekly',priority:'1.0'},{loc:`${siteUrl}/projects/`,freq:'weekly',priority:'0.8'},{loc:`${siteUrl}/blogs/`,freq:'weekly',priority:'0.8'},...projects.map(i=>({loc:`${siteUrl}/projects/${i.slug}/`,freq:'monthly',priority:i.featured?'0.9':'0.65',lastmod:i.updated})),...blogs.map(i=>({loc:`${siteUrl}/blogs/${i.slug}/`,freq:'monthly',priority:i.featured?'0.9':'0.65',lastmod:i.updated}))];
write(path.join(PUBLIC,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(u.loc)}</loc>${u.lastmod?`<lastmod>${normalizeDate(u.lastmod).toISOString()}</lastmod>`:''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('')}</urlset>`);
write(path.join(PUBLIC,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
const feed=[...blogs,...projects].sort((a,b)=>normalizeDate(b.date)-normalizeDate(a.date)).slice(0,30).map(i=>{const url=`${siteUrl}/${i.type==='project'?'projects':'blogs'}/${i.slug}/`;return `<item><title><![CDATA[${i.title}]]></title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${normalizeDate(i.date).toUTCString()}</pubDate><description><![CDATA[${i.description}]]></description></item>`;}).join('');
write(path.join(PUBLIC,'feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[${CONFIG.name} · Updates]]></title><link>${siteUrl}/</link><description><![CDATA[${CONFIG.description}]]></description>${feed}</channel></rss>`);

console.log(`Built ${projects.length} projects, ${blogs.length} blogs → ${siteUrl}`);
