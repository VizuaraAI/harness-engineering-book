// simple site password gate (client-side deterrent)
(function(){
  var KEY="he_gate_ok", PASS="harness2026";
  try{ if(sessionStorage.getItem(KEY)==="1") return; }catch(e){}
  document.documentElement.style.overflow="hidden";
  function mount(){
    var ov=document.createElement("div");
    ov.id="__gate";
    ov.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#0b0f14;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace";
    ov.innerHTML='<form id="__gf" style="text-align:center;color:#cfe3f0;width:320px;max-width:82vw">'
      +'<div style="font-size:14px;margin-bottom:16px;letter-spacing:.3px;opacity:.85">Vizuara · Harness Engineering</div>'
      +'<div style="font-size:12px;margin-bottom:12px;opacity:.6">This site is private. Enter the password.</div>'
      +'<input id="__gp" type="password" autocomplete="current-password" placeholder="password" style="padding:11px 13px;width:100%;box-sizing:border-box;border-radius:9px;border:1px solid #26333f;background:#111820;color:#dff;font-family:inherit;font-size:14px;outline:none">'
      +'<div id="__ge" style="color:#e77b7b;height:16px;font-size:12px;margin-top:9px"></div>'
      +'<button type="submit" style="margin-top:4px;padding:10px 22px;border-radius:9px;border:0;background:#2f8f6b;color:#fff;cursor:pointer;font-family:inherit;font-size:13px">Enter &rarr;</button>'
      +'</form>';
    document.body.appendChild(ov);
    var inp=document.getElementById("__gp");
    inp.focus();
    document.getElementById("__gf").addEventListener("submit",function(e){
      e.preventDefault();
      if(inp.value===PASS){ try{sessionStorage.setItem(KEY,"1");}catch(e){} ov.remove(); document.documentElement.style.overflow=""; }
      else { document.getElementById("__ge").textContent="Incorrect password"; inp.value=""; inp.focus(); }
    });
  }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded",mount);
})();

// theme toggle
(function(){
  var THEMES=[["terminal","Terminal"],["light","Light"]];
  var saved=localStorage.getItem("ke-theme")||"terminal";
  document.documentElement.setAttribute("data-theme",saved);
  var btn=document.getElementById("theme-btn");
  function label(){var t=document.documentElement.getAttribute("data-theme");
    btn.textContent=(THEMES.find(x=>x[0]===t)||THEMES[0])[1];}
  if(btn){label();btn.onclick=function(){
    var t=document.documentElement.getAttribute("data-theme");
    var nt=t==="terminal"?"light":"terminal";
    document.documentElement.setAttribute("data-theme",nt);
    localStorage.setItem("ke-theme",nt);label();};}
})();

// ⌘K search
(function(){
  var modal=document.getElementById("search-modal"),
      input=document.getElementById("search-input"),
      results=document.getElementById("search-results"),
      open=document.getElementById("search-open");
  if(!modal) return;
  var DATA=null, sel=0, cur=[];
  function load(){ if(DATA) return Promise.resolve(DATA);
    return fetch((window.SEARCH_BASE||"")+"search.json").then(r=>r.json()).then(d=>DATA=d); }
  function show(){ modal.classList.add("open"); input.value=""; input.focus(); load().then(()=>render("")); }
  function hide(){ modal.classList.remove("open"); }
  function render(q){
    q=q.toLowerCase().trim();
    cur=!q?DATA.slice(0,8):DATA.filter(function(a){
      return (a.t+" "+a.sec+" "+a.chip+" "+a.b).toLowerCase().indexOf(q)>=0;
    }).slice(0,20);
    sel=0;
    results.innerHTML=cur.map(function(a,i){
      var chip=a.chip?'<span class="chip">'+a.chip+'</span>':'';
      return '<a class="sr-item'+(i===0?' sel':'')+'" data-u="'+a.u+'">'
        +'<div class="sr-title">'+a.t+chip+'</div><div class="sr-sec">'+a.sec+'</div></a>';
    }).join("")||'<div class="sr-item">no matches</div>';
    Array.prototype.forEach.call(results.querySelectorAll(".sr-item"),function(el){
      el.onclick=function(){go(el.getAttribute("data-u"));};});
  }
  function go(u){ if(u) window.location.href=(window.SEARCH_BASE||"")+u; }
  function move(d){ var items=results.querySelectorAll(".sr-item"); if(!items.length)return;
    items[sel]&&items[sel].classList.remove("sel"); sel=(sel+d+items.length)%items.length;
    items[sel].classList.add("sel"); items[sel].scrollIntoView({block:"nearest"}); }
  if(open) open.onclick=show;
  input&&(input.oninput=function(){render(input.value);});
  document.addEventListener("keydown",function(e){
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();modal.classList.contains("open")?hide():show();}
    if(!modal.classList.contains("open"))return;
    if(e.key==="Escape")hide();
    else if(e.key==="ArrowDown"){e.preventDefault();move(1);}
    else if(e.key==="ArrowUp"){e.preventDefault();move(-1);}
    else if(e.key==="Enter"){e.preventDefault();cur[sel]&&go(cur[sel].u);}
  });
  modal.addEventListener("click",function(e){if(e.target===modal)hide();});
})();

// quiz
(function(){
  var quiz=document.querySelector(".quiz"); if(!quiz) return;
  var score=0, scoreEl=document.getElementById("quiz-score"),
      total=quiz.getAttribute("data-total")||"0";
  Array.prototype.forEach.call(quiz.querySelectorAll(".quiz-q"),function(q){
    var correct=parseInt(q.getAttribute("data-correct"),10);
    var opts=q.querySelectorAll(".q-opt");
    Array.prototype.forEach.call(opts,function(opt){
      opt.addEventListener("click",function(){
        if(q.classList.contains("answered")) return;
        q.classList.add("answered");
        var pick=parseInt(opt.getAttribute("data-i"),10);
        opts[correct].classList.add("correct");
        if(pick===correct){ score++; }
        else { opt.classList.add("wrong"); }
        Array.prototype.forEach.call(opts,function(o){o.disabled=true;});
        if(scoreEl) scoreEl.textContent=score+" / "+total;
      });
    });
  });
})();
