/* Does It Pencil? — shared header, saved-calculations store and save bar.
   Saved calculations live in this browser (localStorage) under one key, shared by every calculator.
   window.DIP is the only global this file defines. */
(function(){
  const KEY='dip:saved:v1';
  const ROOT=document.documentElement.dataset.root||'';
  const CALCS={
    napkin:{group:'Flips',name:'Deal Napkin',short:'Deal napkin',nav:'Deal napkin',path:'deal-napkin/index.html',start:true,
      blurb:'The quick flip check. Price, ARV, rehab, hold time and loan terms in; a red, yellow or green verdict out, plus the max offer that makes it a deal.'},
    flip:{group:'Flips',name:'Flip vs. Build',short:'Flip vs. build',nav:'Flip vs. build',path:'flip-vs-build/index.html',
      blurb:'Compare up to four exit plans on one property: flip, add ADUs and JADUs, or build and sell on income. Profit, cash needed, break-even and stress tests, with a PDF report.'},
    rental:{group:'Rentals',name:'Rental Quick Check',short:'Rental quick check',nav:'Quick check',path:'rental/index.html',start:true,
      blurb:'Does a rental cover itself after the refi? Monthly cash flow, the numbers a DSCR lender checks, break-even price and rent, and year-1 tax savings from cost segregation.'},
    underwriting:{group:'Rentals',name:'Rental Underwriting',short:'Rental underwriting',nav:'Underwriting',path:'rental-underwriting/index.html',
      blurb:'The full buy-and-hold analysis: financing with PMI, sensitivity grid, 10-year projection and IRR, plus optional ADU and cost segregation tax modules.'}
  };
  const GROUPS=['Flips','Rentals'];
  const EMBED=window.parent!==window;
  if(EMBED)document.documentElement.classList.add('dip-embedded');
  const listeners=new Set();

  function readAll(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
  function writeAll(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}finally{listeners.forEach(f=>f())}}
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const clone=o=>JSON.parse(JSON.stringify(o));
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const store={
    list(calc){return readAll().filter(e=>!calc||e.calc===calc).sort((a,b)=>b.updatedAt-a.updatedAt)},
    get(id){return readAll().find(e=>e.id===id)||null},
    save(entry){
      const a=readAll(),now=Date.now();
      const i=entry.id?a.findIndex(e=>e.id===entry.id):-1;
      const rec={id:entry.id||uid(),calc:entry.calc,label:(entry.label||'').trim()||'Untitled',state:clone(entry.state),summary:entry.summary||null,
        createdAt:i>=0?a[i].createdAt:now,updatedAt:now};
      if(i>=0)a[i]=rec;else a.unshift(rec);
      return writeAll(a)?rec:null;
    },
    rename(id,label){const a=readAll(),e=a.find(x=>x.id===id);if(!e)return;e.label=(label||'').trim()||'Untitled';e.updatedAt=Date.now();writeAll(a)},
    remove(id){writeAll(readAll().filter(e=>e.id!==id))},
    duplicate(id){const e=store.get(id);if(!e)return null;return store.save({calc:e.calc,label:e.label+' (copy)',state:e.state,summary:e.summary})},
    exportJSON(){return JSON.stringify({app:'doesitpencil',version:1,exportedAt:new Date().toISOString(),items:readAll()},null,2)},
    importJSON(text){
      const j=JSON.parse(text);const items=Array.isArray(j)?j:j.items;
      if(!Array.isArray(items))throw new Error('No saved calculations found in that file.');
      const a=readAll();let added=0,updated=0;
      for(const it of items){
        if(!it||!CALCS[it.calc]||!it.state)continue;
        const i=a.findIndex(e=>e.id===it.id);
        if(i>=0){if((it.updatedAt||0)>(a[i].updatedAt||0)){a[i]=it;updated++}}
        else{a.push({...it,id:it.id||uid()});added++}
      }
      writeAll(a);return {added,updated};
    },
    onChange(f){listeners.add(f);return()=>listeners.delete(f)}
  };
  addEventListener('storage',e=>{if(e.key===KEY)listeners.forEach(f=>f())});

  function href(calc,id){return ROOT+CALCS[calc].path+(id?'?open='+encodeURIComponent(id):'')}

  async function download(filename,data,type){
    const blob=data instanceof Blob?data:new Blob([data],{type:type||'application/octet-stream'});
    try{
      const dl=window.claude&&typeof window.claude.use==='function'?await window.claude.use('downloads'):null;
      if(dl){await dl.save({filename,data:blob});return 'saved'}
    }catch(err){if(err&&err.code==='declined')return 'declined'}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);return 'saved';
  }

  function mountHeader(active){
    const el=document.getElementById('dip-header');if(!el)return;
    const link=(key,label,path)=>`<a href="${ROOT+path}" ${active===key?'aria-current="page"':''}>${label}${key==='saved'?' <span class="dip-count" id="dip-count"></span>':''}</a>`;
    el.className='dip-header';
    el.innerHTML=`<div class="dip-stripe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="dip-in">
      <a class="dip-brand" href="${ROOT}index.html"><img class="dip-b" src="${ROOT}assets/recc-logo-black.png" alt="Real Estate Cheat Codes"><img class="dip-w" src="${ROOT}assets/recc-logo-white.png" alt="Real Estate Cheat Codes"><span class="dip-sep"></span><b>Does It Pencil?</b></a>
      <nav class="dip-nav" aria-label="Calculators">
        ${GROUPS.map(g=>`<span class="dip-grp"><span class="dip-grp-l">${g}</span>${Object.entries(CALCS).filter(([k,c])=>c.group===g).map(([k,c])=>link(k,c.nav,c.path)).join('')}</span>`).join('')}
        ${link('saved','My saved','saved/index.html')}
        <a class="dip-join" href="https://www.skool.com/realestatecheatcodes/about?utm_source=doesitpencil&utm_medium=website&utm_campaign=community_cta&utm_content=header" target="_blank" rel="noopener">Join the community</a>
      </nav>
    </div>`;
    if(EMBED){
      const f=document.querySelector('.dip-foot .dip-in');
      if(f&&!f.querySelector('.dip-embed-legal')){const p=document.createElement('p');p.className='dip-embed-legal';
        p.innerHTML=`Educational tool, not financial, legal or tax advice. <a href="${ROOT}terms/index.html" target="_blank" rel="noopener">Terms of Use</a> · © 2026 D &amp; A Ventures LLC dba Real Estate Cheat Codes · <a href="https://doesitpencil.org" target="_blank" rel="noopener">doesitpencil.org</a>`;f.appendChild(p)}
    }else showNotice();
    const upd=()=>{const n=readAll().length;const c=document.getElementById('dip-count');if(c)c.textContent=n?String(n):''};
    upd();store.onChange(upd);
    glossary();
  }

  /* One-time notice: use of the site is acceptance of the Terms. */
  function showNotice(){
    let seen=false;try{seen=localStorage.getItem('dip:terms-ack')==='1'}catch(e){}
    if(seen||document.getElementById('dip-notice'))return;
    const n=document.createElement('div');n.className='dip-notice';n.id='dip-notice';n.setAttribute('role','region');n.setAttribute('aria-label','Terms notice');
    n.innerHTML=`<p><b>Educational tool only. Not financial, legal, tax or real estate advice.</b> By using this site you agree to our <a href="${ROOT}terms/index.html">Terms of Use</a>, including the hold harmless and indemnification provisions.</p><button type="button">I understand</button>`;
    n.querySelector('button').onclick=()=>{try{localStorage.setItem('dip:terms-ack','1')}catch(e){}n.remove()};
    document.body.appendChild(n);
  }

  /* ---------- Verdict: one traffic light for the whole site ---------- */
  const VERDICT={green:"Green: it's a deal",yellow:'Yellow: close to a deal',red:'Red: not a deal'};
  function light(color,size){return `<span class="dip-light dip-${color||'off'}" ${size?`style="--dip-dot:${size}px"`:''} role="img" aria-label="${esc(VERDICT[color]||'')}"><i></i><i></i><i></i></span>`}
  function legend(items){return `<div class="dip-legend">${items.map(([c,b,t])=>`<span><i class="dip-dot dip-${c}"></i><b>${b}</b> ${t}</span>`).join('')}</div>`}

  /* ---------- Share links: the whole calculation travels in the link (#deal=...) ---------- */
  const b64u={enc(bytes){let s='';const a=new Uint8Array(bytes);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')},
    dec(str){const s=atob(str.replace(/-/g,'+').replace(/_/g,'/'));const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}};
  async function pack(obj){
    const bytes=new TextEncoder().encode(JSON.stringify(obj));
    if(window.CompressionStream){try{const buf=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();return 'z'+b64u.enc(buf)}catch(e){}}
    return 'j'+b64u.enc(bytes);
  }
  async function unpack(str){
    const kind=str[0],bytes=b64u.dec(str.slice(1));
    if(kind==='z'){const buf=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();return JSON.parse(new TextDecoder().decode(buf))}
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function shareLink(calc,label,state){
    const p=await pack({c:calc,l:label||'',s:state});
    return location.origin+location.pathname+'#deal='+p;
  }

  /* Save bar: label + Save / Save as new / New / Share / PDF + an "Open saved" picker for this calculator.
     opts: {el, calc, getState(), setState(state), summarize(state)->{headline,detail,tone}, defaultLabel(state), reset(), report()->spec} */
  function mountSaveBar(opts){
    const el=typeof opts.el==='string'?document.getElementById(opts.el):opts.el;
    let currentId=null,dirty=false,savedAt=null,sharedNote='';
    el.classList.add('dip-save');
    el.innerHTML=`<input id="dip-label" type="text" placeholder="Name this calculation" aria-label="Calculation name" maxlength="120">
      <button type="button" class="dip-primary" id="dip-save">Save</button>
      <button type="button" id="dip-saveas">Save as new</button>
      <button type="button" id="dip-new">New</button>
      <select id="dip-open" aria-label="Open a saved calculation"></select>
      <span class="dip-actions"><button type="button" id="dip-share">Share link</button>${opts.report?'<button type="button" id="dip-pdf">Download PDF</button>':''}</span>
      <span class="dip-status" id="dip-status" aria-live="polite"></span>
      <div class="dip-sharebox" id="dip-sharebox" hidden><input id="dip-sharelink" type="text" readonly aria-label="Share link"><button type="button" id="dip-copy">Copy</button><span id="dip-sharemsg"></span></div>`;
    const $=id=>el.querySelector('#'+id);
    const label=$('dip-label'),status=$('dip-status'),picker=$('dip-open');
    const time=t=>new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    function setStatus(){
      status.classList.toggle('dirty',dirty&&!!currentId);
      status.textContent=sharedNote||(currentId?(dirty?'Unsaved changes since '+time(savedAt):'Saved '+time(savedAt)):'Not saved yet. Name it and select Save to keep it in this browser.');
    }
    function fillPicker(){
      const items=store.list(opts.calc);
      picker.innerHTML=`<option value="">${items.length?'Open saved ('+items.length+')…':'No saved calculations yet'}</option>`+
        items.map(e=>`<option value="${esc(e.id)}" ${e.id===currentId?'selected':''}>${esc(e.label)}${e.summary&&e.summary.headline?' · '+esc(e.summary.headline):''}</option>`).join('')+
        (items.length?`<option value="__manage">Manage saved calculations…</option>`:'');
      picker.disabled=!items.length;
    }
    function setUrl(id){try{const u=new URL(location.href);u.hash='';if(id)u.searchParams.set('open',id);else u.searchParams.delete('open');history.replaceState(null,'',u)}catch(e){}}
    function doSave(asNew){
      const state=opts.getState();
      if(!label.value.trim())label.value=(opts.defaultLabel&&opts.defaultLabel(state))||'Untitled';
      const rec=store.save({id:asNew?null:currentId,calc:opts.calc,label:label.value,state,summary:opts.summarize?opts.summarize(state):null});
      if(!rec){status.textContent='Could not save: this browser is blocking storage (private window or storage turned off).';return}
      currentId=rec.id;savedAt=rec.updatedAt;dirty=false;sharedNote='';track('calculation_saved',{calculator:opts.calc});setUrl(currentId);fillPicker();setStatus();
      const b=$(asNew?'dip-saveas':'dip-save'),t=b.textContent;b.textContent=asNew?'Saved as new':'Saved';setTimeout(()=>b.textContent=t,1200);
    }
    function open(id){
      const e=store.get(id);if(!e)return false;
      opts.setState(clone(e.state));label.value=e.label;currentId=e.id;savedAt=e.updatedAt;dirty=false;sharedNote='';setUrl(id);fillPicker();setStatus();return true;
    }
    $('dip-save').onclick=()=>doSave(false);
    $('dip-saveas').onclick=()=>doSave(true);
    $('dip-new').onclick=()=>{opts.reset&&opts.reset();label.value='';currentId=null;dirty=false;sharedNote='';setUrl(null);fillPicker();setStatus()};
    label.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doSave(false)}});
    label.addEventListener('input',()=>{if(currentId){dirty=true;setStatus()}});
    picker.onchange=()=>{const v=picker.value;if(v==='__manage'){location.href=ROOT+'saved/index.html';return}if(v)open(v);};
    // Share
    $('dip-share').onclick=async()=>{
      const state=opts.getState();
      const lab=label.value.trim()||(opts.defaultLabel&&opts.defaultLabel(state))||'';
      let link;try{link=await shareLink(opts.calc,lab,state)}catch(e){$('dip-sharebox').hidden=false;$('dip-sharemsg').textContent='Could not create a link in this browser.';return}
      track('share_deal',{calculator:opts.calc});
      const box=$('dip-sharebox'),inp=$('dip-sharelink'),msg=$('dip-sharemsg');
      box.hidden=false;inp.value=link;msg.textContent='';
      const touch=matchMedia('(pointer:coarse)').matches;
      if(touch&&navigator.share){try{await navigator.share({title:(lab?lab+' · ':'')+CALCS[opts.calc].name,text:'Does it pencil? Here are the numbers:',url:link});msg.textContent='Shared.';return}catch(e){}}
      try{await navigator.clipboard.writeText(link);msg.textContent='Link copied. Anyone who opens it sees these exact numbers.'}
      catch(e){inp.focus();inp.select();msg.textContent='Select the link and copy it.'}
    };
    $('dip-copy').onclick=async()=>{const inp=$('dip-sharelink');try{await navigator.clipboard.writeText(inp.value);$('dip-sharemsg').textContent='Copied.'}catch(e){inp.focus();inp.select();$('dip-sharemsg').textContent='Press Command+C (or Ctrl+C) to copy.'}};
    // PDF
    if(opts.report)$('dip-pdf').onclick=async()=>{
      const b=$('dip-pdf'),t=b.textContent;b.disabled=true;b.textContent='Building PDF…';
      try{const spec=opts.report();spec.label=label.value.trim()||spec.label||'';await makePDF(spec);track('report_download',{calculator:opts.calc,format:'pdf'})}
      catch(e){status.textContent='Could not build the PDF: '+(e&&e.message||e)}
      finally{b.disabled=false;b.textContent=t}
    };
    store.onChange(fillPicker);
    const api={changed(){sharedNote='';if(currentId&&!dirty){dirty=true}setStatus()},open,get currentId(){return currentId},get label(){return label.value}};
    // Open a shared link (#deal=...) or a saved one (?open=id)
    const hash=location.hash.match(/^#deal=([A-Za-z0-9_-]+)/);
    const q=new URLSearchParams(location.search).get('open');
    if(hash){
      fillPicker();setStatus();
      unpack(hash[1]).then(d=>{
        if(!d||d.c!==opts.calc||!d.s)throw 0;
        opts.setState(d.s);label.value=d.l||'';currentId=null;dirty=false;
        sharedNote='You opened a shared deal. Select Save to keep your own copy.';setStatus();track('shared_deal_opened',{calculator:opts.calc});
      }).catch(()=>{sharedNote='That share link is incomplete or damaged, so the sample numbers are shown.';setStatus()});
    }else if(!(q&&open(q))){fillPicker();setStatus()}
    // A share link pasted into a tab that already has this page open only changes the hash, so load it here too.
    addEventListener('hashchange',()=>{const h=location.hash.match(/^#deal=([A-Za-z0-9_-]+)/);if(!h)return;
      unpack(h[1]).then(d=>{if(!d||d.c!==opts.calc||!d.s)throw 0;opts.setState(d.s);label.value=d.l||'';currentId=null;dirty=false;
        sharedNote='You opened a shared deal. Select Save to keep your own copy.';setStatus()}).catch(()=>{})});
    return api;
  }

  /* ---------- Sticky result bar on phones ---------- */
  function mountSticky(){
    let bar=document.querySelector('.dip-sticky');
    if(!bar){bar=document.createElement('div');bar.className='dip-sticky';bar.setAttribute('aria-hidden','true');
      const after=document.querySelector('.dip-cta-top')||document.getElementById('dip-header');
      after?after.after(bar):document.body.prepend(bar);}
    return {update(color,label,value,sub){bar.className='dip-sticky dip-'+(color||'off');bar.innerHTML=`${light(color,10)}<span class="dip-st-l">${esc(label)}</span><span class="dip-st-v">${esc(value)}</span>${sub?`<span class="dip-st-s">${esc(sub)}</span>`:''}`}};
  }

  /* ---------- "Next step" cross-link between quick and full calculators ---------- */
  function mountNext(el,calc,text){
    el=typeof el==='string'?document.getElementById(el):el;if(!el||!CALCS[calc])return;
    el.className='dip-next';el.innerHTML=`<p>${text}</p><a class="dip-next-go" href="${href(calc)}">Open ${esc(CALCS[calc].name)} →</a>`;
  }

  /* ---------- Email me this deal (Mailchimp) ----------
     Turns on when assets/tracking.js has mailchimp.action filled in. */
  function mountEmail(opts){
    const el=typeof opts.el==='string'?document.getElementById(opts.el):opts.el;if(!el)return;
    const M=(window.DIP_TRACKING&&window.DIP_TRACKING.mailchimp)||{};
    if(!M.action){el.hidden=true;return}
    el.hidden=false;el.className='dip-email';
    el.innerHTML=`<h3>Email me this deal</h3>
      <p>Get these numbers in your inbox so you can come back to them, plus deal breakdowns from Real Estate Cheat Codes.</p>
      <form novalidate><div class="dip-email-row"><input type="email" name="EMAIL" required placeholder="you@email.com" aria-label="Email address" autocomplete="email"><button type="submit">Email it to me</button></div>
      <p class="dip-email-fine">By signing up you agree to get emails from Real Estate Cheat Codes. Unsubscribe anytime.</p>
      <p class="dip-email-msg" aria-live="polite"></p></form>`;
    const form=el.querySelector('form'),msg=el.querySelector('.dip-email-msg'),btn=el.querySelector('button');
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const email=form.EMAIL.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='Enter a valid email address.';return}
      btn.disabled=true;msg.textContent='Sending…';
      const state=opts.getState();const lab=(opts.getLabel&&opts.getLabel())||'';
      let link='';try{link=await shareLink(opts.calc,lab,state)}catch(err){}
      const sum=opts.summarize?opts.summarize(state):null;
      const summary=[CALCS[opts.calc].name,lab,sum&&sum.headline,sum&&sum.detail].filter(Boolean).join(' · ').slice(0,250);
      const params=new URLSearchParams();params.set('EMAIL',email);
      if(M.calcField)params.set(M.calcField,CALCS[opts.calc].name);
      if(M.summaryField)params.set(M.summaryField,summary);
      if(M.linkField)params.set(M.linkField,link.length<=255?link:location.origin+location.pathname);
      const cb='dipmc'+Date.now();
      const base=M.action.replace('/subscribe/post?','/subscribe/post-json?');
      const sc=document.createElement('script');
      const done=(ok,text)=>{btn.disabled=false;msg.textContent=text;delete window[cb];sc.remove();if(ok){form.EMAIL.value='';track('email_signup',{calculator:opts.calc})}};
      window[cb]=r=>{const t=String(r&&r.msg||'').replace(/<[^>]*>/g,'').replace(/^\d+\s*-\s*/,'');
        if(r&&r.result==='success')done(true,'Check your inbox. Your deal is on its way.');
        else if(/already subscribed/i.test(t))done(true,"You're already on the list. We'll still send this deal.");
        else done(false,t||'Something went wrong. Try again in a minute.')};
      sc.onerror=()=>done(false,'Could not reach the email service. Try again in a minute.');
      sc.src=base+(base.includes('?')?'&':'?')+params.toString()+'&c='+cb;
      document.body.appendChild(sc);
    });
  }

  /* ---------- Branded PDF reports ----------
     spec: {title, label, subtitle, verdict:{color,label,headline,sub}, legend:[[color,b,t]], blocks:[...] }
     block: {h:'Heading'} | {kpis:[[k,v,sub]]} | {rows:[[label,value,cls]], title} | {node:Element} | {note:'text'} */
  function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('could not load '+src));document.head.appendChild(s)})}
  async function ensureLibs(){
    if(!window.html2canvas)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if(!window.jspdf)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  function cleanClone(node){const c=node.cloneNode(true);c.querySelectorAll('.dip-def,button,input,select').forEach(x=>{if(x.matches('.dip-def,button'))x.remove();else{const sp=document.createElement('span');sp.textContent=x.value;x.replaceWith(sp)}});c.removeAttribute('id');c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));return c}
  async function makePDF(spec){
    await ensureLibs();await document.fonts.ready;
    const wrap=document.createElement('div');wrap.className='dip-rep-wrap';document.body.appendChild(wrap);
    const date=new Date().toLocaleDateString([], {month:'long',day:'numeric',year:'numeric'});
    const pages=[];
    function newPage(){
      const p=document.createElement('div');p.className='dip-rep';
      p.innerHTML=`<div class="dip-rep-stripe"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="dip-rep-head"><img src="${ROOT}assets/recc-logo-black.png" alt=""><span>Does It Pencil? · ${esc(spec.title)}</span></div>
        <div class="dip-rep-body"></div>
        <div class="dip-rep-foot"><span>© 2026 D &amp; A Ventures LLC dba Real Estate Cheat Codes · Educational estimate, not advice</span><span>doesitpencil.org · <b class="pn"></b></span></div>`;
      wrap.appendChild(p);pages.push(p);return p.querySelector('.dip-rep-body');
    }
    let body=newPage();
    const fits=()=>body.scrollHeight<=body.clientHeight+1;
    function add(html){
      const box=document.createElement('div');box.className='dip-rep-block';
      if(typeof html==='string')box.innerHTML=html;else box.appendChild(html);
      body.appendChild(box);
      if(!fits()&&body.children.length>1){box.remove();body=newPage();body.appendChild(box)}
    }
    add(`<div class="dip-rep-title"><h1>${esc(spec.label||spec.title)}</h1><p>${esc(spec.subtitle||'')}${spec.subtitle?' · ':''}${date}</p></div>`);
    if(spec.verdict){const v=spec.verdict;add(`<div class="dip-rep-verdict dip-${v.color}">${light(v.color,22)}<div><div class="vl">${esc(v.label||VERDICT[v.color]||'')}</div><div class="vh">${esc(v.headline||'')}</div>${v.sub?`<div class="vs">${esc(v.sub)}</div>`:''}</div></div>${spec.legend?legend(spec.legend):''}`)}
    for(const b of spec.blocks||[]){
      if(b.h)add(`<h2>${esc(b.h)}</h2>`);
      else if(b.kpis)add(`<div class="dip-rep-kpis">${b.kpis.map(([k,v,s])=>`<div><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>${s?`<div class="s">${esc(s)}</div>`:''}</div>`).join('')}</div>`);
      else if(b.rows)add(`${b.title?`<h2>${esc(b.title)}</h2>`:''}<table class="dip-rep-t">${b.rows.map(r=>`<tr class="${r[2]||''}"><td>${esc(r[0])}</td><td class="r">${esc(r[1])}</td></tr>`).join('')}</table>`);
      else if(b.node){const d=document.createElement('div');if(b.title)d.innerHTML=`<h2>${esc(b.title)}</h2>`;const c=cleanClone(b.node);c.classList.add('dip-rep-clone');d.appendChild(c);add(d)}
      else if(b.note)add(`<p class="dip-rep-note">${esc(b.note)}</p>`);
    }
    add(`<div class="dip-rep-cta"><b>Want help making the numbers work?</b> Join the Real Estate Cheat Codes community: skool.com/realestatecheatcodes</div>`);
    pages.forEach((p,i)=>p.querySelector('.pn').textContent=`${i+1} of ${pages.length}`);
    try{
      const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'letter'});
      for(let i=0;i<pages.length;i++){
        const c=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#ffffff',width:816,height:1056,windowWidth:1100,logging:false,useCORS:true});
        if(i)pdf.addPage('letter','portrait');pdf.addImage(c.toDataURL('image/jpeg',0.9),'JPEG',0,0,612,792);
      }
      const slug=(spec.label||spec.title||'deal').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'');
      return await download(slug+'.pdf',pdf.output('blob'));
    }finally{wrap.remove()}
  }

  /* ---------- Plain-English definitions for jargon (the small "?" buttons) ---------- */
  const TERMS=[
    ['ARV',/\bARV\b|after-repair value/i,'After-repair value: what the property should sell for once the rehab is done, based on recent sales of similar fixed-up homes.'],
    ['DSCR',/\bDSCR\b/,'Debt service coverage ratio: rent divided by the loan payment (often with taxes, insurance and HOA). DSCR lenders usually want 1.15 to 1.25 or higher.'],
    ['Cap rate',/cap rate/i,'Capitalization rate: a year of net operating income divided by the price. It compares properties without financing.'],
    ['Cash-on-cash',/cash-on-cash/i,'One year of cash flow divided by the cash you put in. 8% means each $100 invested returns $8 a year.'],
    ['NOI',/\bNOI\b|net operating income/i,'Net operating income: rent and other income minus vacancy and operating costs, before the loan payment.'],
    ['LTV',/\bLTV\b|loan-to-value/i,'Loan-to-value: the loan amount as a percent of the price or value. 75% LTV means 25% down.'],
    ['PITI',/\bPITIA?\b/,'Principal, interest, taxes and insurance (PITIA adds HOA dues): the full monthly housing payment.'],
    ['Points',/points/i,'Upfront loan fees. One point is 1% of the loan amount.'],
    ['Cost segregation',/cost seg/i,'A study that moves parts of a building (appliances, flooring, site work) into faster depreciation, creating bigger write-offs in the early years.'],
    ['Bonus depreciation',/bonus depreciation/i,'Lets you write off 5-, 7- and 15-year property right away instead of over its life. 100% for property acquired after Jan 19, 2025. California does not allow it.'],
    ['REPS',/\bREPS\b|real estate professional/i,'Real estate professional status: 750+ hours a year and more than half your working time in real estate. It lets rental losses offset other income.'],
    ['Vacancy',/vacancy/i,'The share of the year a unit sits empty between tenants. 5% is about 18 days a year.'],
    ['CapEx',/capex/i,'Capital expenditures: savings set aside for big replacements like the roof, HVAC or water heater.'],
    ['GRM',/\bGRM\b/,'Gross rent multiplier: price divided by a year of gross rent. Lower means more rent for the money.'],
    ['IRR',/\bIRR\b/,'Internal rate of return: the yearly return that accounts for when every dollar goes in and comes out, including the sale.'],
    ['Break-even',/break-even|breaks even/i,'The point where the deal neither makes nor loses money.'],
    ['Contingency',/contingency/i,'Extra money budgeted on top of the rehab estimate, because rehabs usually run over.'],
    ['JADU',/\bJADU\b/,'Junior ADU: a unit of up to 500 sq ft carved out of the existing house, with its own entrance and a small kitchen.'],
    ['ADU',/\bADUs?\b/,'Accessory dwelling unit: a second home on the same lot, like a garage conversion or a detached backyard unit.'],
    ['Mello-Roos',/mello-roos/i,'A special tax some California neighborhoods pay to fund local infrastructure. It shows on the property tax bill.'],
    ['PMI',/\bPMI\b/,'Private mortgage insurance: charged on conventional loans with less than 20% down until the loan drops to 78% of the original value.'],
    ['HELOC',/\bHELOC\b/,'Home equity line of credit: borrowing against equity in a property you already own, often used to buy with cash and refinance later.'],
    ['Interest-only',/interest-only/i,'A loan where the payment covers only interest, so the balance does not go down.'],
    ['70% rule',/70% rule/i,'Flipper rule of thumb: price plus rehab should be at or under 70% of ARV, leaving room for costs and profit.'],
    ['Private money',/private (money|loan)/i,'A loan from an individual, usually at a higher rate, often used to cover what the main lender will not.'],
    ['Senior loan',/senior loan/i,'The main loan, paid back first. On flips this is usually a hard-money or construction lender.']
  ];
  const DEF_SEL='label,.k,.lbl,th,h2,h3,summary,.checks li>span:nth-child(2),.dip-legend span';
  let tip=null;
  function showTip(btn){
    if(!tip){tip=document.createElement('div');tip.className='dip-tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip)}
    tip.innerHTML=`<b>${esc(btn.dataset.term)}</b> ${esc(btn.dataset.def)}`;tip.hidden=false;
    const r=btn.getBoundingClientRect(),w=Math.min(300,innerWidth-24);tip.style.width=w+'px';
    let x=Math.min(Math.max(12,r.left+r.width/2-w/2),innerWidth-w-12);
    tip.style.left=x+scrollX+'px';tip.style.top=(r.bottom+8+scrollY)+'px';
  }
  function hideTip(){if(tip)tip.hidden=true}
  function glossary(){
    const scan=()=>{
      const skip=el=>el.closest('.dip-header,.dip-cta-top,.dip-cta-bottom,.dip-foot,.dip-rep-wrap,#preview,.dip-notice,.dip-save,.dip-sticky,.dip-email,.dip-next,select,.switch,.sticky');
      for(const [term,re,def] of TERMS){
        if(document.querySelector(`.dip-def[data-term="${term}"]`))continue;
        const el=[...document.querySelectorAll(DEF_SEL)].find(e=>!skip(e)&&e.offsetParent!==null&&re.test([...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ')));
        if(!el)continue;
        const b=document.createElement('button');b.type='button';b.className='dip-def';b.textContent='?';b.dataset.term=term;b.dataset.def=def;b.setAttribute('aria-label','What is '+term+'?');
        const firstText=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
        if(firstText&&/flex|grid/.test(getComputedStyle(el).display)){const w=document.createElement('span');w.className='dip-defwrap';firstText.replaceWith(w);w.append(firstText,b)}
        else firstText?firstText.after(b):el.appendChild(b);
      }
    };
    document.addEventListener('mouseover',e=>{const b=e.target.closest&&e.target.closest('.dip-def');if(b)showTip(b)});
    document.addEventListener('mouseout',e=>{if(e.target.closest&&e.target.closest('.dip-def'))hideTip()});
    document.addEventListener('focusin',e=>{if(e.target.classList&&e.target.classList.contains('dip-def'))showTip(e.target)});
    document.addEventListener('focusout',e=>{if(e.target.classList&&e.target.classList.contains('dip-def'))hideTip()});
    document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.dip-def');if(b){e.preventDefault();e.stopPropagation();(tip&&!tip.hidden)?hideTip():showTip(b)}else hideTip()},true);
    addEventListener('scroll',hideTip,{passive:true});
    let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(scan,250)}).observe(document.body,{childList:true,subtree:true});
    setTimeout(scan,300);
  }

  /* ---------- Number inputs with thousands separators ----------
     Every <input type="number"> is turned into a text box that shows commas (1,025,000)
     and keeps decimals (1.75). Calculator code keeps reading .value as a plain number string. */
  const VDESC=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  function fmtNum(raw){
    let s=String(raw??'').replace(/[^0-9.\-]/g,'');
    if(s==='')return '';
    const neg=s.startsWith('-');s=s.replace(/-/g,'');
    const dot=s.indexOf('.');
    let int=dot>=0?s.slice(0,dot):s, dec=dot>=0?'.'+s.slice(dot+1).replace(/\./g,''):'';
    int=int.replace(/^0+(?=\d)/,'');
    int=int.replace(/\B(?=(\d{3})+(?!\d))/g,',');
    return (neg?'-':'')+(int||(dec?'0':''))+dec;
  }
  function enhanceNumber(el){
    if(el.dataset.dipNum)return;
    el.dataset.dipNum='1';
    const start=VDESC.get.call(el);
    el.type='text';el.setAttribute('inputmode','decimal');el.setAttribute('autocomplete','off');
    Object.defineProperty(el,'type',{configurable:true,get(){return 'number'},set(){}});
    Object.defineProperty(el,'value',{configurable:true,
      get(){return VDESC.get.call(this).replace(/,/g,'')},
      set(v){VDESC.set.call(this,fmtNum(v))}});
    VDESC.set.call(el,fmtNum(start));
  }
  // Reformat while typing, keeping the cursor next to the same digit.
  document.addEventListener('input',e=>{
    const el=e.target;if(!el||!el.dataset||!el.dataset.dipNum)return;
    const cur=VDESC.get.call(el),pos=el.selectionStart??cur.length;
    const before=cur.slice(0,pos).replace(/[^0-9.\-]/g,'').length;
    const next=fmtNum(cur);
    if(next===cur)return;
    VDESC.set.call(el,next);
    let i=0,count=0;while(i<next.length&&count<before){if(/[0-9.\-]/.test(next[i]))count++;i++}
    try{el.setSelectionRange(i,i)}catch(err){}
  },true);
  function enhanceAll(root){(root||document).querySelectorAll('input[type="number"]').forEach(enhanceNumber)}
  enhanceAll();
  new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.matches&&n.matches('input[type="number"]'))enhanceNumber(n);else if(n.querySelectorAll)enhanceAll(n)}})
    .observe(document.documentElement,{childList:true,subtree:true});

  /* ---------- Google tag + Meta Pixel ----------
     Fill in the IDs in assets/tracking.js. Nothing loads while they are blank. */
  const T=window.DIP_TRACKING||{};
  const gIds=[].concat(T.googleTagIds||T.googleTagId||[]).filter(Boolean);
  if(gIds.length){
    const sc=document.createElement('script');sc.async=true;sc.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(gIds[0]);document.head.appendChild(sc);
    window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
    gtag('js',new Date());gIds.forEach(id=>gtag('config',id));
  }
  if(T.metaPixelId){
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',String(T.metaPixelId));fbq('track','PageView');
  }
  function track(name,params,metaStd){
    try{if(window.gtag)gtag('event',name,params||{})}catch(e){}
    try{if(window.fbq){if(metaStd)fbq('track',metaStd,params||{});else fbq('trackCustom',name,params||{})}}catch(e){}
  }
  // Clicks on any Skool community link count as a lead.
  document.addEventListener('click',e=>{
    const a=e.target.closest&&e.target.closest('a[href*="skool.com"]');
    if(a){const where=(a.closest('.dip-cta-top')&&'top')||(a.closest('.dip-cta-bottom')&&'bottom')||(a.closest('.dip-header')&&'header')||'page';
      track('join_community_click',{location:where,page:location.pathname},'Lead');}
  },true);

  window.DIP={CALCS,GROUPS,EMBED,store,href,download,mountHeader,mountSaveBar,mountSticky,mountNext,mountEmail,makePDF,light,legend,VERDICT,esc,ROOT,track,fmtNum,shareLink};
})();
