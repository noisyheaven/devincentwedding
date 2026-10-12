/* ============ EDIT YOUR DETAILS HERE ============ */
// Wedding date/time for the countdown & calendar button (WIB = +07:00)
var WEDDING = new Date("2026-12-26T11:00:00+07:00");
var EVENT_TITLE = "Pernikahan Vincensius & Devi";
var EVENT_PLACE = "Gereja Katolik Santo Hieronimus, Tanjung Hulu, Pontianak";
var EVENT_NOTE  = "Pemberkatan 11.00 WIB. Resepsi 17.00-20.00 WIB di G Hotel, Jl. Jendral Urip No. 73, Pontianak.";

// Photos in the "images" folder (a burgundy placeholder shows until the file exists)
var PHOTOS = {
  cover: "images/cover.jpg",          // portrait photo of both of you (cover + top of page)
  groom: "images/groom.jpg",
  bride: "images/bride.jpg",
  gallery: ["images/gallery-1.jpg","images/gallery-2.jpg","images/gallery-3.jpg",
            "images/gallery-4.jpg","images/gallery-5.jpg","images/gallery-6.jpg",
            "images/gallery-7.jpg","images/gallery-8.jpg",]
};
// Music: put your own mp3 at audio/music.mp3

// Wishes (Ucapan & Doa): paste your Google Apps Script web app URL here (see README, step "WISHES").
// While empty, wishes are saved only in YOUR browser (test mode).
var WISHES_URL = "https://script.google.com/macros/s/AKfycbz802CLixLfLcfjH1zOP5iz8kfCa9XxOswNJPV6_v2zni1MCjL8Et8m-Kpsd2c2RwYGJw/exec";
/* ================================================= */

var $=function(id){return document.getElementById(id)};

// photos as backgrounds, only if the file exists
function withImage(el,src){var i=new Image();i.onload=function(){el.style.backgroundImage="url('"+src+"')";el.classList.add("ready")};i.src=src}
document.querySelectorAll("[data-photo]").forEach(function(el){withImage(el,PHOTOS[el.dataset.photo])});
PHOTOS.gallery.forEach(function(src,i){
  var d=document.createElement("div");d.className="bg rv";d.style.transitionDelay=((i%3)*120)+"ms";
  $("gal").appendChild(d);withImage(d,src);
});

// guest name from the link:  index.html?to=Budi+Santoso
var to=new URLSearchParams(location.search).get("to");
if(to)$("guest").textContent=to;

// open invitation
var bgm=$("bgm");
$("open").addEventListener("click",function(){
  $("cover").classList.add("gone");document.body.classList.remove("locked");
  $("float").hidden=false;
  bgm.play().then(function(){$("musicBtn").classList.add("on")}).catch(function(){});
});
bgm.addEventListener("error",function(){$("musicBtn").style.display="none"});
$("musicBtn").addEventListener("click",function(){
  if(bgm.paused){bgm.play();this.classList.add("on")}else{bgm.pause();this.classList.remove("on")}
});

// auto scroll
var auto=false,last=0,acc=0;
function step(t){
  if(!auto)return; acc+=(t-last)*0.04; last=t;
  if(acc>=1){window.scrollBy(0,Math.floor(acc));acc-=Math.floor(acc)}
  requestAnimationFrame(step);
}
function setAuto(on){auto=on;$("scrollBtn").classList.toggle("on",on);if(on){last=performance.now();requestAnimationFrame(step)}}
$("scrollBtn").addEventListener("click",function(){setAuto(!auto)});
["wheel","touchstart"].forEach(function(e){addEventListener(e,function(){if(auto)setAuto(false)},{passive:true})});

// countdown + calendar link
function pad(n){return n<10?"0"+n:n}
function tick(){
  var s=Math.max(0,Math.floor((WEDDING-new Date())/1000)),
  v=[[Math.floor(s/86400),"Hari"],[Math.floor(s%86400/3600),"Jam"],[Math.floor(s%3600/60),"Menit"],[s%60,"Detik"]];
  var cd=$("cd");
  if(cd.children.length!==4){
    cd.innerHTML=v.map(function(a){return "<div><strong>"+a[0]+"</strong><span>"+a[1]+"</span></div>"}).join("");
  }else{                                    // angka berubah -> memutar (flip), kotak tidak dibangun ulang
    v.forEach(function(a,i){var st=cd.children[i].firstChild;
      if(st.textContent!=a[0]){st.textContent=a[0];st.classList.remove("flip");void st.offsetWidth;st.classList.add("flip")}});
  }
}
tick();setInterval(tick,1000);
function g(d){return d.toISOString().replace(/[-:]|\.\d{3}/g,"")}
$("cal").href="https://www.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(EVENT_TITLE)+
  "&dates="+g(WEDDING)+"/"+g(new Date(+WEDDING+2*3600e3))+
  "&location="+encodeURIComponent(EVENT_PLACE)+"&details="+encodeURIComponent(EVENT_NOTE);

// scroll reveal
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{threshold:.15});
document.querySelectorAll(".rv,.zi").forEach(function(el){io.observe(el)});

function ago(t){var s=(Date.now()-t)/1000;
  if(s<60)return "baru saja"; if(s<3600)return Math.floor(s/60)+" menit lalu";
  if(s<86400)return Math.floor(s/3600)+" jam lalu"; return Math.floor(s/86400)+" hari lalu"}
function wishItem(w){
  var d=document.createElement("div");d.className="wi";
  var b=document.createElement("b");b.textContent=w.n;
  var p=document.createElement("p");p.textContent=w.m;
  var s=document.createElement("small");s.textContent=ago(w.t);
  d.appendChild(b);d.appendChild(p);d.appendChild(s);return d;
}
function renderWishes(list){
  var box=$("wishList");box.innerHTML="";
  if(!list.length){box.innerHTML='<div class="empty">Jadilah yang pertama mengirim ucapan.</div>';return}
  list.forEach(function(w){box.appendChild(wishItem(w))});
}
function localGet(){try{return JSON.parse(localStorage.getItem("wishes")||"[]")}catch(e){return[]}}
function loadWishes(){
  if(!WISHES_URL){renderWishes(localGet());$("wStatus").textContent="Mode uji coba: ucapan hanya tersimpan di browser ini.";return}
  fetch(WISHES_URL).then(function(r){return r.json()}).then(renderWishes)
    .catch(function(){$("wishList").innerHTML='<div class="empty">Ucapan belum dapat dimuat.</div>'});
}
loadWishes();
$("wishForm").addEventListener("submit",function(e){
  e.preventDefault();
  if($("wHp").value)return;                       // spam trap
  var w={n:$("wName").value.trim(),m:$("wMsg").value.trim(),t:Date.now()};
  if(!w.n||!w.m)return;
  var btn=$("wBtn"),st=$("wStatus");btn.disabled=true;st.textContent="Mengirim...";
  function done(){
    var box=$("wishList");if(box.querySelector(".empty"))box.innerHTML="";
    box.insertBefore(wishItem(w),box.firstChild);
    $("wMsg").value="";st.textContent="Terima kasih atas ucapan dan doanya.";btn.disabled=false;
  }
  function fail(){st.textContent="Gagal mengirim, silakan coba lagi.";btn.disabled=false}
  if(!WISHES_URL){try{var l=localGet();l.unshift(w);localStorage.setItem("wishes",JSON.stringify(l.slice(0,100)))}catch(x){}done();return}
  fetch(WISHES_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({n:w.n,m:w.m,h:""})})
    .then(function(r){return r.json()}).then(function(r){r.ok?done():fail()}).catch(fail);
});
