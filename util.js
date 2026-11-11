"use strict";
/* ---------------- storage ---------------- */
var K = {fila:"ctip.fila", chamados:"ctip.chamados", wh:"ctip.wh", tema:"ctip.tema", jornada:"ctip.jornada"};
function load(k, fb){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ toast("Não consegui salvar neste navegador."); } }

var fila     = load(K.fila, []);
var chamados = load(K.chamados, []);

/* ---------------- util ---------------- */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function toast(msg){
  var t = document.createElement("div"); t.className="toast"; t.textContent=msg;
  document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 2600);
}
function hhmm(s){ var p=String(s||"").split(":"); var h=parseInt(p[0],10), m=parseInt(p[1],10);
  return {h:isNaN(h)?8:h, m:isNaN(m)?0:m}; }

/* horas úteis entre duas datas, respeitando jornada e dias úteis */
function horasUteis(ini, fim){
  var j = jornada();
  if(fim <= ini) return 0;
  var total = 0;
  var cur = new Date(ini.getTime());
  var guard = 0;
  while(cur < fim && guard++ < 20000){
    var dow = cur.getDay();
    if(j.dias.indexOf(String(dow)) === -1){
      cur.setDate(cur.getDate()+1); cur.setHours(0,0,0,0); continue;
    }
    var ab = new Date(cur); ab.setHours(j.ini.h, j.ini.m, 0, 0);
    var fe = new Date(cur); fe.setHours(j.fim.h, j.fim.m, 0, 0);
    var a = cur > ab ? cur : ab;
    var b = fim < fe ? fim : fe;
    if(b > a) total += (b - a) / 3600000;
    cur.setDate(cur.getDate()+1); cur.setHours(0,0,0,0);
  }
  return total;
}
function jornada(){
  var saved = load(K.jornada, null);
  var ini = hhmm(saved ? saved.ini : $("jorIni").value);
  var fim = hhmm(saved ? saved.fim : $("jorFim").value);
  var dias = (saved ? saved.dias : $("jorDias").value) || "12345";
  return {ini:ini, fim:fim, dias:String(dias)};
}
function slaDe(nome){ for(var i=0;i<SLA.length;i++){ if(SLA[i].n===nome) return SLA[i]; } return null; }
