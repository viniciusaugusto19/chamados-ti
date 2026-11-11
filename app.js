"use strict";
/* ---------------- abas ---------------- */
var tabs = document.querySelectorAll("nav.tabs button");
Array.prototype.forEach.call(tabs, function(b){
  b.addEventListener("click", function(){
    Array.prototype.forEach.call(tabs, function(o){
      o.setAttribute("aria-selected", o===b ? "true" : "false");
      var s = $("tab-" + o.dataset.tab); if(s) s.hidden = (o!==b);
    });
    if(b.dataset.tab === "painel") renderPainel();
    if(b.dataset.tab === "documentar") renderSelectChamados();
  });
});

$("btnTema").addEventListener("click", function(){
  var r = document.documentElement;
  var escuro = r.getAttribute("data-theme")==="dark" ||
    (!r.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  r.setAttribute("data-theme", escuro ? "light" : "dark");
  save(K.tema, escuro ? "light" : "dark");
});
(function(){ var t = load(K.tema, null); if(t) document.documentElement.setAttribute("data-theme", t); })();

/* ---------------- captura ---------------- */
function renderFila(){
  var ul = $("fila"); ul.innerHTML = "";
  $("filaVazia").hidden = fila.length > 0;
  $("pillFila").textContent = fila.length;
  fila.forEach(function(item, i){
    var li = document.createElement("li");
    li.innerHTML =
      '<div class="txt"><b>' + esc(item.quem || "sem nome") + '</b> — ' + esc(item.oque) + '</div>' +
      '<div class="when">' + esc(item.hora) + '</div>' +
      '<div class="acts">' +
        '<button class="mini" data-virar="' + i + '">virar chamado</button>' +
        '<button class="mini danger" data-del="' + i + '">apagar</button>' +
      '</div>';
    ul.appendChild(li);
  });
}
$("fila").addEventListener("click", function(e){
  var v = e.target.getAttribute("data-virar"), d = e.target.getAttribute("data-del");
  if(d !== null && d !== undefined){
    fila.splice(parseInt(d,10),1); save(K.fila, fila); renderFila(); return;
  }
  if(v !== null && v !== undefined){
    var it = fila[parseInt(v,10)];
    $("fSolicitante").value = it.quem || "";
    $("fDetalhes").value = it.oque || "";
    document.querySelector('nav.tabs button[data-tab="abrir"]').click();
    toast("Levado para o formulário. Complete os obrigatórios.");
  }
});
function addCaptura(){
  var quem = $("capQuem").value.trim(), oque = $("capOque").value.trim();
  if(!oque){ $("capOque").focus(); return; }
  var agora = new Date();
  fila.unshift({ quem:quem, oque:oque,
    hora: agora.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),
    iso: agora.toISOString() });
  save(K.fila, fila); $("capQuem").value=""; $("capOque").value=""; $("capQuem").focus(); renderFila();
}
$("capAdd").addEventListener("click", addCaptura);
["capQuem","capOque"].forEach(function(id){
  $(id).addEventListener("keydown", function(e){ if(e.key==="Enter") addCaptura(); });
});

/* ---------------- abrir chamado ---------------- */
(function(){
  var sel = $("fPrioridade");
  sel.innerHTML = '<option value="">—</option>';
  SLA.forEach(function(s){ var o=document.createElement("option"); o.textContent=s.n; sel.appendChild(o); });
  var se = $("fEtapa");
  ETAPAS.forEach(function(e){ var o=document.createElement("option"); o.textContent=e; se.appendChild(o); });
})();
$("fPrioridade").addEventListener("change", function(){
  var s = slaDe(this.value);
  $("slaHint").textContent = s ? s.t : "Escolha a prioridade para ver o prazo.";
});
$("btnLimpar").addEventListener("click", function(){
  ["fEmpresa","fCanal","fCategoria","fPrioridade","fDetalhes","fSolicitante","fEquipamento","fResponsavel","fTipo"]
    .forEach(function(id){ $(id).value = ""; });
  $("slaHint").textContent = "Escolha a prioridade para ver o prazo.";
  $("abrirAviso").textContent = "";
});
$("btnSalvarChamado").addEventListener("click", function(){
  var req = [["fEmpresa","Empresa"],["fCanal","Canal"],["fCategoria","Categoria"],
             ["fPrioridade","Prioridade"],["fDetalhes","Detalhes"]];
  var faltam = req.filter(function(r){ return !$(r[0]).value.trim(); }).map(function(r){ return r[1]; });
  if(faltam.length){
    $("abrirAviso").textContent = "Faltam: " + faltam.join(", ");
    $("abrirAviso").style.color = "var(--crit)";
    return;
  }
  var c = {
    id: "local-" + Date.now(),
    titulo: $("fDetalhes").value.trim().slice(0,60),
    empresa: $("fEmpresa").value, canal: $("fCanal").value,
    categoria: $("fCategoria").value, prioridade: $("fPrioridade").value,
    etapa: $("fEtapa").value || ETAPAS[0],
    solicitante: $("fSolicitante").value, equipamento: $("fEquipamento").value,
    detalhes: $("fDetalhes").value, aberto: new Date().toISOString(),
    origem: "local", doc: null
  };
  chamados.unshift(c); save(K.chamados, chamados);
  $("abrirAviso").style.color = "var(--good)";
  $("abrirAviso").textContent = "Salvo nesta página. Para gravar no Bitrix, conecte o webhook.";
  $("btnLimpar").click();
  toast("Chamado salvo.");
});
