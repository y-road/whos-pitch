// @ts-nocheck
/**
 * 라인업 편집 화면 엔진.
 * 프로토타입에서 검증한 드래그·길게 누르기·확대 창·메뉴 동작을 그대로 옮긴 모듈이다.
 * React에서는 LineupTab 컴포넌트가 mount/destroy 로 감싸서 쓰고, 상태는 host.onChange 로 돌려준다.
 */
import {
  FORMS, POS, POSCLS, COLORS, COLORDEF, PITCH_SVG, grpOf, esc, dist, sortPos, posLabel, lab,
} from './lineup-core.ts'

const DEFAULT_FM = '4-3-3'

export function mountLineupEditor(root, host) {
  var cleanups = [];
  function on(target, type, fn, opts) { target.addEventListener(type, fn, opts); cleanups.push(function () { target.removeEventListener(type, fn, opts); }); }
  var S = JSON.parse(JSON.stringify(host.state)); S.cur = host.cur || 0;
  var ui = {sel:null,jig:null,picker:null,lmenu:null,cm:null,merc:false,t:0,help:false,nc:0};
  function colKey(id,l){var k=S.pc&&S.pc[id];return COLORS[k]?k:COLORDEF[grpOf(l)];}
  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}

  /* ---------- 저장 + 되돌리기 ---------- */
  var lastSnap='',undoSt=[],redoSt=[],restoring=false;
  function snap(){return JSON.stringify({players:S.players,attend:S.attend,q:S.q,fm:S.fm,gs:S.gs,pc:S.pc,seq:S.seq});}
  function emit(){host.onChange(JSON.parse(JSON.stringify({players:S.players,attend:S.attend,q:S.q,fm:S.fm,gs:S.gs,pc:S.pc,seq:S.seq,sortDir:S.sortDir||'asc'})));}
  function save(){
    var sn=snap();
    if(!restoring&&lastSnap&&sn!==lastSnap){undoSt.push(lastSnap);if(undoSt.length>80) undoSt.shift();redoSt=[];}
    lastSnap=sn;
    emit();
  }
  function applySnap(str,msg){
    var o=JSON.parse(str);
    restoring=true;
    S.players=o.players;S.attend=o.attend;S.q=o.q;S.fm=o.fm;S.gs=o.gs;S.pc=o.pc;S.seq=o.seq;
    save();restoring=false;
    ui.picker=null;ui.lmenu=null;ui.cm=null;ui.merc=false;
    render();toast(msg);
  }
  function undo(){if(!undoSt.length){toast('되돌릴 내용이 없어요');return;}redoSt.push(lastSnap);applySnap(undoSt.pop(),'되돌렸어요');}
  function redo(){if(!redoSt.length){toast('다시 실행할 내용이 없어요');return;}undoSt.push(lastSnap);applySnap(redoSt.pop(),'다시 실행했어요');}
  function mercCount(){return S.players.filter(function(p){return p.merc;}).length;}
  function isMerc(id){for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return !!S.players[i].merc; return false;}
  lastSnap=snap();
  var app=root;
function sortPlayers(){
  var dir=S.sortDir==='desc'?-1:1;
  S.players.sort(function(a,b){return dir*a.name.localeCompare(b.name,'ko');});
  S.attend.sort(function(a,b){return idx(a)-idx(b);});
}
function idx(id){for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return i; return 99;}
function pname(id){for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return S.players[i].name; return '?';}
function playedTotal(id){var n=0;for(var i=0;i<4;i++) if(S.q[i][id]) n++;return n;}
function playedExcept(id,qi){var n=0;for(var i=0;i<4;i++) if(i!==qi&&S.q[i][id]) n++;return n;}
function benchOf(qi){
  var ids=S.attend.filter(function(id){return !S.q[qi][id];});
  ids.sort(function(a,b){return playedTotal(a)-playedTotal(b)||idx(a)-idx(b);});
  return ids;
}
function slotsOf(qi){return S.gs[qi]||FORMS[S.fm[qi]];}
function ensureGs(qi){if(!S.gs[qi]) S.gs[qi]=FORMS[S.fm[qi]].map(function(s){return {x:s.x,y:s.y,l:s.l};});return S.gs[qi];}
function onPitch(qi){return Object.keys(S.q[qi]).length;}
function slotTaken(qi,s){var q=S.q[qi];return Object.keys(q).some(function(id){return dist(q[id],s)<9;});}
function autoLabel(qi,x,y){
  var best=null,bd=11;
  slotsOf(qi).forEach(function(s){var d=dist(s,{x:x,y:y});if(d<bd){bd=d;best=s;}});
  return best?best.l:posLabel(x,y);
}
function relabel(qi,id){var p=S.q[qi][id];if(p&&!p.m) p.l=autoLabel(qi,p.x,p.y);}
/* 포메이션 변경: 가이드가 바뀌고, 이미 배치된 선수는 가까운 자리로 이동 */
function setFormation(qi,key){
  S.fm[qi]=key;S.gs[qi]=null;
  var slots=FORMS[key],q=S.q[qi],pairs=[];
  Object.keys(q).forEach(function(id){slots.forEach(function(s,i){pairs.push({id:id,i:i,d:dist(q[id],s)});});});
  pairs.sort(function(a,b){return a.d-b.d;});
  var uP={},uS={},nq={};
  pairs.forEach(function(pr){
    if(uP[pr.id]||uS[pr.i]) return; uP[pr.id]=1;uS[pr.i]=1;
    var o=q[pr.id],s=slots[pr.i];
    nq[pr.id]={x:s.x,y:s.y,l:o.m?o.l:s.l,m:!!o.m};
  });
  S.q[qi]=nq;
}
function placeAtSlot(qi,id,s){S.q[qi][id]={x:s.x,y:s.y,l:s.l,m:false};}
function setAttend(id,on){
  var i=S.attend.indexOf(id);
  if(on&&i<0){S.attend.push(id);S.attend.sort(function(a,b){return idx(a)-idx(b);});}
  if(!on&&i>-1){S.attend.splice(i,1);for(var k=0;k<4;k++) delete S.q[k][id];}
}

function setupBslide(){
  var be=document.getElementById('bench'); if(!be) return;
  var wrap=be.parentNode,tr=document.createElement('div');tr.className='bslide';tr.setAttribute('aria-hidden','true');
  var th=document.createElement('i');tr.appendChild(th);wrap.appendChild(tr);
  function upd(){
    var ch=be.clientHeight,sh=be.scrollHeight,over=sh>ch+1;
    tr.classList.toggle('off',!over);
    var h=over?Math.max(40,ch*ch/sh):ch;th.style.height=h+'px';
    th.style.top=(over?(be.scrollTop/(sh-ch))*(ch-h):0)+'px';
  }
  be.addEventListener('scroll',upd,{passive:true});
  var dr=null;
  tr.addEventListener('pointerdown',function(e){
    var ch=be.clientHeight,sh=be.scrollHeight; if(sh<=ch+1) return;
    var h=th.offsetHeight,r=tr.getBoundingClientRect();
    var onThumb=e.clientY>=r.top+th.offsetTop&&e.clientY<=r.top+th.offsetTop+h;
    dr={y:e.clientY,st:be.scrollTop,jump:!onThumb};
    if(!onThumb){be.scrollTop=((e.clientY-r.top-h/2)/(ch-h))*(sh-ch);dr.st=be.scrollTop;}
    tr.setPointerCapture(e.pointerId);e.preventDefault();
  });
  tr.addEventListener('pointermove',function(e){
    if(!dr) return; var ch=be.clientHeight,sh=be.scrollHeight,h=th.offsetHeight;
    be.scrollTop=dr.st+(e.clientY-dr.y)*(sh-ch)/(ch-h);
  });
  var end=function(){dr=null;};tr.addEventListener('pointerup',end);tr.addEventListener('pointercancel',end);
  upd();
}
function chipsHTML(qi,edit,hl){
  var q=S.q[qi],h='';
  Object.keys(q).forEach(function(id){
    var p=q[id],l=lab(p),g=grpOf(l),hex=COLORS[colKey(id,l)][1];
    h+='<div class="chip '+g+(hl?(hl===id?' me':' dim'):'')+(ui.jig===id?' jig':'')+((ui.sel===id||ui.jig===id||(ui.lmenu&&ui.lmenu.id===id))?' chipsel':'')+'" '+(edit?'data-drag="1" data-src="pitch" ':'')+'data-pid="'+id+'" style="left:'+p.x+'%;top:'+p.y+'%;--cc:'+hex+'"><span class="c'+(l.length>3?' sm':'')+'" style="background:'+hex+';color:#fff">'+l+'</span><span class="nm">'+esc(pname(id))+(edit?'<button class="pb" data-pos="'+id+'" aria-label="'+esc(pname(id))+' 포지션 변경" aria-haspopup="menu"><svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>':'')+'</span>'+(edit?'<button class="xb" data-act="tobench" data-id="'+id+'" aria-label="'+esc(pname(id))+' 벤치로 보내기">×</button>':'')+'</div>';
  });
  return h;
}
function guidesHTML(qi){
  var h='';
  slotsOf(qi).forEach(function(s,i){
    if(slotTaken(qi,s)) return;
    h+='<button class="slot" data-drag="1" data-src="guide" data-idx="'+i+'" data-slot="'+i+'" style="left:'+s.x+'%;top:'+s.y+'%" aria-label="'+s.l+' 자리: 눌러서 선수 선택, 끌어서 이동">'+s.l+'</button><button class="pbg" data-gpos="'+i+'" style="left:'+s.x+'%;top:'+s.y+'%" aria-label="'+s.l+' 자리 포지션 변경" aria-haspopup="menu"><svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  });
  return h;
}
function qnavHTML(qi){
  var ch=function(d){return '<svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';};
  return (qi>0?'<button class="qnav l" data-act="qprev" aria-label="이전 쿼터 ('+qi+'쿼터)" title="'+qi+'쿼터로">'+ch('M6 1L1 7l5 6')+'</button>':'')+
         (qi<3?'<button class="qnav r" data-act="qnext" aria-label="다음 쿼터 ('+(qi+2)+'쿼터)" title="'+(qi+2)+'쿼터로">'+ch('M2 1l5 6-5 6')+'</button>':'');
}
function lineupHTML(){
  var qi=S.cur,bench=benchOf(qi),n=onPitch(qi);
  var h='<section><div class="ctrl"><div class="ctl-l">'+
   '<select class="sel" id="qsel" aria-label="쿼터 선택">'+[0,1,2,3].map(function(i){return '<option value="'+i+'"'+(i===qi?' selected':'')+'>'+(i+1)+'쿼터</option>';}).join('')+'</select>'+
   '<select class="sel" id="fm" aria-label="포메이션">'+Object.keys(FORMS).map(function(k){return '<option value="'+k+'"'+(k===S.fm[qi]?' selected':'')+'>'+k+'</option>';}).join('')+'</select></div>'+
   '<div class="ctl-r"><button class="btn" data-act="copyprev"'+(qi===0?' disabled':'')+'>이전 쿼터 복사</button><button class="btn" data-act="resetq" data-tip="지금 보고 있는 '+(qi+1)+'쿼터만 초기화해요. 배치한 선수는 벤치로, 점선 위치는 처음으로 돌아가요." aria-label="'+(qi+1)+'쿼터 초기화">'+(qi+1)+'쿼터 초기화</button><button class="btn" data-act="resetall" data-tip="1~4쿼터 모두 초기화해요. 모든 쿼터의 선수는 벤치로, 점선 위치는 처음으로 돌아가요." aria-label="전체 쿼터 초기화">전체 쿼터 초기화</button></div></div>'+
   '<div class="lrow"><div class="pcol"><div class="pitch"><div class="field" id="field">'+PITCH_SVG+guidesHTML(qi)+chipsHTML(qi,true,'')+qnavHTML(qi)+'</div></div></div>'+
   '<aside class="bcol" id="bcol"><div class="bh"><b>벤치</b><span class="cnt">'+bench.length+'명</span></div><button class="btn small mbtn" data-act="mercopen">+ 용병 추가</button><div class="bwrap"><div class="bench" id="bench">'+
   (bench.length?bench.map(function(id){var c=playedTotal(id);var mc=isMerc(id);return '<div class="bchip'+(mc?' merc':'')+'" data-drag="1" data-src="bench" data-pid="'+id+'"><span class="bn">'+esc(pname(id))+'</span><span class="bm">'+(mc?'용병 · ':'')+c+'Q</span>'+(mc?'<button class="mx" data-act="delmerc" data-id="'+id+'" aria-label="'+esc(pname(id))+' 삭제">×</button>':'')+'</div>';}).join(''):'<div class="empty">남은 선수가 없어요</div>')+
   '</div></div></aside></div>'+
   '<div class="status"><span><b>필드 '+n+'/11</b> · 벤치 '+bench.length+'명 · 참석 '+S.attend.length+'명</span><span><button class="ibtn" data-act="undo"'+(undoSt.length?'':' disabled')+' aria-label="되돌리기 (Ctrl+Z)">↶ 되돌리기</button><button class="ibtn" data-act="help" aria-expanded="'+ui.help+'">'+(ui.help?'닫기':'사용법')+'</button></span></div>'+
   (ui.help?'<div class="tip"><b>벤치 → 필드</b> 선수 카드를 끌어 놓기 (점선에 걸치면 그 자리 중앙에 맞춰지고, 탭하면 빈 자리에 자동 배치)<br><b>점선 자리</b> 탭하면 선수 선택, 끌면 위치 이동, 아래 ▾(또는 길게 누르기)로 포지션 변경<br><b>필드 선수</b> 탭하면 벤치로, 이름 옆 ▾ 또는 길게 누르면 포지션 변경<br><b>n쿼터 초기화</b> 보고 있는 쿼터만 · <b>전체 쿼터 초기화</b> 1~4쿼터 모두 (선수는 벤치로, 점선은 처음 위치로)<br><b>되돌리기</b> Ctrl+Z (Mac은 ⌘Z)<br><b>벤치 숫자</b> 지금까지 뛴 쿼터 · <b>용병</b> 벤치 위 버튼으로 추가, 카드의 ×로 삭제</div>':'')+
   '</section>';
  h+='<section class="card"><b>출전 현황</b><div class="stats" style="margin-top:8px">'+S.attend.map(function(id){var c=playedTotal(id);
    return '<div class="stat'+(c===0?' zero':'')+'"><span class="nm2">'+esc(pname(id))+'</span><span class="dots" aria-label="'+c+'쿼터 출전">'+[0,1,2,3].map(function(k){return '<i class="'+(S.q[k][id]?'on':'')+'"></i>';}).join('')+'</span></div>';}).join('')+'</div></section>';
  return h;
}
function overlayHTML(){
  
  if(ui.merc){
    return '<div class="ov" data-act="ovclose"><div class="sheet" role="dialog" aria-modal="true" aria-label="용병 추가"><div class="sh"><b>용병 추가</b><button class="btn small" data-act="close">닫기</button></div>'+
      '<div class="row" style="align-items:flex-end"><div class="field-in"><label for="mname">이름</label><input id="mname" placeholder="비우면 용병'+(mercCount()+1)+'" maxlength="10" autocomplete="off"></div><button class="btn primary" data-act="mercadd" style="min-height:44px">추가</button></div>'+
      '<p class="hint">용병은 이번 라인업에만 쓰는 임시 선수예요. 팀 명단에는 들어가지 않고, 벤치 카드의 ×로 삭제할 수 있어요.</p></div></div>';
  }
  if(ui.picker){
    var s=slotsOf(S.cur)[ui.picker.slot]; if(!s){ui.picker=null;return '';}
    var list=benchOf(S.cur);
    return '<div class="ov" data-act="ovclose"><div class="sheet" role="dialog" aria-modal="true" aria-label="선수 선택"><div class="sh"><b>'+s.l+' 자리에 놓을 선수</b><button class="btn small" data-act="close">닫기</button></div>'+
      (list.length?'<div class="pgrid">'+list.map(function(id){return '<button class="pick" data-act="pick" data-id="'+id+'"><span>'+esc(pname(id))+'</span><span class="n">'+playedTotal(id)+'Q</span></button>';}).join('')+'</div>':'<p class="hint">벤치에 남은 선수가 없어요.</p>')+'</div></div>';
  }
  if(ui.lmenu){
    var gslot=ui.lmenu.slot!==undefined,p=null,cur,title;
    if(gslot){var gsl=slotsOf(S.cur)[ui.lmenu.slot]; if(!gsl){ui.lmenu=null;return '';} cur=gsl.l;title='점선 자리';}
    else{p=S.q[S.cur][ui.lmenu.id]; if(!p){ui.lmenu=null;return '';} cur=lab(p);title=pname(ui.lmenu.id);}
    var a=ui.lmenu,W=Math.min(250,window.innerWidth-16);
    var left=clamp(a.x-W/2,8,window.innerWidth-W-8);
    var below=window.innerHeight-a.bottom-12,above=a.top-12;
    var useBelow=below>=240||below>=above;
    var st='left:'+left+'px;width:'+W+'px;'+(useBelow?'top:'+(a.bottom+4)+'px;max-height:'+Math.max(120,Math.min(360,below))+'px':'bottom:'+(window.innerHeight-a.top+4)+'px;max-height:'+Math.max(120,Math.min(360,above))+'px');
    var m='<div class="ov clear" data-act="ovclose"><div class="menu" role="menu" aria-label="'+esc(title)+' 포지션" style="'+st+'">';
    var ck=gslot?'':colKey(ui.lmenu.id,cur),isDef=gslot?true:!COLORS[S.pc[ui.lmenu.id]];
    if(!gslot) m+='<button class="mi mcol" role="menuitem" data-act="colmenu" aria-haspopup="menu" aria-expanded="'+!!ui.cm+'"><span>색</span><span class="mcv"><i class="sw" style="background:'+COLORS[ck][1]+'"></i>'+(isDef?'기본 · ':'')+COLORS[ck][0]+'<svg width="6" height="10" viewBox="0 0 6 10" aria-hidden="true"><path d="M1 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>';
    if(p&&p.m) m+='<button class="mi mauto" role="menuitem" data-act="autolab">자동 (위치 기준)으로 되돌리기</button>';
    POS.forEach(function(g){
      m+='<div class="mh">'+g.g+'</div>';
      g.it.forEach(function(t){m+='<button class="mi" role="menuitem" data-act="setlab" data-l="'+t[0]+'" aria-pressed="'+(t[0]===cur)+'">'+t[1]+' ('+t[0]+')</button>';});
    });
    m+='</div>';
    if(ui.cm&&!gslot){
      var c=ui.cm,cw=160,ph=216,cx,cy=c.top,defK=COLORDEF[grpOf(cur)];
      if(c.mright+6+cw<=window.innerWidth-8) cx=c.mright+6;
      else if(c.mleft-6-cw>=8) cx=c.mleft-6-cw;
      else {cx=clamp(c.mleft+((c.mright-c.mleft)-cw)/2,8,window.innerWidth-cw-8);cy=c.bottom+4;}
      cy=clamp(cy,8,Math.max(8,window.innerHeight-ph-8));
      m+='<div class="menu cpop" role="menu" aria-label="색 선택" style="left:'+cx+'px;top:'+cy+'px;width:'+cw+'px"><div class="mh">색</div>'+
        '<button class="mi" role="menuitem" data-act="setcol" data-k="" aria-pressed="'+isDef+'"><i class="swb" style="background:'+COLORS[defK][1]+'"></i><span>기본</span>'+(isDef?'<span class="ck">✓</span>':'')+'</button>'+
        Object.keys(COLORS).map(function(k){var on=!isDef&&S.pc[ui.lmenu.id]===k;return '<button class="mi" role="menuitem" data-act="setcol" data-k="'+k+'" aria-pressed="'+on+'"><i class="swb" style="background:'+COLORS[k][1]+'"></i><span>'+COLORS[k][0]+'</span>'+(on?'<span class="ck">✓</span>':'')+'</button>';}).join('')+'</div>';
    }
    return m+'</div>';
  }
  return '';
}
var tm=null;
function toast(msg){
  var old=document.querySelector('.toast'); if(old) old.remove();
  var t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); t.textContent=msg; document.body.appendChild(t);
  clearTimeout(tm); tm=setTimeout(function(){t.remove();},2200);
}
function clearJig(){ui.jig=null;ui.sel=null;var j=document.querySelectorAll('.chip.jig,.chip.chipsel');for(var i=0;i<j.length;i++)j[i].classList.remove('jig','chipsel');}
function closeOv(){ui.jig=null;ui.sel=null;ui.picker=null;ui.lmenu=null;ui.cm=null;ui.merc=false;render();}
function rerenderKeep(){
  var m=document.querySelector('.menu:not(.cpop)'),st=m?m.scrollTop:0;
  render();
  var m2=document.querySelector('.menu:not(.cpop)'); if(m2) m2.scrollTop=st;
}
function openGuideMenu(idx){
  var pb=document.querySelector('.pbg[data-gpos="'+idx+'"]'),sl=pb&&pb.previousElementSibling; if(!sl) return;
  var cr=sl.getBoundingClientRect(),pr=pb.getBoundingClientRect();
  ui.picker=null;ui.cm=null;ui.jig=null;ui.sel=null;ui.lmenu={slot:idx,x:cr.left+cr.width/2,top:cr.top,bottom:Math.max(pr.bottom,cr.bottom)};ui.t=Date.now();
  render();
  var it=document.querySelector('.menu .mi[aria-pressed="true"]');
  if(it){var mn=it.closest('.menu');mn.scrollTop=Math.max(0,it.offsetTop-mn.clientHeight/2+16);}
}
function openLabelMenu(chipEl){
  var nm=chipEl.querySelector('.nm'),cr=chipEl.getBoundingClientRect(),nr=nm.getBoundingClientRect();
  ui.picker=null;ui.cm=null;ui.jig=null;ui.sel=chipEl.dataset.pid;ui.lmenu={id:chipEl.dataset.pid,x:cr.left+cr.width/2,top:cr.top-cr.height*.1,bottom:nr.bottom+14};ui.t=Date.now();
  render();
  var it=document.querySelector('.menu .mi[aria-pressed="true"]');
  if(it){var mn=it.closest('.menu');mn.scrollTop=Math.max(0,it.offsetTop-mn.clientHeight/2+16);}
}
on(window,'scroll',function(){if(ui.lmenu&&Date.now()-ui.t>300) closeOv();},{passive:true});

on(root,'click',function(e){
  var el=e.target.closest('[data-q],[data-act],[data-slot],[data-pos],[data-gpos]'); if(!el) return;
  if(el.dataset.gpos!==undefined){openGuideMenu(+el.dataset.gpos);return;}
  if(el.dataset.pos!==undefined){openLabelMenu(el.closest('.chip'));return;}
  if(el.dataset.act==='ovclose'){ if(e.target===el&&Date.now()-ui.t>400) closeOv(); return; }
  if(el.dataset.slot!==undefined){if(Date.now()-ui.nc<350||ui.lmenu) return;ui.picker={slot:+el.dataset.slot};ui.t=Date.now();render();return;}
  var a=el.dataset.act,id=el.dataset.id,qi=S.cur;
  if(a==='copyprev'){var prev=S.q[qi-1],nq={};Object.keys(prev).forEach(function(k){if(S.attend.indexOf(k)>-1) nq[k]={x:prev[k].x,y:prev[k].y,l:prev[k].l,m:!!prev[k].m};});S.q[qi]=nq;S.fm[qi]=S.fm[qi-1];S.gs[qi]=S.gs[qi-1]?S.gs[qi-1].map(function(g){return {x:g.x,y:g.y,l:g.l};}):null;}
  else if(a==='mercopen'){ui.merc=true;ui.t=Date.now();render();var mi=document.getElementById('mname');if(mi) mi.focus();return;}
  else if(a==='mercadd'){
    var mn=document.getElementById('mname'),nm2=(mn&&mn.value.trim())||'';
    if(!nm2){var n3=mercCount()+1;nm2='용병'+n3;while(S.players.some(function(p){return p.name===nm2;})){n3++;nm2='용병'+n3;}}
    if(S.players.some(function(p){return p.name===nm2;})){toast('이미 있는 이름이에요');return;}
    var mid='p'+(S.seq++);S.players.push({id:mid,name:nm2,merc:true});S.attend.push(mid);sortPlayers();ui.merc=false;
  }
  else if(a==='delmerc'){setAttend(id,false);S.players=S.players.filter(function(p){return p.id!==id;});delete S.pc[id];}
  else if(a==='undo'){undo();return;}
  else if(a==='qprev'){S.cur=Math.max(0,S.cur-1);host.onCur&&host.onCur(S.cur);}
  else if(a==='qnext'){S.cur=Math.min(3,S.cur+1);host.onCur&&host.onCur(S.cur);}
  else if(a==='resetq'){S.q[qi]={};S.gs[qi]=null;toast((qi+1)+'쿼터를 초기화했어요');}
  else if(a==='resetall'){for(var rq=0;rq<4;rq++){S.q[rq]={};S.gs[rq]=null;}toast('전체 쿼터를 초기화했어요');}
  else if(a==='close'){closeOv();return;}
  else if(a==='colmenu'){
    if(ui.cm){ui.cm=null;}
    else{var mr=el.closest('.menu').getBoundingClientRect(),rr=el.getBoundingClientRect();ui.cm={mleft:mr.left,mright:mr.right,top:rr.top,bottom:rr.bottom};}
    rerenderKeep();return;
  }
  else if(a==='setcol'){
    var k=el.dataset.k; if(k) S.pc[ui.lmenu.id]=k; else delete S.pc[ui.lmenu.id];
    ui.cm=null;save();rerenderKeep();return;
  }
  else if(a==='tobench'){if(Date.now()-(ui.jt||0)<400) return;delete S.q[qi][id];ui.jig=null;ui.sel=null;save();render();toast(pname(id)+' 벤치로 이동');return;}
  else if(a==='help'){ui.help=!ui.help;render();return;}
  else if(a==='pick'){
    var s=slotsOf(qi)[ui.picker.slot];
    if(onPitch(qi)>=11){toast('필드에 이미 11명이 있어요');ui.picker=null;render();return;}
    placeAtSlot(qi,id,s);ui.picker=null;
  }
  else if(a==='setlab'){
    if(ui.lmenu.slot!==undefined){ensureGs(qi)[ui.lmenu.slot].l=el.dataset.l;}
    else{var p=S.q[qi][ui.lmenu.id];if(p){p.l=el.dataset.l;p.m=true;}}
    ui.lmenu=null;ui.cm=null;
  }
  else if(a==='autolab'){var p2=S.q[qi][ui.lmenu.id];if(p2){p2.m=false;p2.l=autoLabel(qi,p2.x,p2.y);}ui.lmenu=null;ui.cm=null;}
  save();render();
});
on(root,'change',function(e){
  if(e.target.id==='qsel'){S.cur=+e.target.value;host.onCur&&host.onCur(S.cur);render();}
  if(e.target.id==='fm'){setFormation(S.cur,e.target.value);save();render();}
});
on(root,'keydown',function(e){
  if(e.target.id==='mname'&&e.key==='Enter'){e.preventDefault();var b2=root.querySelector('[data-act="mercadd"]');if(b2) b2.click();}
});
on(document,'keydown',function(e){
  if(e.key==='Escape'&&(ui.picker||ui.lmenu||ui.merc)){closeOv();return;}
  if((e.ctrlKey||e.metaKey)&&!e.altKey){
    var k=e.key.toLowerCase(),t=e.target&&e.target.tagName;
    if(k!=='z'&&k!=='y') return;
    if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT') return;
    e.preventDefault();
    if(drag) return;
    if(k==='y'||(k==='z'&&e.shiftKey)) redo(); else undo();
  }
});
on(document,'selectstart',function(e){var t=e.target.nodeType===1?e.target:e.target.parentElement;if(t&&t.closest('.menu'))e.preventDefault();});
on(document,'contextmenu',function(e){if(e.target.closest('[data-drag],.menu')) e.preventDefault();});
/* ---------- 드래그 / 탭 / 길게 누르기 ---------- */
var drag=null,ghost=null;
var loupe=null;
function loupeStart(){
  var pc=document.querySelector('.pitch'),f=document.getElementById('field'); if(!pc||!f||!ghost) return;
  var fr=f.getBoundingClientRect(),pr=pc.getBoundingClientRect();
  var inner=document.createElement('div');inner.className='li';inner.style.width=pr.width+'px';inner.style.height=pr.height+'px';
  var cl=pc.cloneNode(true);cl.style.width=pr.width+'px';
  var ids=cl.querySelectorAll('[id]');for(var i=0;i<ids.length;i++) ids[i].removeAttribute('id');
  if(drag){var me=cl.querySelector('[data-pid="'+drag.id+'"]');if(me)me.remove();}
  var xs=cl.querySelectorAll('.pb,.pbg,.xb');for(var j=0;j<xs.length;j++) xs[j].remove();
  inner.appendChild(cl);
  var g=ghost.cloneNode(true);g.style.position='absolute';g.style.zIndex=5;inner.appendChild(g);
  var lp=document.createElement('div');lp.className='loupe';lp.appendChild(inner);
  
  document.body.appendChild(lp);
  loupe={el:lp,inner:inner,g:g,fr:fr,pr:pr};
}
function loupeMove(e){
  if(!loupe||!ghost) return;
  var L=loupe,k=1.7,gw=parseFloat(ghost.style.width),gh=parseFloat(ghost.style.height);
  var gl=parseFloat(ghost.style.left),gt=parseFloat(ghost.style.top);
  var cx=gl+gw/2-L.pr.left,cy=gt+gh/2-L.pr.top;
  L.g.style.left=(gl-L.pr.left)+'px';L.g.style.top=(gt-L.pr.top)+'px';
  L.inner.style.transform='translate('+(62-cx*k)+'px,'+(62-cy*k)+'px) scale('+k+')';
  var vw=window.innerWidth,x=Math.max(6,Math.min(vw-130,e.clientX-62)),y=e.clientY-gh-150;
  if(y<6) y=e.clientY+gh*0.5+60;
  L.el.style.left=x+'px';L.el.style.top=y+'px';
  var inF=gl+gw/2>=L.fr.left&&gl+gw/2<=L.fr.right&&gt+gh/2>=L.fr.top&&gt+gh/2<=L.fr.bottom;
  L.el.style.display=inF?'':'none';
}
function loupeEnd(){if(loupe){loupe.el.remove();loupe=null;}}
function restoreEl(d){loupeEnd();d.el.style.visibility='';d.el.classList.remove('dragging');}
function abortDrag(){
  if(!drag) return; clearTimeout(drag.lp); restoreEl(drag); drag=null;
  if(ghost){ghost.remove();ghost=null;}
}
function inR(x,y,r,m){return x>=r.left-m&&x<=r.right+m&&y>=r.top-m&&y<=r.bottom+m;}
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
/* 누른 요소를 그대로 복제해 손가락/커서를 따라 움직이게 한다 */
function makeGhost(d){
  if(d.src==='bench'){
    /* 벤치에서 끌 때: 포지션 칩 크기의 원 안에 이름만, 색은 벤치 카드와 동일 */
    var f=document.getElementById('field'),sz=40;
    if(f){var pr=document.createElement('div');pr.style.cssText='position:absolute;visibility:hidden;width:var(--cs);height:1px';f.appendChild(pr);sz=pr.offsetWidth||40;pr.remove();}
    var bg=document.createElement('div');bg.className='gh bghost';
    bg.textContent=d.el.querySelector('.bn')?d.el.querySelector('.bn').textContent:'';
    bg.style.cssText='position:fixed;margin:0;left:0;top:0;width:'+sz+'px;height:'+sz+'px;font-size:'+Math.max(8,Math.round(sz*.27))+'px;pointer-events:none;z-index:70';
    d.rect={left:d.rect.left,top:d.rect.top,width:sz,height:sz};d.gx=sz/2;d.gy=sz/2;
    document.body.appendChild(bg);return bg;
  }
  var el=d.el,r=d.rect,g=el.cloneNode(true);
  g.classList.remove('dragging'); g.classList.add('gh');
  ['data-drag','data-slot','data-src','id'].forEach(function(a){g.removeAttribute(a);});
  g.style.cssText='position:fixed;margin:0;transform:none;left:0;top:0;width:'+r.width+'px;height:'+r.height+'px;pointer-events:none;z-index:70;font-size:'+getComputedStyle(el).fontSize;
  var pbs=g.querySelectorAll('.pb');for(var k=0;k<pbs.length;k++) pbs[k].remove();
  var o=el.querySelectorAll('.c,.nm'),n=g.querySelectorAll('.c,.nm');
  for(var i=0;i<o.length;i++) n[i].style.fontSize=getComputedStyle(o[i]).fontSize;
  document.body.appendChild(g); return g;
}
on(document,'pointerdown',function(e){
  if((ui.jig||ui.sel)&&!ui.lmenu){var ce=e.target.closest('.chip');if(!ce||(ce.dataset.pid!==ui.jig&&ce.dataset.pid!==ui.sel)) clearJig();}
  if(ui.picker||ui.lmenu||(e.pointerType==='mouse'&&e.button!==0)) return;
  var el=e.target.closest('[data-drag]'); if(!el) return;
  if(e.target.closest('.pb,.mx,.xb')) return;
  e.preventDefault();
  var r=el.getBoundingClientRect(),src=el.dataset.src;
  drag={id:el.dataset.pid,idx:+el.dataset.idx,src:src,sx:e.clientX,sy:e.clientY,moved:false,el:el,rect:r,lp:null,nm:!!e.target.closest('.nm'),pt:e.pointerType,jigged:false,
    gx:src==='bench'?r.width/2:e.clientX-r.left, gy:src==='bench'?r.height/2:e.clientY-r.top};
  if(src==='pitch'||src==='guide'){
    drag.lp=setTimeout(function(){
      if(drag&&!drag.moved){if(drag.src==='guide'){var ix=drag.idx;abortDrag();openGuideMenu(ix);}else{drag.jigged=true;ui.jig=drag.id;drag.el.classList.add('jig');if(navigator.vibrate)try{navigator.vibrate(15)}catch(_){}}}
    },480);
  }
});
on(document,'pointermove',function(e){
  if(!drag) return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>6){
    drag.moved=true;clearTimeout(drag.lp);ghost=makeGhost(drag);ui.sel=null;ui.jig=null;if(drag.pt!=='mouse'){ghost.style.left=(e.clientX-drag.gx)+'px';ghost.style.top=(e.clientY-drag.gy)+'px';loupeStart();}
    if(drag.src==='bench') drag.el.classList.add('dragging'); else drag.el.style.visibility='hidden';
  }
  if(drag.moved){ghost.style.left=(e.clientX-drag.gx)+'px';ghost.style.top=(e.clientY-drag.gy)+'px';loupeMove(e);e.preventDefault();}
},{passive:false});
function tapBench(id){
  var qi=S.cur;
  if(onPitch(qi)>=11){toast('필드에 이미 11명이 있어요');return;}
  var free=null;slotsOf(qi).forEach(function(s){if(!free&&!slotTaken(qi,s)) free=s;});
  S.q[qi][id]=free?{x:free.x,y:free.y,l:free.l,m:false}:{x:50,y:50,l:'CM',m:false};
  save();render();
}
function endDrag(e,cancel){
  if(!drag) return;
  var d=drag; clearTimeout(d.lp); drag=null; if(ghost){ghost.remove();ghost=null;} restoreEl(d);
  if(cancel) return;
  var qi=S.cur,q=S.q[qi];
  if(!d.moved){
    if(d.jigged){ui.jt=Date.now();return;}
    if(d.src==='pitch'){
      var was=ui.sel===d.id;
      if(d.nm&&(was||d.pt==='mouse')){openLabelMenu(d.el);return;}
      if(was){clearJig();return;}
      clearJig();ui.sel=d.id;d.el.classList.add('chipsel');return;
    }
    if(d.src==='bench') tapBench(d.id);
    return;
  }
  ui.nc=Date.now();ui.jig=null;ui.sel=null;
  /* 보이는 모양(복제본)의 중심이 곧 놓이는 위치 */
  var cx=e.clientX-d.gx+d.rect.width/2, cy=e.clientY-d.gy+d.rect.height/2;
  var bc=document.getElementById('bcol');
  if(d.src==='pitch'&&bc&&inR(cx,cy,bc.getBoundingClientRect(),0)){delete q[d.id];save();render();return;}
  var field=document.getElementById('field'); if(!field) return;
  var r=field.getBoundingClientRect();
  if(!inR(cx,cy,r,0)) return;
  var p={x:Math.round(clamp((cx-r.left)/r.width*100,4,96)*10)/10,y:Math.round(clamp((cy-r.top)/r.height*100,3,97)*10)/10};
  if(d.src==='guide'){var arr=ensureGs(qi);arr[d.idx].x=p.x;arr[d.idx].y=p.y;save();render();return;}
  /* 다른 선수와 거의 겹치게 놓으면 서로 교체 */
  var target=null,best=5;
  Object.keys(q).forEach(function(k){if(k===d.id) return;var dd=dist(q[k],p);if(dd<best){best=dd;target=k;}});
  if(target){
    if(d.src==='pitch'){
      var a=q[d.id],b=q[target],tx=a.x,ty=a.y;
      a.x=b.x;a.y=b.y;b.x=tx;b.y=ty;relabel(qi,d.id);relabel(qi,target);
    }else{
      var b2=q[target];q[d.id]={x:b2.x,y:b2.y,l:b2.l,m:false};relabel(qi,d.id);delete q[target];
    }
    save();render();return;
  }
  if(d.src==='bench'&&onPitch(qi)>=11){toast('필드에 이미 11명이 있어요. 한 명을 먼저 빼 주세요');return;}
  if(d.src==='bench'){
    var sl0=field.querySelector('.slot');
    if(sl0){
      var diam=sl0.getBoundingClientRect().width/r.width*68,sg=null,sbest=diam;
      slotsOf(qi).forEach(function(s){if(slotTaken(qi,s)) return;var dd=dist(s,p);if(dd<sbest){sbest=dd;sg=s;}});
      if(sg){q[d.id]={x:sg.x,y:sg.y,l:sg.l,m:false};save();render();return;}
    }
  }
  var o=q[d.id]||{};
  q[d.id]={x:p.x,y:p.y,l:o.l,m:!!o.m};
  relabel(qi,d.id);
  save();render();
}
on(document,'pointerup',function(e){endDrag(e,false);});
on(document,'pointercancel',function(e){endDrag(e,true);});
/* ---------- 운동장 빈 곳을 좌우로 쓸어 쿼터 넘기기 (갤러리처럼 손가락을 따라 이동) ---------- */
var sw=null,swBusy=false,SW_GAP=12,SW_MS=220;
function gotoQuarter(n){
  if(n<0||n>3||n===S.cur) return;
  clearJig(); S.cur=n; host.onCur&&host.onCur(S.cur); render();
}
/* 옆 쿼터를 미리 보여 주는 읽기 전용 운동장 */
function peekPane(n){
  var d=document.createElement('div'); d.className='field qs-peek'; d.setAttribute('aria-hidden','true'); d.inert=true;
  d.style.cssText='position:absolute;left:0;top:0;width:100%;pointer-events:none';
  d.innerHTML=PITCH_SVG+guidesHTML(n)+chipsHTML(n,false,'');
  return d;
}
function swPlace(s,x,anim){
  var step=s.W+SW_GAP,tr=anim?'transform '+SW_MS+'ms cubic-bezier(.2,.8,.2,1)':'none';
  s.f.style.transition=tr; s.f.style.transform='translateX('+x+'px)';
  [-1,1].forEach(function(d){var p=s.panes[d]; if(p){p.style.transition=tr; p.style.transform='translateX('+(x+d*step)+'px)';}});
}
function swStart(){
  var f=document.getElementById('field'); if(!f){sw=null;return;}
  var pitch=f.parentElement;
  sw.mode='h'; sw.f=f; sw.pitch=pitch; sw.W=f.offsetWidth; sw.panes={}; sw.dx=0;
  pitch.style.position='relative'; pitch.style.overflow='hidden';
  [-1,1].forEach(function(d){var n=S.cur+d; if(n<0||n>3) return; var pn=peekPane(n); pitch.appendChild(pn); sw.panes[d]=pn;});
  swPlace(sw,0,false);
}
function swEnd(s,cancel){
  var dx=cancel?0:s.dx,dt=Math.max(1,Date.now()-s.t),v=dx/dt,dir=dx<0?1:-1,has=!!s.panes[dir];
  var go=!cancel&&has&&(Math.abs(dx)>s.W*.25||(Math.abs(v)>.45&&Math.abs(dx)>30));
  var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,ms=rm?0:SW_MS;
  swBusy=true;
  swPlace(s,go?-dir*(s.W+SW_GAP):0,!rm);
  setTimeout(function(){
    swBusy=false;
    if(!document.body.contains(s.f)) return; // 그 사이 화면이 다시 그려졌다면 할 일 없음
    if(go){gotoQuarter(S.cur+dir);return;}
    [-1,1].forEach(function(d){if(s.panes[d]) s.panes[d].remove();});
    s.f.style.transition='';s.f.style.transform='';s.pitch.style.position='';s.pitch.style.overflow='';
  },ms+20);
}
on(document,'pointerdown',function(e){
  sw=null;
  if(swBusy||drag||ui.picker||ui.lmenu||ui.merc||ui.help||(e.pointerType==='mouse'&&e.button!==0)) return;
  if(!e.target.closest||!e.target.closest('#field')) return;
  // 선수 칩·점선 자리·버튼은 제외하고, 운동장의 빈 곳에서 시작한 동작만 센다
  if(e.target.closest('[data-drag],.pb,.xb,.mx,button,.menu')) return;
  sw={x:e.clientX,y:e.clientY,t:Date.now(),id:e.pointerId,mode:null};
});
on(document,'pointermove',function(e){
  if(!sw||e.pointerId!==sw.id||drag) return;
  var dx=e.clientX-sw.x,dy=e.clientY-sw.y;
  if(!sw.mode){
    if(Math.abs(dx)<8&&Math.abs(dy)<8) return;
    if(Math.abs(dx)>Math.abs(dy)*1.2) swStart(); else {sw.mode='v';return;}
    if(!sw) return;
  }
  if(sw.mode!=='h') return;
  // 첫·마지막 쿼터에서 더 넘기려 하면 고무줄처럼 저항을 준다
  var x=sw.panes[dx<0?1:-1]?dx:dx*.3,lim=sw.W+SW_GAP;
  sw.dx=Math.max(-lim,Math.min(lim,x)); swPlace(sw,sw.dx,false);
});
on(document,'pointerup',function(e){
  var s=sw; if(!s||e.pointerId!==s.id) return; sw=null;
  if(s.mode==='h') swEnd(s,false);
});
on(document,'pointercancel',function(e){
  var s=sw; if(!s||e.pointerId!==s.id) return; sw=null;
  if(s.mode==='h') swEnd(s,true);
});


  function render(){
    root.innerHTML=lineupHTML()+overlayHTML();
    setupBslide();
    if(ui.merc){var mi=document.getElementById('mname');if(mi) mi.focus();}
  }
  render();
  return function destroy(){
    cleanups.forEach(function(f){f();});
    if(ghost){ghost.remove();ghost=null;}
    var lp=document.querySelector('.loupe');if(lp) lp.remove();
    var t=document.querySelector('.toast');if(t) t.remove();
    clearTimeout(tm);
    root.innerHTML='';
  };
}
