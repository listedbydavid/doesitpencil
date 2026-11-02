/* Does It Pencil? — shared header, saved-calculations store and save bar.
   Saved calculations live in this browser (localStorage) under one key, shared by every calculator.
   window.DIP is the only global this file defines. */
(function(){
  const KEY='dip:saved:v1';
  const ROOT=document.documentElement.dataset.root||'';
  const CALCS={
    napkin:{name:'Deal Napkin',short:'Deal napkin',path:'deal-napkin/index.html',
      blurb:'The quick flip check. Price, ARV, rehab, hold time and loan terms in; a red, yellow or green verdict out, plus the max offer that makes it a deal.'},
    rental:{name:'Rental Cash Flow',short:'Rental cash flow',path:'rental/index.html',
      blurb:'Does a rental cover its payment? Monthly cash flow after the refi, DSCR, break-even price and rent, and year-1 tax savings from cost segregation.'},
    flip:{name:'Flip vs. Build',short:'Flip vs. build',path:'flip-vs-build/index.html',
      blurb:'Compare up to four exit plans on one property: flip, add ADUs and JADUs, or build and sell on income. Profit, cash needed, break-even and stress tests, with a PDF report.'}
  };
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
        ${Object.entries(CALCS).map(([k,c])=>link(k,c.short,c.path)).join('')}
        ${link('saved','My saved','saved/index.html')}
        <a class="dip-join" href="https://www.skool.com/realestatecheatcodes/about?utm_source=doesitpencil&utm_medium=website&utm_campaign=community_cta&utm_content=header" target="_blank" rel="noopener">Join the community</a>
      </nav>
    </div>`;
    showNotice();
    const upd=()=>{const n=readAll().length;const c=document.getElementById('dip-count');if(c)c.textContent=n?String(n):''};
    upd();store.onChange(upd);
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

  /* Save bar: label + Save / Save as new / New + an "Open saved" picker for this calculator.
     opts: {el, calc, getState(), setState(state), summarize(state)->{headline,detail,tone}, defaultLabel(state), reset()} */
  function mountSaveBar(opts){
    const el=typeof opts.el==='string'?document.getElementById(opts.el):opts.el;
    let currentId=null,dirty=false,savedAt=null;
    el.classList.add('dip-save');
    el.innerHTML=`<input id="dip-label" type="text" placeholder="Name this calculation" aria-label="Calculation name" maxlength="120">
      <button type="button" class="dip-primary" id="dip-save">Save</button>
      <button type="button" id="dip-saveas">Save as new</button>
      <button type="button" id="dip-new">New</button>
      <select id="dip-open" aria-label="Open a saved calculation"></select>
      <span class="dip-status" id="dip-status" aria-live="polite"></span>`;
    const $=id=>el.querySelector('#'+id);
    const label=$('dip-label'),status=$('dip-status'),picker=$('dip-open');
    const time=t=>new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    function setStatus(){
      status.classList.toggle('dirty',dirty&&!!currentId);
      status.textContent=currentId?(dirty?'Unsaved changes since '+time(savedAt):'Saved '+time(savedAt)):'Not saved yet. Name it and select Save to keep it in this browser.';
    }
    function fillPicker(){
      const items=store.list(opts.calc);
      picker.innerHTML=`<option value="">${items.length?'Open saved ('+items.length+')…':'No saved calculations yet'}</option>`+
        items.map(e=>`<option value="${esc(e.id)}" ${e.id===currentId?'selected':''}>${esc(e.label)}${e.summary&&e.summary.headline?' · '+esc(e.summary.headline):''}</option>`).join('')+
        (items.length?`<option value="__manage">Manage saved calculations…</option>`:'');
      picker.disabled=!items.length;
    }
    function setUrl(id){try{const u=new URL(location.href);if(id)u.searchParams.set('open',id);else u.searchParams.delete('open');history.replaceState(null,'',u)}catch(e){}}
    function doSave(asNew){
      const state=opts.getState();
      if(!label.value.trim())label.value=(opts.defaultLabel&&opts.defaultLabel(state))||'Untitled';
      const rec=store.save({id:asNew?null:currentId,calc:opts.calc,label:label.value,state,summary:opts.summarize?opts.summarize(state):null});
      if(!rec){status.textContent='Could not save: this browser is blocking storage (private window or storage turned off).';return}
      currentId=rec.id;savedAt=rec.updatedAt;dirty=false;setUrl(currentId);fillPicker();setStatus();
      const b=$(asNew?'dip-saveas':'dip-save'),t=b.textContent;b.textContent=asNew?'Saved as new':'Saved';setTimeout(()=>b.textContent=t,1200);
    }
    function open(id){
      const e=store.get(id);if(!e)return false;
      opts.setState(clone(e.state));label.value=e.label;currentId=e.id;savedAt=e.updatedAt;dirty=false;setUrl(id);fillPicker();setStatus();return true;
    }
    $('dip-save').onclick=()=>doSave(false);
    $('dip-saveas').onclick=()=>doSave(true);
    $('dip-new').onclick=()=>{opts.reset&&opts.reset();label.value='';currentId=null;dirty=false;setUrl(null);fillPicker();setStatus()};
    label.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doSave(false)}});
    label.addEventListener('input',()=>{if(currentId){dirty=true;setStatus()}});
    picker.onchange=()=>{const v=picker.value;if(v==='__manage'){location.href=ROOT+'saved/index.html';return}if(v)open(v);};
    store.onChange(fillPicker);
    const q=new URLSearchParams(location.search).get('open');
    if(!(q&&open(q))){fillPicker();setStatus()}
    return {changed(){if(currentId&&!dirty){dirty=true;setStatus()}},open,get currentId(){return currentId},get label(){return label.value}};
  }

  window.DIP={CALCS,store,href,download,mountHeader,mountSaveBar,esc,ROOT};
})();
