// Native elements can be used independently. Set .data before or after insertion.
(() => {
  'use strict';
  const paths = {
    bookmark:'<path d="M6.5 4.5h11v15l-5.5-3.7-5.5 3.7z"/>',
    book:'<path d="M3 5.5q4.5-2 9 1 4.5-3 9-1v13q-4.5-2-9 1-4.5-3-9-1zM12 6.5v13"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    diagonal:'<path d="M6 18 18 6M7 6h11v11"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',down:'<path d="m6 9 6 6 6-6"/>',
    clock:'<circle cx="12" cy="12" r="8.3"/><path d="M12 7v5l3 2"/>',
    pin:'<path d="M18.7 10c0 5.2-6.7 10.5-6.7 10.5S5.3 15.2 5.3 10a6.7 6.7 0 1 1 13.4 0Z"/><circle cx="12" cy="10" r="2"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',check:'<path d="m4 12 5 5L20 6"/>',
    grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/>',
    layer:'<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="M20 12H5m6-6-6 6 6 6"/>',
    calendar:'<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 3v5m8-5v5M4 11h16"/>',
    field:'<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14M3 9h3v6H3m18-6h-3v6h3"/><circle cx="12" cy="12" r="2.6"/>',
    chart:'<path d="M3 18 8 12l4 3 9-11M16 4h5v5"/>',
    users:'<circle cx="9" cy="9" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-14a3 3 0 0 1 0 6m2 2q3 1 3 5"/>',
    receipt:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8m-8 4h6"/>'
  };
  const icon = (name) => '<svg aria-hidden="true" class="mp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = n => typeof n === 'number' && Number.isFinite(n);
  const fixed = (n,d=1) => valid(n) ? n.toFixed(d) : '—';
  const pct = n => valid(n) ? Math.round(n*100)+'%' : '—';
  const fmt = (n,u) => valid(n) ? fixed(n,u==='%'?1:2)+(u==='%'?'%':' '+esc(u)) : 'Unavailable';
  const empty = msg => '<p class="mp-empty">'+esc(msg)+'</p>';
  const group = (label,choices,selected,action) => '<div class="mp-seg" role="group" aria-label="'+esc(label)+'">'+choices.map(([id,name])=>'<button type="button" data-'+action+'="'+esc(id)+'" aria-pressed="'+(id===selected)+'">'+(id===selected?'<i class="mp-tab-plate" aria-hidden="true"></i>':'')+esc(name)+'</button>').join('')+'</div>';
  const metrics = items => '<dl class="mp-metrics">'+items.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
  const closeButton = '<button class="mp-icon-btn" type="button" data-close aria-label="Close details">'+icon('close')+'</button>';
  const table = (labels,rows) => '<div class="mp-table-wrap" tabindex="0" role="region" aria-label="Data table, scroll horizontally"><table><thead><tr>'+labels.map(l=>'<th scope="col">'+esc(l)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((c,i)=>'<td data-label="'+esc(labels[i])+'">'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const settle = 'cubic-bezier(.22,.76,.2,1)';
  const running = new Set();
  function animatePart(node, frames, duration, easing = settle) {
    if (!node?.animate || reducedMotion.matches) return;
    const animation = node.animate(frames, {duration, easing});
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) for (const animation of running) animation.finish();
  });

  // Measure relative to the group so a dialog that recentres doesn't move the indicator.
  function tabPositions(host) {
    const positions = new Map();
    for (const plate of host.querySelectorAll('.mp-tab-plate')) {
      const group = plate.closest('.mp-seg');
      const box = plate.getBoundingClientRect(), origin = group.getBoundingClientRect();
      positions.set(group.getAttribute('aria-label'), {left:box.left-origin.left, top:box.top-origin.top,
        width:box.width, height:box.height, plate, choice:plate.parentElement.textContent});
    }
    return positions;
  }
  // Preserve the displayed geometry on a quick second change, including a transition in flight.
  function measureMarks(host) {
    const marks = new Map();
    for (const node of host.querySelectorAll('[data-mark]')) {
      const style = getComputedStyle(node);
      const frame = {};
      for (const property of ['left','width','--mp-arc']) {
        if (node.style.getPropertyValue(property)) frame[property] = style.getPropertyValue(property);
      }
      marks.set(node.dataset.mark, {frame, target:node.getAttribute('style'), moving:node.getAnimations().some(a=>a.playState==='running')});
    }
    return marks;
  }
  const valueSelectors = ['.mp-score','.mp-scorers p','.mp-athlete-value b','.mp-big-count','.mp-keeper-title b','.mp-style-hero h3'];
  function updateMotion(host, oldTabs, oldMarks, oldValues) {
    for (const [name, to] of tabPositions(host)) {
      const from = oldTabs.get(name);
      if (!from || from.choice === to.choice || !to.width || !from.width) continue;
      const offset = 'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+
        (from.width/to.width)+','+(from.height/to.height)+')';
      animatePart(to.plate, [{transform:offset},{transform:'none'}], 230);
    }
    for (const node of host.querySelectorAll('[data-mark]')) {
      const mark = oldMarks.get(node.dataset.mark);
      if (!mark) { node.classList.add('mp-mark-enter'); continue; }
      if (mark.target === node.getAttribute('style') && !mark.moving) continue;
      const from = mark.frame;
      const to = Object.fromEntries(Object.keys(from).map(key=>[key,node.style.getPropertyValue(key)]));
      if (Object.keys(to).length) animatePart(node, [from,to], 330);
    }
    valueSelectors.forEach((selector, i) => {
      const node = host.querySelector(selector);
      if (node && oldValues[i] != null && node.textContent !== oldValues[i]) {
        animatePart(node,[{opacity:.2, transform:'translateY(5px)'},{opacity:1, transform:'none'}],220);
      }
    });
  }

  // Keep the native dialog and focus trap active throughout its short exit.
  const exits = new WeakMap();
  function closeDialog(dlg) {
    if (!dlg.open || exits.has(dlg)) return;
    const effect = animatePart(dlg, [{opacity:getComputedStyle(dlg).opacity,transform:getComputedStyle(dlg).transform},
      {opacity:0,transform:'translateY(6px)'}], 135, 'ease-in');
    if (!effect) { dlg.close(); return; }
    exits.set(dlg,effect);
    dlg.setAttribute('data-leaving','');
    effect.finished.then(() => {
      if (exits.get(dlg) !== effect) return;
      exits.delete(dlg);
      dlg.removeAttribute('data-leaving');
      if (dlg.open) dlg.close();
    }, () => {});
  }
  function showDialog(dlg) {
    if (!dlg.hasAttribute('data-mp-dialog')) {
      dlg.setAttribute('data-mp-dialog','');
      dlg.addEventListener('cancel', e => {e.preventDefault();closeDialog(dlg);});
    }
    exits.get(dlg)?.cancel();
    exits.delete(dlg);
    dlg.removeAttribute('data-leaving');
    if (!dlg.open) dlg.showModal();
  }
  function openDetail(host,title,content,child) {
    const dlg=document.createElement('dialog');
    dlg.className='mp-dialog mp-detail-dialog';
    dlg.setAttribute('aria-label',title);
    dlg.innerHTML='<div class="dialog-head"><h2>'+esc(title)+'</h2>'+closeButton+'</div><div class="dialog-body">'+(content||'')+'</div>';
    if(child) dlg.querySelector('.dialog-body').append(child);
    host.append(dlg);
    dlg.querySelector('[data-close]').onclick=()=>closeDialog(dlg);
    dlg.onclick=e=>{if(e.target===dlg) closeDialog(dlg)};
    dlg.addEventListener('close',()=>dlg.remove(),{once:true});
    showDialog(dlg);
  }
  // The local reports and earlier snapshots share a Chinese vocabulary. Translate
  // display fields once at intake so fixture keys and all consumers use the same names.
  const clubNames = {
    '利物浦':'Liverpool', '曼联':'Manchester United', '曼城':'Manchester City', '布鲁日':'Club Brugge',
    '埃弗顿':'Everton', '阿森纳':'Arsenal', '切尔西':'Chelsea', '热刺':'Tottenham', '纽卡斯尔':'Newcastle United',
    '阿斯顿维拉':'Aston Villa', '布伦特福德':'Brentford', '水晶宫':'Crystal Palace','布莱顿':'Brighton',
    '富勒姆':'Fulham','桑德兰':'Sunderland','诺丁汉森林':'Nottingham Forest','伊普斯维奇':'Ipswich Town',
    '伯恩茅斯':'Bournemouth','利兹联':'Leeds United','南安普顿':'Southampton','伯恩利':'Burnley','西汉姆':'West Ham',
    '狼队':'Wolves','莱斯特城':'Leicester City','波尔图':'Porto'
  };
  const reportTerms = {
    ...clubNames,'英格兰超级联赛':'Premier League','英超':'Premier League',
    '欧冠':'Champions League','联赛杯':'League Cup','足总杯':'FA Cup','安菲尔德':'Anfield','主场':'Home','客场':'Away',
    '下一场':'Next match','赛前预览':'Pre-match preview','北京时间':'UTC+8','主选比分':'Primary score','备选比分':'Alternative score',
    '三场走向':'Three-match outlook','单场状态':'Single-match form','比赛风格':'Match style','红黄牌':'Discipline',
    '传球与推进':'Passing and progression','创造机会':'Chance creation','后场防守与门将':'Defence and goalkeeping',
    '夺回球权':'Ball regains','对抗':'Duels','射门机会':'Shooting chances','赛果':'Result',
    '进球':'Scoring','助攻':'Assists','关键传球':'Key passes','地面抢断':'Tackles','解围与封堵':'Clearances and blocks',
    '门将扑救':'Goals prevented','门线解围':'Goal-line clearances','主备比分人选':'Primary and alternative pick',
    '主选比分人选':'Primary score pick','额外提醒':'On the radar','主选':'Primary pick','备选':'Alternative pick',
    '名单':'Squad','门将':'Goalkeeper','有进球':'Scored','无进球':'No goal','有助攻':'Assisted','无助攻':'No assist',
    '球值':'goals','次':'events','对手控球':'opposition possession','危险进攻':'dangerous attacks',
    '对手黄牌':'opposition bookings','黄牌':'bookings','对手吃牌':'opposition cards','吃牌':'cards','射门':'shots',
    '控球':'possession','对手射门':'opposition shots','对手危险进攻':'opposition dangerous attacks',
    '暂无英超赛程':'No upcoming Premier League fixture'
  };
  const clubPattern=new RegExp(Object.keys(clubNames).join('|'),'g');
  const months='Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function englishText(text,key){
    if(!/[\u3400-\u9fff]/.test(text))return text;
    if(Object.hasOwn(reportTerms,text))return reportTerms[text];
    const date=text.match(/^(\d{1,2}) 月 (\d{1,2}) 日$/);
    if(date)return date[2]+' '+months[Number(date[1])-1];
    if(key==='model' || key==='name' && /BCE|Torch|R4/.test(text))return 'Forecast option';
    if(text.includes('、') || /[多少]$/.test(text)){
      return text.split('、').map(part=>{
        const signal=part.match(/^(.+)(多|少)$/);
        if(!signal)return reportTerms[part]||'Unclassified';
        const name=reportTerms[signal[1]] || (/^[\x20-\x7e]+$/.test(signal[1])?signal[1]:'activity');
        return (signal[2]==='多'?'Higher ':'Lower ')+name;
      }).join(', ');
    }
    const counts=text.match(/^([+\-\d.]+) 次（另记被过 (\d+) 次）$/);
    if(counts)return counts[1]+' tackles (dribbled past '+counts[2]+' times)';
    const measured=text.match(/^([+\-\d.]+) (球值|次)$/);
    if(measured)return measured[1]+' '+reportTerms[measured[2]];
    const fixture=text.replace(clubPattern,word=>clubNames[word]).replace(/对(?=[A-Za-z])/g,'vs ');
    return /[\u3400-\u9fff]/.test(fixture)?'Unavailable':fixture;
  }
  const englishRecords=new WeakSet();
  function englishData(source){
    const copies=new WeakMap();
    function copy(value,key){
      if(typeof value==='string')return englishText(value,key);
      if(!value || typeof value!=='object' || englishRecords.has(value))return value;
      if(copies.has(value))return copies.get(value);
      const result=Array.isArray(value)?[]:{};
      copies.set(value,result);
      englishRecords.add(result);
      for(const [field,item] of Object.entries(value))result[field]=copy(item,field);
      return result;
    }
    return copy(source,'');
  }
  class Widget extends HTMLElement {
    set data(value) {this._data=englishData(value); this.reset(); if(this.isConnected) this.paint();}
    get data() {return this._data;}
    updateLive(value) {
      const nested=this.querySelector('dialog[open]');
      if(nested && value){
        const child=nested.querySelector(':scope > .dialog-body > .mp-widget');
        if(child){
          const kind=child.localName.slice(3);
          if(kind==='trajectory' && child.data.groups && value.groups){
            child.updateLive({...child.data,groups:value.groups,fixtures:value.fixtures||value.matchday?.fixtures});
          }else if(value[kind]){
            child.updateLive(value[kind]);
          }
        }
        this.pendingLive=value;
        if(!this.waitingForClose){
          this.waitingForClose=true;
          nested.addEventListener('close',()=>{
            this.waitingForClose=false;
            if(this.isConnected)this.updateLive(this.pendingLive);
          },{once:true});
        }
        return;
      }
      if(this.activeFixture?.kind==='next')this.fixtureKey=null;
      this._data=englishData(value);
      this.paint();
    }
    reset() {}
    connectedCallback() {
      this.classList.add('mp-widget');
      if (Object.prototype.hasOwnProperty.call(this, 'data')) {
        const pendingData = this.data;
        delete this.data;
        this._data = englishData(pendingData);
        this.reset();
      }
      if(!this._data && this.dataset.props) {try {this._data=englishData(JSON.parse(this.dataset.props));this.reset();} catch {}}
      this.paint();
      if(this._bound) return;
      this._bound=true;
      this.addEventListener('click',e=>{
        const b=e.target.closest('button');
        if(b?.parentElement?.matches('.mp-seg') && b.getAttribute('aria-pressed')==='true') return;
        if(!b || b.closest('.mp-widget')!==this)return;
        if(b.hasAttribute('data-related')){
          const kind=b.dataset.related, child=document.createElement('mp-'+kind);
          child.data=this.data[kind];
          if(kind==='calibration')child.scope=this.localName==='mp-style'?'style':this.localName==='mp-discipline'?'discipline':this.scope;
          if(kind==='archive')child.scope=this.scope;
          if(kind==='matchday'){child.panel='players';child.target=this.target;child.playerModel=this.modelKey;
            child.fixture=child.data.fixtures?.find(f=>sameGame(f,this.activeFixture))?.id;}
          openDetail(this,b.textContent.trim(),'',child);return;
        }
        this.act(b);
      });
    }
    paint() {
      const motion = !reducedMotion.matches && typeof this.animate === 'function';
      const tabs = motion && tabPositions(this), marks = motion && measureMarks(this);
      const values = motion && valueSelectors.map(selector => this.querySelector(selector)?.textContent);
      this.innerHTML = this.data ? this.view() : empty('No data available.');
      const related = this.data?.calibration ? ['calibration','View forecast checks'] :
        this.localName==='mp-review' && this.data?.archive ? ['archive','Browse season archive'] :
        this.data?.matchday && ['mp-defense','mp-keeper','mp-trajectory'].includes(this.localName) ? ['matchday','View all players for this match'] : null;
      if(related && this.firstElementChild?.matches('.mp-sheet')){
        const [kind,label]=related;
        const hide=kind==='matchday' && !this.data.matchday.fixtures?.some(f=>sameGame(f,this.activeFixture) && (f.kind!=='scheduled'||f.id===this.data.matchday.leagueId));
        this.firstElementChild.insertAdjacentHTML('beforeend','<button type="button" '+(hide?'hidden':'')+' class="mp-text-action" data-related="'+kind+'">'+label+' '+icon('arrow')+'</button>');
      }
      if (motion) updateMotion(this,tabs,marks,values);
    }
    refresh(attribute,value) {
      this.paint();
      const button=Array.from(this.querySelectorAll('['+attribute+']')).find(b=>b.getAttribute(attribute)===String(value));
      button?.focus({preventScroll:true});
    }
    act() {}
  }
  function poster(d) {
    return '<div class="mp-poster" aria-hidden="true"><div class="mp-poster-lines"></div><div class="mp-poster-top"><span class="mp-print-mark"></span>'+esc(d.leagueEn)+'</div><div class="mp-poster-type">MATCH<br>DAY<span>.</span></div><div class="mp-football"></div><div class="mp-print-foot"><strong>'+esc(d.homeCode)+'<i>/</i>'+esc(d.awayCode)+'</strong><span>'+esc(d.posterDate)+'</span></div></div>';
  }
  class Match extends Widget {
    reset(){this.pickIndex=0;}
    view() {
      const d=this.data, picks=d.picks||[],i=picks[this.pickIndex]?this.pickIndex:0,p=picks[i];
      if(d.unscheduled)return empty('No upcoming fixture has been announced.');
      const score=p?.score?.length===2?p.score.map(v=>valid(v)?esc(v):'—').join('<em>:</em>'):'—';
      const league=d.matchday?.fixtures.find(f=>f.id===d.matchday.leagueId && f.kind!=='next');
      const leagueLink=league?'<button type="button" class="mp-text-action" data-league>Next in the league · '+esc(league.opponent)+' '+icon('arrow')+'</button>':'';
      return '<article class="mp-match">'+poster(d)+'<div class="mp-match-info"><div class="mp-match-kicker"><span class="mp-status"><b></b>'+esc(d.status)+'</span><span>'+esc(d.league)+'</span></div><h2>'+esc(d.home)+' <i>vs</i> '+esc(d.away)+'</h2><p class="mp-fixture-meta"><span>'+icon('clock')+esc(d.date)+' · '+esc(d.time)+' '+esc(d.zone)+'</span><span>'+icon('pin')+esc(d.location)+'</span></p><div class="mp-score-panel">'+(p?'<div class="mp-score-tabs">'+group('Choose a score prediction',picks.map((p,i)=>[String(i),p.label]),String(i),'pick')+'<strong class="mp-score">'+score+'</strong></div><div class="mp-scorers"><small>Goalscorer picks</small><p>'+((p?.scorers||[]).map(esc).join(' · ')||'No picks available')+'</p></div>':'<p class="mp-note">Score and player predictions are pending for this match.</p>')+'</div><div class="mp-match-actions"><button type="button" class="mp-primary" data-facts>'+(d.matchday?'Open match centre':'Match details')+' '+icon('arrow')+'</button>'+leagueLink+'</div></div></article>';
    }
    act(b) {
      if(b.hasAttribute('data-pick')) {this.pickIndex=Number(b.dataset.pick);this.refresh('data-pick',this.pickIndex);}
      if(b.hasAttribute('data-facts') || b.hasAttribute('data-league')) {
        const d=this.data;
        if(d.matchday){const detail=document.createElement('mp-matchday');detail.data=d.matchday;if(b.hasAttribute('data-league')){detail.followLeague=true;detail.panel='team';}openDetail(this,'Matchday', '',detail);return;}
        const scorers = Object.entries(d.scorerProbabilities || {});
        const probabilities = scorers.length ? '<h3 class="mp-subheading">Chance of scoring</h3>'+table(['Goalscorer picks','Probability'],scorers.map(([name,probability])=>[esc(name),fmt(probability,'%')])) : '';
        openDetail(this,d.home+' vs '+d.away,'<p class="mp-lead">'+esc(d.league)+' · '+esc(d.location)+'</p>'+metrics([['Kick-off',d.date+' '+d.time],['Time zone',d.zone],['Status',d.status]])+table(['Forecast','Score','Goalscorer picks'],(d.picks||[]).map(p=>[esc(p.label),esc(p.score.join(' – ')),(p.scorers||[]).map(esc).join(', ')||'No picks available']))+probabilities+'<p class="mp-note">Scores show Liverpool first.</p>');
      }
    }
  }
  const initials = name => name.split(/\s+/).filter(Boolean).filter((_,i,a)=>i===0||i===a.length-1).map(n=>n[0]).join('');
  const profile = (item,g) => ({player:item,unit:g.unit,label:g.label,model:g.model,fixtureLabel:g.fixtureLabel,nextFixture:g.nextFixture});
  // Store a personal watch by fixture, model, target and player. Counts are never public votes.
  const watchKey = 'match-pulse:player-watches:v1';
  let memoryWatches = new Set();
  function watches() {
    try {
      const values = JSON.parse(localStorage.getItem(watchKey) || '[]');
      if (Array.isArray(values)) memoryWatches = new Set(values.filter(v => typeof v === 'string'));
    } catch {}
    return memoryWatches;
  }

  function routesFor(g) { return [g,...(g.variants || [])]; }
  function activeGroup(base,key) {
    const route=routesFor(base).find(r=>r.modelKey===key) || base;
    return route===base ? base : {...base,...route};
  }
  function playerLog(rows,unit) {
    const cells=[...rows].reverse().map(h=>[
      esc((h.future?'Next match · ':'')+(h.kickoff||h.date)+' vs '+h.opponent),
      fmt(h.estimate,unit)+(valid(h.low)&&valid(h.high)?'<small>80% interval '+fixed(h.low,2)+' to '+fixed(h.high,2)+'</small>':''),
      esc(h.actual??'Pending')]);
    return disclosure('Match-by-match forecasts and results',table(['Match','Forecast','Actual'],cells));
  }
  function forecastOptions(routes, key) {
    return routes.map((route,i)=>[route[key], i===0?'Primary forecast':'Forecast option '+(i+1)]);
  }
  const fixtureKey = f => JSON.stringify([f.date,f.opponent]);
  const sameGame = (a,b) => a && b && a.date===b.date && a.opponent===b.opponent;
  const fixtureStatus = f => f.kind==='next'?'Upcoming':f.kind==='scheduled'?'Scheduled':f.kind==='awaiting'?'Kicked off · Result pending':'Played';
  const fixtureTime = f => f.kickoff?'UTC+8 '+f.kickoff.slice(5):f.date;
  function fixtureRows(f,g) {
    if(!f || (['next','scheduled'].includes(f.kind) && sameGame(f,g.nextFixture))){
      return g.items.filter(p=>valid(p.prediction)).map(p=>({p,value:p.prediction,actual:null,kind:p.kind,low:p.low,high:p.high}));
    }
    if(f.kind!=='played')return [];
    return [...g.items,...(g.pastPlayers||[])].flatMap(p=>{
      const h=p.history?.find(r=>sameGame(r,f)) || p.earlier?.find(r=>sameGame(r,f));
      if(!h)return [];
      return [{p,value:h.estimate,actual:h.actual,kind:null,low:h.low,high:h.high}];
    }).sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity) || String(a.p.id).localeCompare(String(b.p.id)));
  }
  function selectedMatchLabel(f,fallback){return f?(f.competition?f.competition+' · ':'')+(f.home===false?f.opponent+' vs Liverpool':'Liverpool vs '+f.opponent):fallback;}
  function noForecast(f){return 'Player forecasts for the match against '+f.opponent+' are pending.';}

  class FixtureWidget extends Widget {
    reset(){
      this.fixtureKey=null;
      this.initialDate=this.data?.fixtureDate;
      this.initialOpponent=this.data?.fixtureOpponent;
      this.activeFixture=null;
    }
    calendar(g,extra=[]) {
      const saved=this.data.fixtures || this.data.matchday?.fixtures || [];
      const games=new Map();
      const add=f=>{if(f?.date && f.opponent) games.set(fixtureKey(f),f);};
      for(const route of routesFor(g)){
        for(const p of [...(route.items||[]),...(route.pastPlayers||[])]){
          for(const h of p.history||[])add({date:h.date,opponent:h.opponent,kind:'played'});
        }
      }
      for(const rows of Object.values(g.observations||{})){
        for(const r of rows)add({date:r.date,opponent:r.opponent,kind:'played'});
      }
      for(const r of extra)add({date:r.date,opponent:r.opponent,kind:'played'});
      if(g.nextFixture)add({...g.nextFixture,kind:'next'});
      for(const f of saved)add(f);
      this.fixtureList=[...games.values()].sort((a,b)=>a.date.localeCompare(b.date));
      this.activeFixture=games.get(this.fixtureKey) ||
        this.fixtureList.find(f=>f.date===this.initialDate && (!this.initialOpponent || f.opponent===this.initialOpponent)) ||
        this.fixtureList.find(f=>f.kind==='next') || this.fixtureList.at(-1);
      this.initialDate=null;
      this.fixtureKey=this.activeFixture?fixtureKey(this.activeFixture):null;
      return this.activeFixture;
    }
    nav() {
      const f=this.activeFixture;
      if(!f)return '';
      const items=this.fixtureList, idx=items.indexOf(f);
      const step=(dir,label,disabled)=>'<button type="button" data-match-step="'+dir+'" aria-disabled="'+disabled+'">'+(dir<0?icon('chevron'):'')+label+(dir>0?icon('chevron'):'')+'</button>';
      const options=items.map(g=>'<option value="'+esc(fixtureKey(g))+'" '+(g===f?'selected':'')+'>'+esc((g.kickoff||g.date).slice(0,10)+' · vs '+g.opponent)+'</option>').join('');
      return '<div class="mp-fixture-nav" role="group" aria-label="Match navigation">'+step(-1,'Previous match',idx===0)+
        '<label><small data-fixture-stage aria-hidden="true">'+esc(fixtureTime(f))+'</small><span class="mp-fixture-team" aria-hidden="true"><strong>'+esc(fixtureStatus(f)+' · '+f.opponent)+'</strong>'+icon('down')+'</span>'+
        '<select data-player-fixture aria-label="Select match">'+options+'</select></label>'+
        step(1,'Next match',idx===items.length-1)+'</div>';
    }
    fixtureChange(e){
      if(!e.target.matches('[data-player-fixture]') || e.target.closest('.mp-widget')!==this)return false;
      const f=this.fixtureList.find(g=>fixtureKey(g)===e.target.value);
      if(f){this.fixtureKey=fixtureKey(f);this.paint();this.querySelector('[data-player-fixture]')?.focus({preventScroll:true});}
      return true;
    }
    act(b){
      if(!b.hasAttribute('data-match-step'))return false;
      if(b.getAttribute('aria-disabled')!=='true'){
        const next=this.fixtureList.indexOf(this.activeFixture)+Number(b.dataset.matchStep);
        const f=this.fixtureList[next];
        if(f){this.fixtureKey=fixtureKey(f);this.refresh('data-match-step',b.dataset.matchStep);}
      }
      return true;
    }
    syncFixtureNav(h){
      const f=this.fixtureList.find(g=>sameGame(g,h));
      if(!f || f===this.activeFixture)return;
      this.activeFixture=f;this.fixtureKey=fixtureKey(f);
      const nav=this.querySelector('.mp-fixture-nav');
      const related=this.querySelector('[data-related="matchday"]');
      if(related)related.hidden=!this.data.matchday.fixtures.some(game=>sameGame(game,f)&&(game.kind!=='scheduled'||game.id===this.data.matchday.leagueId));
      nav.querySelector('select').value=this.fixtureKey;
      nav.querySelector('[data-fixture-stage]').textContent=fixtureTime(f);
      nav.querySelector('.mp-fixture-team strong').textContent=fixtureStatus(f)+' · '+f.opponent;
      const index=this.fixtureList.indexOf(f);
      nav.querySelector('[data-match-step="-1"]').setAttribute('aria-disabled',String(index===0));
      nav.querySelector('[data-match-step="1"]').setAttribute('aria-disabled',String(index===this.fixtureList.length-1));
    }
  }
  class Players extends FixtureWidget {
    reset() { super.reset(); this.target = this.data?.target; this.modelKey=this.data?.modelKey; this.filter = 'all'; }

    watchId(group, item) {
      return JSON.stringify([group.fixtureId, group.model, this.target, item.id]);
    }

    row(row, group, watched) {
      const {p:item,value,kind,actual}=row;
      const selected = watched.has(this.watchId(group, item));
      const followLabel = selected ? 'Unfollow' : 'Follow';
      const follow = group.fixtureId ? `
        <button type="button" class="mp-follow" data-watch="${esc(item.id)}"
          aria-label="${followLabel} ${esc(item.name)} · ${esc(group.label)}" aria-pressed="${selected}">
          ${icon(selected ? 'check' : 'plus')}<span>${selected ? 'Following' : 'Follow'}</span>
        </button>` : '';
      return `<div class="mp-player-row">
        <button type="button" class="mp-player" data-player="${esc(item.id)}">
          <span class="mp-avatar">${esc(initials(item.name))}</span>
          <span class="mp-player-name"><strong>${esc(item.name)}</strong>
            <small>${esc(kind || 'Match forecast')}${this.activeFixture?.kind==='played'?' · actual '+esc(actual??'Unavailable'):''}</small></span>
          <b>${fmt(value, group.unit)}</b>${icon('chevron')}
        </button>${follow}
      </div>`;
    }

    view() {
      const choices = Object.entries(this.data.groups || this.data).filter(([,g]) => Array.isArray(g?.items));
      if (!choices.length) return empty('No player forecast available.');
      const [key, base] = choices.find(([k]) => k === this.target) || choices[0];
      const g = activeGroup(base,this.modelKey);
      this.modelKey=g.modelKey;
      this.target = key;
      const f=this.calendar(base);
      const roster=fixtureRows(f,g);
      const current=!f || (sameGame(f,g.nextFixture) && ['next','scheduled'].includes(f.kind));
      this.listGroup={...g,fixtureId:current?g.fixtureId:(f.id||fixtureKey(f))};
      this.listRows=roster;
      if(!current && this.filter==='extra')this.filter='all';
      const watched = watches();
      const filter = this.filter || 'all';
      const options = [['all', 'All players']];
      if(current)options.push(['extra','On the radar']);
      if (this.listGroup.fixtureId) options.push(['watch', 'Following']);
      const items = roster.filter(row => {
        if (filter === 'extra') return row.kind === 'On the radar';
        if (filter === 'watch') return watched.has(this.watchId(this.listGroup, row.p));
        return true;
      });
      const optionsHTML = choices.map(([k,v]) =>
        `<option value="${esc(k)}" ${k===key?'selected':''}>${esc(v.label)}</option>`).join('');
      const noRows = f && !roster.length ? noForecast(f) : filter === 'watch' ? 'Follow a player to see them here.' : 'No players match this filter.';
      return `<article class="mp-sheet">
        ${this.nav()}
        <div class="mp-section-top"><div><small class="mp-caption">${esc(selectedMatchLabel(f,g.fixtureLabel || 'Player watch'))}</small><h3>Players to watch</h3></div>
          <label class="mp-select"><span class="sr-only">Prediction type</span>
            <select data-target>${optionsHTML}</select></label></div>
        ${routesFor(base).length>1?selector('listModel','Forecast option',forecastOptions(routesFor(base),'modelKey'),this.modelKey):''}
        ${group('Player filters', options, filter, 'filter')}
        <div class="mp-players">${items.length ? items.map(row => this.row(row,this.listGroup,watched)).join('') : empty(noRows)}</div>
      </article>`;
    }

    connectedCallback() {
      super.connectedCallback();
      this.onchange = e => {
        if(this.fixtureChange(e))return;
        if(e.target.matches('[data-choice="listModel"]') && e.target.closest('.mp-widget')===this){
          this.modelKey=e.target.value;this.paint();this.querySelector('[data-choice="listModel"]').focus({preventScroll:true});return;
        }
        if (!e.target.matches('[data-target]') || e.target.closest('.mp-widget')!==this) return;
        this.modelKey=null;
        this.target = e.target.value;
        this.filter = 'all';
        this.paint();
        this.querySelector('select[data-target]')?.focus();
      };
      this.syncWatches = e => {
        if (e.type === 'storage' && e.key !== watchKey) return;
        this.paint();
      };
      window.addEventListener('storage', this.syncWatches);
      window.addEventListener('mp-watches', this.syncWatches);
    }

    disconnectedCallback() {
      window.removeEventListener('storage', this.syncWatches);
      window.removeEventListener('mp-watches', this.syncWatches);
    }

    act(button) {
      if(super.act(button))return;
      if (button.hasAttribute('data-filter')) {
        this.filter = button.dataset.filter;
        this.refresh('data-filter', this.filter);
        return;
      }
      const group = this.listGroup;
      const id = button.dataset.watch || button.dataset.player;
      const row=this.listRows.find(r=>r.p.id===id);
      const item=row?.p;
      if (!item) return;
      if (button.hasAttribute('data-watch')) {
        const key = this.watchId(group, item), watched = watches();
        if (watched.has(key)) watched.delete(key); else watched.add(key);
        try { localStorage.setItem(watchKey, JSON.stringify([...watched])); } catch {}
        window.dispatchEvent(new Event('mp-watches'));
        const next = [...this.querySelectorAll('[data-watch]')].find(b => b.dataset.watch === id);
        if (next?.getAttribute('aria-pressed') === 'true') next.classList.add('mp-just-saved');
        (next || this.querySelector('[data-filter="watch"]'))?.focus({preventScroll:true});
        return;
      }
      const detail = document.createElement('mp-trajectory');
      const f=this.activeFixture;
      const context={fixtures:this.fixtureList,fixtureDate:f?.date,fixtureOpponent:f?.opponent};
      detail.data=group.items.includes(item)?{...context,groups:this.data.groups||this.data,target:this.target,playerId:item.id,modelKey:group.modelKey}:
        {...context,...profile({...item,historyOnly:true,prediction:row.value},group)};
      openDetail(this, 'Player trends', '', detail);
    }
  }
  function selector(field, label, values, selected) {
    const options = values.map(([value, name]) =>
      `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(name)}</option>`);
    return `<label class="mp-picker"><span>${esc(label)}</span>
      <select data-choice="${field}">${options.join('')}</select></label>`;
  }

  function verdict(hit, kind = 'range') {
    const [tone, symbol, text] = hit === true ? ['good', 'check', kind==='range'?'In range':kind?'Style matched':'Hit']
      : hit === false ? ['miss', 'close', kind==='range'?'Outside range':kind?'Style missed':'Miss'] : ['pending', 'clock', 'Pending'];
    return `<strong class="mp-verdict is-${tone}">${icon(symbol)}${esc(text)}</strong>`;
  }

  // All three explorers use the same fixture, target, model and player selection.
  class PlayerExplorer extends FixtureWidget {
    reset() {
      super.reset();
      this.target = this.data?.target;
      this.modelKey = this.data?.modelKey;
      this.playerId = this.data?.playerId;
      this.point = null;
      this.span = 'season';
    }
    connectedCallback() {
      super.connectedCallback();
      this.onchange = e => {
        if(this.fixtureChange(e))return;
        const name = e.target.dataset.choice;
        if (!['target','modelKey','playerId'].includes(name) || e.target.closest('.mp-widget') !== this) return;
        this[name] = e.target.value;
        if (name === 'target') this.modelKey = null;
        this.point = null;
        this.paint();
        this.querySelector(`[data-choice="${name}"]`)?.focus({preventScroll:true});
      };
    }
    selection() {
      const groups = this.data.groups || {};
      const targets = Object.entries(groups).filter(([,g]) => Array.isArray(g?.items));
      if (!targets.length) return null;
      const [target, base] = targets.find(([key]) => key === this.target) || targets[0];
      const models = [base, ...(base.variants || [])];
      const route = models.find(m => m.modelKey === this.modelKey) || base;
      const archived=(route.pastPlayers||[]).filter(p=>p.id===this.playerId ||
        p.history?.some(h=>fixtureKey(h)===this.fixtureKey || (this.initialDate && h.date===this.initialDate && (!this.initialOpponent || h.opponent===this.initialOpponent))));
      const items=[...route.items,...archived.map(p=>({...p,historyOnly:true}))];
      const player = items.find(p => p.id === this.playerId) || items[0];
      this.target = target;
      this.modelKey = route.modelKey;
      this.playerId = player?.id;
      return {targets, target, base, models, route, items, player};
    }
    controls(selection, showPlayer = true) {
      const {targets, target, models, route, items, player} = selection;
      const fields = [];
      if (targets.length > 1) fields.push(selector('target', 'Prediction type', targets.map(([k,g]) => [k,g.label]), target));
      if (showPlayer && items.length) fields.push(selector('playerId', 'Players', items.map(p => [p.id,p.name]), player.id));
      if (models.length > 1) fields.push(selector('modelKey', 'Forecast option', forecastOptions(models,'modelKey'), route.modelKey));
      return fields.length ? `<div class="mp-pickers">${fields.join('')}</div>` : '';
    }
    openTrajectory() {
      const el = document.createElement('mp-trajectory');
      el.data = {groups:this.data.groups, fixtures:this.fixtureList,fixtureDate:this.activeFixture?.date,fixtureOpponent:this.activeFixture?.opponent,target:this.target, modelKey:this.modelKey, playerId:this.playerId};
      openDetail(this, 'Player trends', '', el);
    }
  }

  // A version change or missing value ends a series. A singleton remains visible as a point.
  function lineChart(history, selected, unit, compact) {
    const keys = unit === '%' ? ['estimate'] : ['estimate','observed'];
    const nums = history.flatMap(h => keys.map(key => h[key]).filter(valid));
    const ceiling = Math.max(0,...nums), floor = Math.min(0,...nums);
    const span = Math.max(ceiling-floor, unit === '%' ? 5 : 1);
    const magnitude = 10 ** Math.floor(Math.log10(span));
    const step = [0.2,0.5,1,2,5].map(n => n*magnitude).find(n => span/n <= 4) || magnitude;
    const lower = Math.floor(floor/step)*step;
    const upper = Math.max(lower+step, Math.ceil(ceiling/step)*step);
    const width = compact ? 360 : 640;
    const firstX = compact ? 40 : 48, lastX = width - (compact ? 24 : 46);
    const x = i => history.length === 1 ? (firstX+lastX)/2 : firstX + (lastX-firstX)*i/(history.length-1);
    const y = v => 148 - 126*(v-lower)/(upper-lower);
    const ticks = [];
    for (let t = lower; t <= upper + step*0.001; t += step) {
      const v = Number(t.toFixed(3));
      ticks.push(`<line x1="${firstX-7}" x2="${lastX+10}" y1="${y(v)}" y2="${y(v)}" class="mp-gridline"/>
        <text x="${firstX-14}" y="${y(v)+4}" text-anchor="end">${v}${unit==='%'?'%':''}</text>`);
    }
    function series(key) {
      let path = '', nodes = '';
      history.forEach((h,i) => {
        const v = h[key];
        if (!valid(v)) return;
        const prev = history[i-1];
        const join = prev && valid(prev[key]) && h.version != null && prev.version === h.version;
        const px=x(i), py=y(v);
        path += `${join?'L':'M'}${px.toFixed(2)} ${py.toFixed(2)} `;
        nodes += key==='observed' ? `<rect x="${px-3}" y="${py-3}" width="6" height="6"/>`
          : `<circle cx="${px}" cy="${py}" r="${key==='estimate' ? 3.3 : 2.3}"/>`;
      });
      return `<g class="mp-series is-${key}"><path d="${path}"/>${nodes}</g>`;
    }
    const labels = {estimate:'Match forecast',observed:'Actual'};
    const legend = keys.map(key=>`<span><i class="mp-key is-${key}"></i>${labels[key]}</span>`).join('');
    const dateIndices = [...new Set([0,Math.floor((history.length-1)/2),history.length-1])];
    const axis = dateIndices.map(i=>`<text x="${x(i)}" y="175" text-anchor="middle">${esc(history[i].future?'Next match':history[i].date.slice(5))}</text>`).join('');
    const current = history[selected];
    const cross = `<g class="mp-chart-probe" style="transform:translateX(${x(selected)}px)">
      <line class="mp-cross" x1="0" x2="0" y1="10" y2="150"/>
      <g class="mp-probe-dot" style="transform:translateY(${valid(current.estimate)?y(current.estimate):0}px)" visibility="${valid(current.estimate)?'visible':'hidden'}">
        <circle class="mp-probe-halo" r="10"/><circle class="mp-probe-core" r="4.5"/></g></g>`;
    const buttons = history.map((h,i) => {
      const left = i===0 ? firstX-8 : (x(i-1)+x(i))/2, right=i===history.length-1 ? lastX+11 : (x(i)+x(i+1))/2;
      return `<button type="button" class="${h.future?'mp-future-point':''}" data-point="${i}" data-x="${x(i)}" data-y="${valid(h.estimate)?y(h.estimate):''}" tabindex="${i===selected?0:-1}" aria-pressed="${i===selected}"
        aria-label="${esc(h.date+' vs '+h.opponent+', forecast '+fmt(h.estimate,unit)+', actual '+(h.actual??'Pending'))}"
        style="left:${left/width*100}%;width:${(right-left)/width*100}%"></button>`;
    }).join('');
    const dots = unit==='%' ? history.map((h,i) => {
      if (h.future) return '';
      const fill = valid(h.observed) ? (h.observed > 0 ? '#00796f' : 'white') : '#ddd4d6';
      return `<circle cx="${x(i)}" cy="198" r="4" fill="${fill}" stroke="${valid(h.observed)?'#0b5d56':'#b5a7ab'}"/>`;
    }).join('') : '';
    return `<div class="mp-linechart"><div class="mp-legend">${legend}</div>
      <div class="mp-plot" style="--mp-probe-x:${x(selected)/width*100}%">
      <div class="mp-probe-tip" data-locked aria-hidden="true"><i></i><span>${esc(current.future?'Next match':current.date.slice(5))}</span><b>${fmt(current.estimate,unit)}</b></div>
      <svg viewBox="0 0 ${width} ${unit==='%'?212:186}" role="img" aria-label="Forecasts and results by match, in ${esc(unit)}">
      ${history.at(-1).future?`<rect class="mp-future-lane" x="${x(history.length-1)-12}" y="8" width="24" height="147" rx="5"/>`:''}${ticks.join('')}${keys.map(series).join('')}${axis}${dots}${cross}</svg>
      <div class="mp-hit-columns" role="group" aria-label="Select a match. Use the arrow keys to move, or Home and End to jump to the first or last match.">${buttons}</div></div>
      <div class="mp-chart-footer">
        ${unit==='%'?'<div class="mp-event-key"><span><i></i>Occurred</span><span><i></i>Did not occur</span></div>':''}
        <div class="mp-chart-stepper" role="group" aria-label="Match history">
          <button type="button" data-step="-1" aria-label="Previous chart point" aria-disabled="${selected===0}">${icon('chevron')}</button>
          <span><b>${selected+1}</b> / ${history.length} matches</span>
          <button type="button" data-step="1" aria-label="Next chart point" aria-disabled="${selected===history.length-1}">${icon('chevron')}</button>
        </div>
      </div><span class="sr-only" role="status" data-point-status></span></div>`;
  }

  class Trajectory extends PlayerExplorer {
    view() {
      const selection=this.selection();
      const data=selection?.player?profile(selection.player,{...selection.base,model:selection.route.model}):this.data;
      const {player:p,unit,nextFixture}=data;
      if(!p)return empty('No player records available.');
      const season=p.history||[], earlier=p.earlier||[];
      if(earlier.some(h=>h.date===this.initialDate))this.span='all';
      const f=this.calendar(selection?.base||{items:[p],nextFixture},this.span==='all'?earlier:[]);
      const five=season.slice(-5);
      if(this.span==='five' && season.some(h=>sameGame(h,f)) && !five.some(h=>sameGame(h,f)))this.span='season';
      const played=this.span==='all'?[...earlier,...season]:this.span==='five'?five:season;
      const future=nextFixture?.date && !p.historyOnly && valid(p.prediction)?{...nextFixture,future:true,estimate:p.prediction,
        low:p.low,high:p.high,actual:'Awaiting result',observed:null,version:null}:null;
      const history=future?[...played,future]:played;
      const index=history.findIndex(h=>sameGame(h,f));
      const h=history[index];
      const observation=f?.kind==='played'?selection?.base.observations?.[p.id]?.find(r=>sameGame(r,f)):null;
      const ranges=[['season','This season']];
      if(season.length>5)ranges.push(['five','Last 5 matches']);
      if(earlier.length)ranges.push(['all','All records']);
      this.historyShown=history;this.unitShown=unit;this.profileShown=data;
      this.point=index>=0?index:history.length-1;this.displayedPoint=this.point;
      const explanation=f?.kind==='played'?'No forecast for this player in the selected match.':f?noForecast(f):'No match forecasts recorded.';
      return `<article class="mp-sheet mp-explorer">
        ${this.nav()}${selection?this.controls(selection):''}
        <div data-fixture-summary>${this.playerSummary(f,h,observation)}</div>
        <div class="mp-chart-head"><h4>Forecast history</h4>${ranges.length>1?group('Chart period',ranges,this.span,'span'):''}</div>
        ${h?'':'<p class="mp-note" data-chart-note>'+esc(explanation)+'</p>'}
        ${history.length?lineChart(history,this.point,unit,this.compactChart)+'<div class="mp-match-readout">'+this.readout(history[this.point])+'</div>':''}
        ${future?'<button type="button" data-jump-next '+(f?.kind==='next'?'hidden':'')+' class="mp-text-action">Jump to next forecast · vs '+esc(future.opponent)+' '+icon('arrow')+'</button>':''}
        ${history.length?playerLog(history,unit):''}
      </article>`;
    }
    playerSummary(f,h,observation){
      const {player:p,unit,label,fixtureLabel}=this.profileShown;
      const value=f?h?.estimate:p.prediction;
      const actual=h?.actual??(valid(observation?.value)?fmt(observation.value,unit):'Unavailable');
      return `<div class="mp-athlete-head"><div><span class="mp-caption">${esc([selectedMatchLabel(f,fixtureLabel),label].filter(Boolean).join(' · '))}</span>
        <h3>${esc(p.name)}</h3></div><div class="mp-athlete-value"><small>${f?.kind==='next'?'Next forecast':'Match forecast'}</small><b>${fmt(value,unit)}</b></div></div>
        ${f?.kind==='played'?'<p class="mp-note">Match result <b>'+esc(actual)+'</b></p>':''}`;
    }
    readout(h) {
      return `<div><time>${h.future?'Next match · UTC+8 '+esc(h.kickoff||h.date):esc(h.date)}</time><strong>vs ${esc(h.opponent)}</strong></div>
        ${metrics([['Pre-match forecast',h.future&&!valid(h.estimate)?'Not published':fmt(h.estimate,this.unitShown)],['Result',h.actual??'Pending']])}`;
    }
    displayPoint(index) {
      const h = this.historyShown?.[index];
      if (!h) return;
      const button = this.querySelector('[data-point="'+index+'"]');
      const plot = button.closest('.mp-plot'), tip = plot.querySelector('.mp-probe-tip');
      tip.toggleAttribute('data-locked', index === this.point);
      if (this.displayedPoint === index) return;
      this.displayedPoint = index;
      const {x,y} = button.dataset;
      plot.style.setProperty('--mp-probe-x', (Number(x)/plot.querySelector('svg').viewBox.baseVal.width*100)+'%');
      plot.querySelector('.mp-chart-probe').style.transform = 'translateX('+x+'px)';
      const dot = plot.querySelector('.mp-probe-dot');
      dot.setAttribute('visibility', y === '' ? 'hidden' : 'visible');
      if (y !== '') dot.style.transform = 'translateY('+y+'px)';
      tip.querySelector('span').textContent = h.future?'Next match':h.date.slice(5);
      tip.querySelector('b').textContent = fmt(h.estimate,this.unitShown);
      this.querySelector('.mp-match-readout').innerHTML = this.readout(h);
    }
    connectedCallback() {
      this.compactChart = (this.clientWidth || window.innerWidth) <= 520;
      super.connectedCallback();
      this.chartSize = new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width, compact = width <= 520;
        if (!width || compact === this.compactChart) return;
        this.compactChart = compact;
        const chart = this.querySelector('.mp-linechart');
        if (!chart) return;
        const active = document.activeElement;
        const control = chart.contains(active) && ['data-point','data-step'].find(key=>active.hasAttribute(key));
        this.displayPoint(this.point);
        chart.outerHTML = lineChart(this.historyShown,this.point,this.unitShown,compact);
        if (control) this.querySelector('['+control+'="'+active.getAttribute(control)+'"]')?.focus({preventScroll:true});
      });
      this.chartSize.observe(this);
      this.onpointerover = e => {
        if (e.pointerType === 'mouse' && e.target.matches('[data-point]')) this.displayPoint(Number(e.target.dataset.point));
      };
      this.onpointerout = e => {
        if (e.pointerType === 'mouse' && e.target.matches('[data-point]') && !(e.relatedTarget?.matches?.('[data-point]') && e.relatedTarget.closest('.mp-plot') === e.target.closest('.mp-plot'))) this.displayPoint(this.point);
      };
      this.onkeydown = e => {
        if (!e.target.matches('[data-point]') || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        const buttons=[...this.querySelectorAll('[data-point]')];
        const i=e.key==='Home'?0:e.key==='End'?buttons.length-1:Number(e.target.dataset.point)+(e.key==='ArrowLeft'?-1:1);
        const next = buttons[Math.max(0, Math.min(buttons.length-1,i))];
        this.act(next);
        next.focus({preventScroll:true});
      };
    }
    disconnectedCallback() {
      this.chartSize?.disconnect();
    }
    act(b) {
      if(super.act(b))return;
      if (b.hasAttribute('data-jump-next')) {
        const next=this.fixtureList.find(f=>sameGame(f,this.profileShown.nextFixture));
        if(next){this.fixtureKey=fixtureKey(next);this.paint();this.querySelector('[data-player-fixture]')?.focus({preventScroll:true});}
        return;
      }
      if (b.hasAttribute('data-step')) {
        if (b.getAttribute('aria-disabled') === 'true') return;
        const next = this.point + Number(b.dataset.step);
        this.act(this.querySelector('[data-point="'+next+'"]'));
        return;
      }
      if (b.hasAttribute('data-span')) {
        this.span=b.dataset.span;
        if(this.span==='five' && !this.profileShown.player.history?.slice(-5).some(h=>sameGame(h,this.activeFixture)))this.fixtureKey=null;
        this.refresh('data-span',this.span);
      }
      if (b.hasAttribute('data-point')) {
        const previous = this.querySelector('[data-point][aria-pressed="true"]');
        if (previous) { previous.tabIndex = -1; previous.setAttribute('aria-pressed','false'); }
        this.point = Number(b.dataset.point);
        b.tabIndex = 0;
        b.setAttribute('aria-pressed','true');
        this.displayPoint(this.point);
        const h=this.historyShown[this.point];
        this.syncFixtureNav(h);
        this.querySelector('[data-chart-note]')?.remove();
        const jump=this.querySelector('[data-jump-next]');
        if(jump)jump.hidden=this.activeFixture?.kind==='next';
        this.querySelector('[data-fixture-summary]').innerHTML=this.playerSummary(this.activeFixture,h);
        this.querySelector('.mp-chart-stepper b').textContent = String(this.point+1);
        this.querySelector('[data-step="-1"]').setAttribute('aria-disabled',String(this.point===0));
        this.querySelector('[data-step="1"]').setAttribute('aria-disabled',String(this.point===this.historyShown.length-1));
        this.querySelector('[data-point-status]').textContent = b.getAttribute('aria-label');
      }
    }
  }
  class Form extends Widget {
    reset(){this.scope='single';}
    view(){
      const scope=this.scope||'single', r=this.data[scope], styles=this.data.styles||[];
      const tabs=group('Forecast horizon',[['single','Single-match form'],['three','Three-match outlook']],scope,'scope');
      if(!r)return '<article class="mp-sheet">'+tabs+empty('No forecast for this horizon.')+'</article>';
      const [low,high]=r.window||[],point=r.point;
      return '<article class="mp-sheet"><div class="mp-section-top"><div><small class="mp-caption">Team form forecast</small><h3>'+esc((r.fixtures||[]).map(f=>f.opponent).join(' / '))+'</h3></div>'+tabs+'</div>'+metrics([['Pre-match forecast',valid(point)?point+' / 100':'—'],['Forecast range',valid(low)&&valid(high)?low+'–'+high+' pts':'—'],['Confidence',pct(r.confidence)]])+'<div class="mp-range" aria-hidden="true">'+(valid(low)&&valid(high)?'<i data-mark="form-interval" style="left:'+low+'%;width:'+(high-low)+'%"></i>':'')+(valid(point)?'<b data-mark="form-point" style="left:'+point+'%"></b>':'')+'</div><div class="mp-axis"><span>0</span><span>50</span><span>100</span></div><p class="mp-note">Confidence is the estimated chance that the '+(scope==='three'?'three-match average':'final score')+' falls inside the forecast range.</p>'+ '<p class="mp-note">'+(r.locked_at?'Locked before kick-off':'Pre-match preview · Provisional')+'</p>'+formTrend(this.data.trend,r,scope)+(styles.length?'<details class="mp-disclosure"><summary>Style forecast '+icon('down')+'</summary>'+styles.slice(0,scope==='three'?3:1).map(s=>'<p><strong>'+esc(s.opponent)+'</strong> · '+esc(s.label)+'<small>Style confidence '+pct(s.confidence)+'</small></p>').join('')+'</details>':'')+'</article>';
    }
    act(b){if(b.hasAttribute('data-scope')){this.scope=b.dataset.scope;this.refresh('data-scope',this.scope);}}
  }
  function scoreExplanation(scope, hasSubtotals=false) {
    const method = hasSubtotals
      ? 'The total is the sum of the category scores. Each subtotal and the total are rounded to one decimal place.'
      : 'redadv combines results, shooting chances, chance creation, passing and progression, duels, regains, and defending and goalkeeping into a weighted score out of 100.';
    return '<p>'+method+(scope==='three'?' The three-match score is the average of the three match totals.':'')+'</p>'+
      '<p>For match reports, results and statistics, visit '+
      '<a href="https://www.premierleague.com/en/stats" target="_blank" rel="noopener noreferrer">Premier League Stats</a>, '+
      '<a href="https://www.liverpoolfc.com/matches/mens-team/results" target="_blank" rel="noopener noreferrer">Liverpool FC Results</a> or '+
      '<a href="https://www.api-football.com/" target="_blank" rel="noopener noreferrer">API-Football</a>.</p>';
  }
  function scoreMethod(scope) {
    return disclosure('How is the score calculated?',scoreExplanation(scope));
  }
  function scoreCell(value, index) {
    if (!valid(value)) return 'Pending';
    return '<b>'+pointText(value)+'</b><button type="button" class="mp-text-btn mp-score-link" data-score-basis="'+index+'" aria-haspopup="dialog">View score breakdown</button>';
  }
  function openScoreBasis(host, fixture, total, subtotals) {
    const label=host.scope==='three'?'three-match average':'Actual total';
    const rows=(subtotals || []).filter(g=>g?.label && valid(g.points) && valid(g.weight));
    const breakdown=rows.length
      ? '<h3>'+(host.scope==='three'?'Three-match category averages':'Category totals')+'</h3><dl class="mp-basis-breakdown">'+
        rows.map(g=>'<div><dt>'+esc(g.label)+'</dt><dd><strong>'+fixed(g.points)+'</strong> / '+esc(g.weight)+' pts</dd></div>').join('')+'</dl>'
      : '<p class="mp-note">Category totals are unavailable for this match.</p>';
    openDetail(host,'Score breakdown','<section class="mp-score-basis"><p class="mp-lead">'+esc(fixture)+'</p>'+
      '<p class="mp-basis-total">'+label+' <strong>'+fixed(total)+'</strong> / 100 pts</p>'+
      breakdown+scoreExplanation(host.scope,rows.length>0)+'</section>');
  }
  class Review extends Widget {
    reset(){this.scope='single';}
    view(){
      const scope=this.scope||'single',rows=this.data[scope]||[];
      const cells=rows.map((r,i)=>[esc(r.fixtures.map(f=>(f.kickoff||f.date).slice(5,10)+' vs '+f.opponent).join(' / '))+'<small>'+esc(r.scoreline||'')+'</small>',
        esc(r.lockedLabel),'<b>'+esc(r.point??'—')+'</b><small>'+esc(r.window?.join('–')||'—')+'</small>',pct(r.confidence),
        scoreCell(r.actual,i),verdict(r.hit)]);
      return '<article class="mp-sheet"><div class="mp-section-top"><div><small class="mp-caption">Forecast vs result</small><h3>'+esc(scope==='single'?'Single-match form':'Three-match form')+'</h3></div>'+group('Review horizon',[['single','Single match'],['three','Three matches']],scope,'scope')+'</div>'+
        (rows.length?table(['Match','Pre-match lock','Forecast / range','Confidence',scope==='three'?'three-match average':'Actual total','Outcome'],cells):empty('No pre-match records yet.'))+
        '<p class="mp-note">Lock times are in UTC+8. Each result is checked against the range saved before kick-off.</p></article>';
    }
    act(b){
      if(b.hasAttribute('data-score-basis')){
        const row=this.data[this.scope][Number(b.dataset.scoreBasis)];
        openScoreBasis(this,fixturesText(row.fixtures),row.actual,row.subtotals);
      }else if(b.dataset.scope){this.scope=b.dataset.scope;this.refresh('data-scope',this.scope);}
    }
  }
  const bound = value => Math.max(0, Math.min(100, value));
  const signed = n => valid(n) ? (n > 0 ? '+' : '') + n.toFixed(2) : '—';

  class Defense extends PlayerExplorer {
    view() {
      const selection = this.selection();
      if (!selection?.player) return empty('No defender records available.');
      const {base,player:p,target} = selection;
      const f=this.calendar(base),g=activeGroup(base,this.modelKey);
      const rows=fixtureRows(f,g);
      const row=rows.find(r=>r.p.id===p.id);
      const candidates=rows.filter(r=>valid(r.value)).sort((a,b)=>b.value-a.value);
      const plotted=candidates.slice(0,4);
      if(row && !plotted.includes(row) && valid(row.value))plotted.push(row);
      const max=Math.max(1,Math.ceil(Math.max(...plotted.map(r=>r.value))));
      const bars=plotted.map(({p:item,value})=>{
        return `<button type="button" class="mp-ranking-row" data-rank-player="${esc(item.id)}" aria-pressed="${item.id===p.id}">
          <span>${esc(item.name)}</span><span class="mp-ranking-track"><b data-mark="estimate-${esc(item.id)}" style="width:${bound(value/max*100)}%"></b></span>
          <strong>${fixed(value,2)}</strong></button>`;
      }).join('');
      const observations = base.observations?.[p.id];
      const past=f?.kind==='played';
      const recent=past?observations?.find(r=>sameGame(r,f)):observations?.[0]||p.history?.at(-1);
      const measured=valid(recent?.value)?recent.value+' events'+(valid(recent.beaten)?' (dribbled past '+recent.beaten+' times)':''):null;
      const recentValue=past?(row?.actual??measured??'Unavailable'):(measured??recent?.actual??'Unavailable');
      const actualLog = observations?.length ? table(
        target === 'tackles' ? ['Match','Tackles won','Dribbled past'] : ['Match','Clearances and blocks'],
        observations.map(r => {
          const cells=[esc(r.date+' vs '+r.opponent),esc(r.value)+' events'];
          if(target === 'tackles') cells.push(valid(r.beaten) ? esc(r.beaten)+' events' : 'Unavailable');
          return cells;
        })) : empty('No observations recorded for this player this season.');
      return `<article class="mp-sheet mp-explorer mp-defense">
        ${this.nav()}${this.controls(selection)}
        <div class="mp-focus-band"><div><span class="mp-caption">${esc(selectedMatchLabel(f,base.fixtureLabel))} · ${esc(base.label)}</span>
          <h3>${esc(p.name)}</h3><p>${valid(row?.value)?(past?'Pre-match forecast: ':'If selected: ')+(target==='tackles'?'tackles':'clearances and shot blocks'):'No forecast for this player in this match.'}</p></div>
          <div class="mp-big-count">${fixed(row?.value,2)}<small> events</small></div></div>
        <div class="mp-chart-head"><h4>Player comparison</h4><span class="mp-caption">Unit · events</span></div>
        <div class="mp-legend"><span><i class="mp-key is-defense"></i>Match forecast</span></div>
        <div class="mp-rank-chart">${bars || empty(f?noForecast(f):'No player forecasts available.')}</div>
        <div class="mp-def-detail">${metrics([[past?'Match result':'Last observed',recentValue],['Match',past?f.date.slice(5)+' vs '+f.opponent:recent?recent.date.slice(5)+' vs '+recent.opponent:'Unavailable']])}</div>
        <button type="button" data-path class="mp-primary">Explore match history ${icon('arrow')}</button>
        ${base.markers ? disclosure(base.markers.label+' records',base.markers.rows.some(r=>r.id===p.id)?table(['Date','Opponent'],base.markers.rows.filter(r=>r.id===p.id).map(r=>[esc(r.date),esc(r.opponent)])):empty('No recorded events for this player.')) : ''}
        ${observations ? `<details class="mp-disclosure"><summary>Season observations · ${observations.length} matches ${icon('down')}</summary>${actualLog}</details>` : ''}
      </article>`;
    }
    act(b) {
      if(super.act(b))return;
      if(b.hasAttribute('data-path')) this.openTrajectory();
      if(b.hasAttribute('data-rank-player')) {this.playerId=b.dataset.rankPlayer;this.refresh('data-rank-player',this.playerId);}
    }
  }

  class Keeper extends PlayerExplorer {
    view() {
      const selection = this.selection();
      if (!selection?.player) return empty('No goalkeeper forecasts available.');
      const {base,items,player:p} = selection;
      const f=this.calendar(base),g=activeGroup(base,this.modelKey);
      const rows=fixtureRows(f,g),row=rows.find(r=>r.p.id===p.id);
      const past=f?.kind==='played';
      const buttons = group('Select goalkeeper',items.map(i=>[i.id,i.name]),p.id,'keeper');
      const radius = Math.max(1,Math.ceil(Math.max(...rows.flatMap(r=>[r.low,r.high,r.value]).filter(valid).map(Math.abs))));
      const pos = n => bound(50 + n*50/radius);
      const interval = valid(row?.low) && valid(row?.high);
      const latest = base.observations?.[p.id] || [];
      const observed=latest.find(r=>sameGame(r,f));
      const actual=row?.actual??(valid(observed?.value)?signed(observed.value)+' goals':'Unavailable');
      const obsMax = Math.max(1,...latest.map(row=>Math.abs(row.value)).filter(valid));
      const logs = latest.map(row=>`<div class="mp-save-line"><span>${esc(row.date.slice(5))} · ${esc(row.opponent)}</span>
        <div class="mp-diverge">${valid(row.value)?`<i class="${row.value<0?'is-left':'is-right'}"
           style="width:${Math.abs(row.value)/obsMax*48}%"></i>`:''}</div><b>${signed(row.value)}</b></div>`).join('');
      const meaning = !valid(row?.value)?'Awaiting a forecast for this match.':Math.abs(row.value)<0.005?'Expected goals conceded match the quality of shots on target.':
        (past?'Pre-match forecast: ':'Over a full match: ')+(row.value>0?'prevent ':'concede ')+'about '+fixed(Math.abs(row.value),2)+' goals relative to shot quality.';
      return `<article class="mp-sheet mp-explorer mp-keeper">
        ${this.nav()}<div class="mp-goal-controls">${buttons}${this.controls(selection,false)}</div>
        <div class="mp-keeper-stage"><span class="mp-caption">${esc(selectedMatchLabel(f,base.fixtureLabel))} · Non-penalty goals prevented</span>
          <div class="mp-keeper-title"><h3>${esc(p.name)}</h3><b>${signed(row?.value)}<small> goals</small></b></div><p>${esc(meaning)}</p>
          ${interval || valid(row?.value) ? `<div class="mp-interval"><span></span>
            ${interval?`<i data-mark="keeper-interval" style="left:${pos(row.low)}%;width:${Math.max(0,pos(row.high)-pos(row.low))}%"></i>`:''}
            ${valid(row?.value)?`<b data-mark="keeper-point" style="left:${pos(row.value)}%"></b>`:''}</div>
          <div class="mp-scale"><span>−${radius} more conceded</span><span>0</span><span>more prevented +${radius}</span></div>
          <div class="mp-interval-note"><i></i>80% empirical interval <strong>${interval ? signed(row.low)+' to '+signed(row.high) : 'Interval unavailable'}</strong></div>` : '<p class="mp-interval-note">No forecast interval is available for this match.</p>'}
          ${past?'<div class="mp-fixture-actual">Match result <b>'+esc(actual)+'</b></div>':''}
        </div>
        <div class="mp-chart-head"><h4>Goals prevented by match</h4><small>This season · ${latest.length} matches</small></div>
        ${logs || empty('No qualifying observations yet this season.')}
        <p class="mp-note">Positive values mean fewer goals conceded than expected from the shots faced. Negative values mean more goals conceded.</p>
        <button type="button" data-path class="mp-text-action">Explore forecast history ${icon('arrow')}</button>
      </article>`;
    }
    act(b) {
      if(super.act(b))return;
      if (b.hasAttribute('data-keeper')) {this.playerId=b.dataset.keeper;this.refresh('data-keeper',this.playerId);}
      if (b.hasAttribute('data-path')) this.openTrajectory();
    }
  }

  const matchesAhead=n=>n+' '+(n===1?'match':'matches')+' ahead';
  function styleSignals(label) {
    if (!label) return empty('Style unavailable');
    return `<ul class="mp-signals">${label.split(',').map(word=>word.trim()).filter(Boolean).map(word=>{
      const signal=word.match(/^(Higher|Lower) (.+)$/i);
      if(!signal) return `<li>${esc(word)}</li>`;
      const up=signal[1].toLowerCase()==='higher';
      return `<li><span>${esc(signal[2])}</span><b><i aria-hidden="true">${up?'↑':'↓'}</i>${up?'Higher':'Lower'}</b></li>`;
    }).join('')}</ul>`;
  }

  class Style extends Widget {
    reset() {this.mode='next';this.fixture=0;this.record=0;}
    connectedCallback(){
      super.connectedCallback();
      this.onchange=e=>{
        if(!e.target.matches('[data-style-record]')) return;
        this.record=Number(e.target.value);this.paint();this.querySelector('[data-style-record]')?.focus();
      };
    }
    view() {
      const {forecasts=[],reviews=[]}=this.data, mode=this.mode||'next';
      const title = `<div class="mp-section-top"><h3>${mode==='next'?'Next three fixtures':'Forecast vs observed style'}</h3>${group('Style records',[['next','Pre-match forecast'],['history','Post-match review']],mode,'mode')}</div>`;
      if (mode==='history') {
        const row=reviews[this.record||0];
        const picker = `<label class="mp-picker"><span>Locked records</span><select data-style-record>${reviews.map((r,i)=>
          `<option value="${i}" ${i===(this.record||0)?'selected':''}>${esc(r.date+' vs '+r.opponent+' · '+matchesAhead(r.horizon))}</option>`).join('')}</select></label>`;
        return `<article class="mp-sheet mp-explorer">${title}${row?picker+
          `<div class="mp-style-compare"><section><small>Predicted style</small><b>${esc(row.label||'Unavailable')}</b><span>Style confidence ${pct(row.confidence)}</span></section>
          <section><small>Observed style</small><b>${esc(row.actual??'Awaiting result')}</b>${verdict(row.hit,'style')}</section></div>
          <p class="mp-note">Locked ${esc(row.locked??'—')} UTC+8 · ${esc(matchesAhead(row.horizon))}</p>` : empty('No locked forecasts yet.')}</article>`;
      }
      const active=this.fixture||0, r=forecasts[active];
      const choice=group('Select match',forecasts.map((f,i)=>[String(i),(f.kickoff||f.date).slice(5,10)+' vs '+f.opponent]),String(active),'fixture');
      return `<article class="mp-sheet mp-explorer mp-style">${title}${r ? choice+
        `<div class="mp-style-hero"><div><small>${esc(matchesAhead(r.horizon))} · ${r.locked?'Pre-match lock':'Pre-match preview'}</small>
        <h3>vs ${esc(r.opponent)}</h3><p>${esc(r.kickoff?'UTC+8 '+r.kickoff:r.date)} · Predicted match style</p></div>
        <div class="mp-ring" data-mark="confidence" style="--mp-arc:${valid(r.confidence)?bound(r.confidence*100):0}%"><span><b>${pct(r.confidence)}</b><small>Style confidence</small></span></div></div>
        ${styleSignals(r.label)}<p class="mp-note">Confidence applies to the combination of traits shown above.</p>` : empty('No style forecast published.')}</article>`;
    }
    act(b){
      if(b.hasAttribute('data-mode')){this.mode=b.dataset.mode;this.refresh('data-mode',this.mode);}
      if(b.hasAttribute('data-fixture')){this.fixture=Number(b.dataset.fixture);this.refresh('data-fixture',this.fixture);}
    }
  }

  function cardProbability(label,value,tone) {
    const width=valid(value)?bound(value):0;
    return `<div class="mp-card-prob is-${tone}"><div><span>${esc(label)}</span><b>${valid(value)?fixed(value,2)+'%':'Unavailable'}</b></div>
      <div class="mp-prob-track"><i style="width:${width}%"></i></div></div>`;
  }

  class Discipline extends Widget {
    reset(){this.mode='next';}
    view() {
      const d=this.data, mode=this.mode||'next', rows=d.history||[];
      const title=`<div class="mp-section-top"><div><small class="mp-caption">Discipline</small><h3>${esc(mode==='next'?d.fixture:'Completed matches')}</h3></div>
        ${group('Discipline records',[['next','Pre-match forecast'],['history','Post-match review']],mode,'mode')}</div>`;
      if (mode==='next') return `<article class="mp-sheet mp-discipline">${title}
        ${d.kickoff?'<p class="mp-fixture-line">Next Premier League fixture · UTC+8 '+esc(d.kickoff)+' · '+(d.locked?'Pre-match lock':'Pre-match preview')+'</p>':''}
        <div class="mp-cards-board"><section class="mp-yellow-panel"><small>Expected bookings</small>
          <strong>${fixed(d.expected,2)}<em> cards</em></strong><span class="mp-referee-cards" aria-hidden="true"><i></i><b></b></span>
          <p>Liverpool bookings over 90 minutes</p></section>
        <section class="mp-probs"><h4>Match probabilities</h4>${cardProbability('No yellow cards',d.zero,'yellow')}${cardProbability('Red card shown',d.red,'red')}
          <div class="mp-scale"><span>0%</span><span>100%</span></div></section></div></article>`;
      const max=Math.max(1,Math.ceil(Math.max(...rows.flatMap(r=>[r.expected,r.actual]).filter(valid))));
      const comparisons=rows.map(r=>`<div class="mp-pair-row"><span>${esc(r.date)} · ${esc(r.opponent)}</span>
        <div>${['expected','actual'].map(key=>`<div class="mp-pair-bar is-${key}">${valid(r[key])?`<i style="width:${bound(r[key]/max*100)}%"></i>`:''}<b>${valid(r[key])?fixed(r[key],key==='expected'?2:0):'—'}</b></div>`).join('')}</div></div>`).join('');
      const detail=table(['Match / Lock time (UTC+8)','Expected bookings','Actual bookings','No booking chance','No bookings','Red card chance','Red card shown'],rows.map(r=>[
        esc(r.date+' vs '+r.opponent)+'<small>'+esc(r.locked||'')+'</small>',fixed(r.expected,2),esc(r.actual??'Pending'),valid(r.zero)?fixed(r.zero,2)+'%':'Unavailable',r.zeroActual==null?'Unavailable':r.zeroActual?'Yes':'No',
        valid(r.red)?fixed(r.red,2)+'%':'Unavailable',r.redActual==null?'Pending':r.redActual?'Red card':'No red card']));
      return `<article class="mp-sheet mp-discipline">${title}<div class="mp-chart-head"><h4>Forecast and actual bookings</h4><small>Unit · cards</small></div>
        <div class="mp-legend"><span><i class="mp-key is-yellow"></i>Forecast</span><span><i class="mp-key is-ink"></i>Actual</span></div>
        ${comparisons||empty('No completed records yet.')}<details class="mp-disclosure"><summary>Discipline by match ${icon('down')}</summary>${detail}</details></article>`;
    }
    act(b){if(b.hasAttribute('data-mode')){this.mode=b.dataset.mode;this.refresh('data-mode',this.mode);}}
  }
  const fixturesText = rows => (rows||[]).map(r=>(r.kickoff?.slice(0,10)||r.date)+' vs '+r.opponent).join(' / ');
  const scoreText = score => Array.isArray(score) && score.length===2 ? score.map(x=>valid(x)?x:'—').join(' – ') : '—';
  const pointText = n => valid(n) ? fixed(n,1)+' pts' : 'Unavailable';
  const rangeText = range => range?.length===2 && range.every(valid) ? range.map(n=>Number(n.toFixed(2))).join('–')+' pts' : 'Unavailable';
  const sourceNames = {lock:'Pre-match lock',replay:'Historical replay',validation:'Historical estimate'};
  const disclosure = (label,html) => '<details class="mp-disclosure"><summary>'+esc(label)+' '+icon('down')+'</summary>'+html+'</details>';
  function resultBadge(hit) {
    if(hit==null) return '<span class="mp-neutral">Pending</span>';
    return verdict(Boolean(hit),'');
  }
  function formTrend(history,r,scope) {
    const played=(history||[]).filter(h=>valid(h.value));
    if (!played.length || !valid(r.point)) return '';
    const x=i=>36+i*525/played.length, y=v=>113-Math.max(0,Math.min(100,v));
    const last=played.at(-1), end=x(played.length);
    const lines=[0,50,100].map(t=>`<line x1="32" x2="576" y1="${y(t)}" y2="${y(t)}" class="mp-gridline"/><text x="25" y="${y(t)+3}" text-anchor="end">${t}</text>`).join('');
    const band=r.window?.length===2&&r.window.every(valid)?`<rect x="${end-12}" width="24" y="${y(r.window[1])}" height="${Math.max(1,y(r.window[0])-y(r.window[1]))}" fill="#bce6e0"/>`:'';
    const dots=played.map((h,i)=>`<circle cx="${x(i)}" cy="${y(h.value)}" r="3" fill="#480a19"><title>${esc(h.date+' vs '+h.opponent+' · '+pointText(h.value))}</title></circle>`).join('');
    return `<figure class="mp-form-trend"><figcaption><b>Team form trend</b><small>Actual form / ${scope==='three'?'Three-match forecast':'Next forecast'}</small></figcaption>
      <svg viewBox="0 0 600 140" role="img" aria-label="Completed match scores and the current forecast">${lines}${band}
      <polyline points="${played.map((h,i)=>x(i)+','+y(h.value)).join(' ')}" stroke="#480a19" stroke-width="2.4" fill="none"/>
      <path d="M${x(played.length-1)} ${y(last.value)} L${end} ${y(r.point)}" fill="none" stroke="#00796f" stroke-width="2.5" stroke-dasharray="4 4"/>
      ${dots}<circle cx="${end}" cy="${y(r.point)}" r="4" fill="#00796f"/><text x="36" y="133">${esc(played[0].date.slice(5))}</text>
      <text x="580" y="133" text-anchor="end">${scope==='three'?'Three-match average':'Next match'}</text></svg></figure>
      ${disclosure('Form scores by match',table(['Match','Horizon','Form score'],[...played.map(h=>[esc(h.date+' vs '+h.opponent),'Match result',pointText(h.value)]),[esc(fixturesText(r.fixtures)),scope==='three'?'Three-match forecast':'Next forecast',pointText(r.point)]]))}`;
  }

  class Matchday extends Widget {
    reset(){this.fixture=null;this.panel='score';this.eventModel=this.data?.defaultModel;this.target='scores';this.playerModel=null;}
    connectedCallback(){
      super.connectedCallback();
      this.onchange=e=>{
        const field=e.target.dataset.choice;
        if(e.target.closest('.mp-widget')!==this || !['fixture','eventModel','target','playerModel'].includes(field))return;
        this[field]=e.target.value;
        if(field==='target')this.playerModel=null;
        if(field==='fixture'){
          this.followLeague=false;
          if(this.game().kind==='scheduled' && this.game().id!==this.data.leagueId)this.panel='team';
        }
        this.paint();this.querySelector('[data-choice="'+field+'"]')?.focus({preventScroll:true});
      };
    }
    game(){const id=this.followLeague?this.data.leagueId:this.fixture;return this.data.fixtures?.find(f=>f.id===id) || this.data.fixtures?.find(f=>f.kind==='next') || this.data.fixtures?.[0];}
    scorePanel(f) {
      if(!f.score)return empty('No score prediction for this match yet.');
      const models=(this.data.models||[]).filter(m=>f.routes?.[m.key]);
      const model=models.find(m=>m.key===this.eventModel)||models[0], route=f.routes?.[model?.key];
      const pick=(p)=>'<div class="mp-nom"><span>'+esc(p.name)+'</span><b>'+fmt(p.probability,'%')+'</b>'+(f.kind==='played'?resultBadge(p.hit):'')+'</div>';
      const cards=f.score.map((v,i)=>{
        const which=i===0?'main':'backup', list=route?.scorers?.[which];
        const sides=f.kind!=='played'?'':['Liverpool',f.opponent].map((side,j)=>'<span>'+esc(side)+' goals '+resultBadge(valid(f.actual?.[j])&&valid(v?.[j])?v[j]===f.actual[j]:null)+'</span>').join('');
        return '<section class="mp-score-option"><small>'+(i?'Alternative score':'Primary score')+'</small><strong>'+scoreText(v)+'</strong><div class="mp-side-results">'+sides+'</div><h4>Goalscorer picks</h4>'+
          (list?.length?list.map(pick).join(''):empty(list && v?.[0]===0?'Liverpool are predicted to finish without a goal.':'No picks published.'))+'</section>';
      }).join('');
      return (models.length?selector('eventModel','Forecast option',forecastOptions(this.data.models,'key').filter(([key])=>f.routes?.[key]),model.key):'')+
        '<div class="mp-option-grid">'+cards+'</div><p class="mp-note">Score predictions show Liverpool first.</p><h4 class="mp-subheading">Assist picks</h4>'+
        (route?.assists?['main','backup'].filter(k=>route.assists[k]).map(k=>'<div class="mp-assist-row"><small>'+(k==='main'?'Primary pick':'Alternative pick')+'</small>'+pick(route.assists[k])+'</div>').join(''):empty('No assist pick for this forecast.'));
    }
    teamPanel(f){
      const d=this.data, played=f.kind==='played', next='leagueId' in d?f.id===d.leagueId:f.kind==='next';
      const state=next?d.state?.single:null, prior=played?d.archive?.single?.find(r=>r.date===f.date&&r.opponent===f.opponent):null;
      const styleRows=(d.style?.reviews||[]).filter(r=>r.date===f.date&&r.opponent===f.opponent);
      const discipline=next?(valid(d.cards?.expected)||valid(d.cards?.red)?d.cards:null):(d.cards?.history||[]).find(r=>r.date===f.date && r.opponent===f.opponent);
      let html='<h4 class="mp-subheading">Team form</h4>';
      if(state)html+=metrics([['Single-match forecast',pointText(state.point)],['Forecast range',rangeText(state.window)],['Range confidence',pct(state.confidence)]]);
      else if(prior)html+=metrics([['Actual total',pointText(prior.state)],['Final score',scoreText(prior.score)]])+
        (prior.forecasts?.length?forecastTable(prior.forecasts):empty('No single-match forecast was saved.'))+scoreMethod('single');
      else html+=empty('No single-match form forecast for this fixture.');
      const segment=d.state?.three;
      if(!played && segment?.fixtures?.some(r=>r.date===f.date && r.opponent===f.opponent))html+='<div class="mp-inset"><b>Three-match average · '+pointText(segment.point)+'</b><small>'+esc(fixturesText(segment.fixtures))+'</small><span>'+rangeText(segment.window)+' · Confidence '+pct(segment.confidence)+'</span></div>';
      html+='<h4 class="mp-subheading">Match style</h4>';
      if(f.style)html+='<div class="mp-inset">'+styleSignals(f.style.label)+'<span>Style confidence '+pct(f.style.confidence)+' · '+(f.style.locked?'Pre-match lock':'Pre-match preview')+'</span></div>';
      if(styleRows.length)html+=disclosure('Locked style forecasts',table(['Lead time','Predicted style','Confidence','Observed style','Check'],styleRows.map(r=>[esc(matchesAhead(r.horizon)),esc(r.label),pct(r.confidence),esc(r.actual||'Awaiting result'),verdict(r.hit,'style')])));
      if(!styleRows.length && !f.style)html+=empty('No style record for this match.');
      html+='<h4 class="mp-subheading">Discipline</h4>';
      return html+(discipline?metrics([['Expected bookings',fixed(discipline.expected,2)+' cards'],['No booking chance',fmt(discipline.zero,'%')],['Red card chance',fmt(discipline.red,'%')]])+(played?'<p class="mp-note">Actual bookings '+esc(discipline.actual??'Pending')+' cards · '+(discipline.redActual==null?'Red card pending':discipline.redActual?'Red card':'No red card')+'</p>':''):empty('No discipline forecast for this match.'));
    }
    playerPanel(f) {
      const groups=this.data.groups||{}, base=groups[this.target]||Object.values(groups)[0];
      if(!base)return empty('No player forecasts available.');
      const g=activeGroup(base,this.playerModel);
      const rows=fixtureRows(f,g);
      const controls='<div class="mp-pickers">'+selector('target','Player forecasts',Object.entries(groups).map(([k,g])=>[k,g.label]),this.target)+selector('playerModel','Forecast option',forecastOptions(routesFor(base),'modelKey'),g.modelKey)+'</div>';
      if(!rows.length)return controls+empty('No player forecasts for this selection.');
      const cells=rows.map(({p,value,actual,kind})=>[
        '<button type="button" class="mp-text-btn" data-match-player="'+esc(p.id)+'">'+esc(p.name)+'</button>'+(kind?'<small>'+esc(kind)+'</small>':''),
        '<b>'+fmt(value,g.unit)+'</b>',esc(actual??'Awaiting result')]);
      return controls+table(['Players','Pre-match forecast','Actual'],cells);
    }
    view(){
      const f=this.game();if(!f)return empty('No fixtures available.');
      const upcoming=this.data.fixtures.find(g=>g.kind==='next'),scheduled=f.kind==='scheduled' && f.id!==this.data.leagueId;
      const choices=scheduled?[['team','Team outlook']]:[['score','Score and picks'],['team','Team outlook'],['players','Player forecasts']];
      const tab=choices.some(([k])=>k===this.panel)?this.panel:'team';
      const stage=f.kind==='next'?'Next match':f.id===this.data.leagueId?'Next Premier League fixture':f.kind==='scheduled'?'Scheduled fixture':f.kind==='awaiting'?'Kicked off · Result pending':'Full time';
      const picker=selector('fixture','Select match',this.data.fixtures.map(g=>[g.id,(g.kind==='next'?'Next match':g.kind==='played'?'Played':g.kind==='awaiting'?'Result pending':'Scheduled')+' · '+(g.kickoff?.slice(5,10)||g.date.slice(5))+' vs '+g.opponent]),f.id);
      return '<article class="mp-sheet mp-matchday"><div class="mp-game-controls">'+picker+(upcoming&&f!==upcoming?'<button class="mp-text-btn" data-return-next type="button">Back to next match '+icon('arrow')+'</button>':'')+'</div>'+
        '<header class="mp-game-head"><div><small>'+esc([f.competition,stage].filter(Boolean).join(' · '))+(f.home!=null?(f.home?' · Home':' · Away'):'')+'</small><h3>'+esc(f.home===false?f.opponent:'Liverpool')+' <i>vs</i> '+esc(f.home===false?'Liverpool':f.opponent)+'</h3><p>'+esc(f.kickoff?'UTC+8 '+f.kickoff:f.date+' · Match date')+'</p></div><div><small>'+(f.kind==='played'?'Final score':'Match status')+'</small><b>'+esc(f.kind==='played'?scoreText(f.home===false?f.actual?.slice().reverse():f.actual):f.kind==='awaiting'?'Result pending':'Upcoming')+'</b></div></header>'+
        group('Match sections',choices,tab,'panel')+'<div class="mp-game-body">'+(tab==='score'?this.scorePanel(f):tab==='players'?this.playerPanel(f):this.teamPanel(f))+'</div></article>';
    }
    act(b){
      if(b.dataset.panel){this.panel=b.dataset.panel;this.refresh('data-panel',this.panel);}
      if(b.hasAttribute('data-return-next')){this.followLeague=false;this.fixture=null;this.panel='score';this.paint();this.querySelector('[data-choice=fixture]')?.focus({preventScroll:true});}
      if(b.hasAttribute('data-match-player')){
        const base=this.data.groups[this.target],g=activeGroup(base,this.playerModel),f=this.game();
        const item=fixtureRows(f,g).find(r=>r.p.id===b.dataset.matchPlayer);
        if(!item)return;
        const el=document.createElement('mp-trajectory');
        el.data=g.items.includes(item.p)?{groups:this.data.groups,target:this.target,modelKey:g.modelKey,playerId:item.p.id,fixtureDate:f.date}:
          {...profile({...item.p,historyOnly:true,prediction:item.value},g),fixtureLabel:f.date+' vs '+f.opponent,fixtureDate:f.date};
        openDetail(this,'Player trends','',el);
      }
    }
  }

  function forecastTable(rows){
    return table(['Source','Forecast score','range','Confidence','Result'],rows.map(r=>[esc(sourceNames[r.kind]||r.kind),pointText(r.point),rangeText(r.window),pct(r.confidence),verdict(r.hit)]));
  }
  class Calibration extends Widget {
    reset(){this.scope='single';}
    view(){
      const choices=Object.entries(this.data).filter(([,r])=>r?.rows?.length || r?.events?.length || r?.reviews?.length);
      if(!choices.length)return empty('No records to review.');
      const [key,r]=choices.find(([k])=>k===this.scope)||choices[0];
      let content;
      if(r.rows?.length){
        content=table(['Match','Forecast / range','Forecast confidence',key==='three'?'three-match average':'Actual total','Result'],r.rows.map(x=>[
          esc(x.fixture),pointText(x.point)+'<small>'+rangeText(x.window)+'</small>',pct(x.confidence),pointText(x.actual),verdict(x.hit)]))+scoreMethod(key);
      }else if(r.events?.length){
        content=table(['Match','Red card chance','Red card shown','No booking chance','No bookings'],r.events.map(x=>[
          esc(x.date+' vs '+x.opponent),fmt(x.red,'%'),x.redActual==null?'Pending':x.redActual?'Yes':'No',fmt(x.zero,'%'),x.zeroActual==null?'Pending':x.zeroActual?'Yes':'No']));
      }else{
        content=table(['Match','Lead time','Predicted style','Observed style','Check'],r.reviews.map(x=>[
          esc(x.date+' vs '+x.opponent),esc(matchesAhead(x.horizon)),esc(x.label),esc(x.actual??'Pending'),verdict(x.hit,'style')]));
      }
      return '<article class="mp-sheet"><div class="mp-section-top"><h3>Forecast checks</h3></div>'+group('Review type',choices.map(([k,x])=>[k,x.label]),key,'scope')+
        '<p class="mp-note">'+(key==='style'?'Pre-match records':'Historical replays')+'</p>'+content+'</article>';
    }
    act(b){if(b.dataset.scope){this.scope=b.dataset.scope;this.refresh('data-scope',this.scope);}}
  }
  class Archive extends Widget {
    reset(){this.scope='single';this.season=null;}
    connectedCallback(){super.connectedCallback();this.onchange=e=>{if(e.target.matches('[data-choice=season]')){this.season=Number(e.target.value);this.paint();this.querySelector('[data-choice=season]').focus({preventScroll:true});}};}
    view(){
      const rows=this.data[this.scope]||[], seasons=[...new Set(rows.map(r=>r.season))].sort((a,b)=>b-a);
      this.season=seasons.includes(this.season)?this.season:seasons[0];
      this.seasonRows=rows.filter(r=>r.season===this.season).sort((a,b)=>b.date.localeCompare(a.date));
      const cells=this.seasonRows.map((r,i)=>{
        const f=r.forecasts?.find(record=>record.kind==='lock') ?? r.forecasts?.[0];
        return [
          r.matches?esc(fixturesText(r.matches)):esc(r.date+' vs '+r.opponent)+'<small>'+scoreText(r.score)+'</small>',
          f?esc(sourceNames[f.kind]||f.kind):'No forecast',
          f?pointText(f.point)+'<small>'+rangeText(f.window)+'</small>':'—',
          f?pct(f.confidence):'—',scoreCell(r.state,i),f?verdict(f.hit):'—'
        ];
      });
      const legacy=(this.data.legacy||[]).map(r=>'<p>'+esc(r.locked)+' Lock time (UTC+8)</p>'+table(['Match','Forecast range','Forecast score','Recorded score'],r.rows.map(h=>[esc(h.date+' vs '+h.opponent),rangeText(h.window),pointText(h.point),pointText(h.actual)]))).join('');
      return '<article class="mp-sheet mp-archive"><div class="mp-section-top"><div><small class="mp-caption">Season archive</small><h3>Season form scores</h3></div>'+selector('season','Season',seasons.map(s=>[String(s),s+' / '+String(s+1).slice(-2)]),String(this.season))+'</div>'+
        group('Archive view',[['single','Single match'],['three','Three-match average']],this.scope,'scope')+'<p class="mp-note">This season: '+this.seasonRows.length+(this.scope==='three'?' windows':' matches')+'. Actual scores are kept even when a forecast is unavailable.</p>'+
        (cells.length?table(['Match','Forecast source','Forecast / range','Confidence',this.scope==='three'?'three-match average':'Actual total','Check'],cells):empty('No records available.'))+(legacy?disclosure('Earlier form forecasts',legacy):'')+'</article>';
    }
    act(b){
      if(b.hasAttribute('data-score-basis')){
        const row=this.seasonRows[Number(b.dataset.scoreBasis)];
        openScoreBasis(this,row.matches?fixturesText(row.matches):row.date+' vs '+row.opponent,row.state,row.subtotals);
      }else if(b.dataset.scope){this.scope=b.dataset.scope;this.refresh('data-scope',this.scope);}
    }
  }
  for(const [tag,ctor] of Object.entries({matchday:Matchday,calibration:Calibration,archive:Archive,match:Match,players:Players,trajectory:Trajectory,form:Form,review:Review,discipline:Discipline,defense:Defense,keeper:Keeper,style:Style})){
    if(!customElements.get('mp-'+tag))customElements.define('mp-'+tag,ctor);
  }
  window.RedadvUI=window.MatchPulseUI={icon,profile,showDialog,closeDialog,englishData};
})();
