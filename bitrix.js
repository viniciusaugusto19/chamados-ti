"use strict";
function bitrixCall(metodo, params){
  var wh = load(K.wh, "");
  if(!wh) return Promise.reject(new Error("sem webhook"));
  return fetch(wh + "/" + metodo + ".json", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(params || {})
  }).then(function(r){ return r.json(); })
    .then(function(j){
      if(j.error) throw new Error(j.error_description || j.error);
      return j;
    });
}


/* ---------------- carga do Bitrix ---------------- */
function carregarEtapas(){
  return bitrixCall("crm.status.list", {filter:{"ENTITY_ID":"DYNAMIC_" + B.tipo + "_STAGE_27"}, order:{SORT:"ASC"}})
    .then(function(j){
      etapasLista = (j.result || []).map(function(s){
        etapasBitrix[s.STATUS_ID] = {nome: s.NAME, semantica: s.SEMANTICS};
        return {id: s.STATUS_ID, nome: s.NAME, semantica: s.SEMANTICS};
      });
    })
    .catch(function(){ /* sem etapas nomeadas, seguimos com o id cru */ });
}
/* opções do campo "Ticket pausado motivo" — lista fechada no Bitrix */
function carregarMotivosPausa(){
  if(motivosPausa.length) return Promise.resolve();
  return bitrixCall("crm.item.fields", {entityTypeId: B.tipo})
    .then(function(j){
      var d = j.result && j.result.fields ? j.result.fields[B.campo.pausaMotivo] : null;
      motivosPausa = (d && d.items) ? d.items.map(function(i){ return {id:i.ID, nome:i.VALUE}; }) : [];
      var sel = $("dPausaMotivo");
      sel.innerHTML = '<option value="">—</option>';
      motivosPausa.forEach(function(m){
        var o = document.createElement("option"); o.value = m.id; o.textContent = m.nome; sel.appendChild(o);
      });
    })
    .catch(function(){ /* segue sem opções */ });
}
function carregarChamados(){
  var st = $("statusCarga");
  if(!load(K.wh, "")){ st.textContent = "Sem webhook. Conecte na aba Bitrix."; return; }
  st.textContent = "Carregando...";
  var todos = [], campos = B.campo;
  function pagina(start){
    return bitrixCall("crm.item.list", {
      entityTypeId: B.tipo,
      order: {id: "DESC"},
      start: start,
      select: ["id","title","stageId","createdTime","assignedById",
               campos.categoria, campos.prioridade, campos.detalhes]
    }).then(function(j){
      var itens = (j.result && j.result.items) ? j.result.items : [];
      todos = todos.concat(itens);
      if(j.next && todos.length < 300) return pagina(j.next);
    });
  }
  carregarEtapas()
    .then(function(){ return pagina(0); })
    .then(function(){
      var deBitrix = todos.map(function(it){
        var et = etapasBitrix[it.stageId] || {};
        return {
          id: it.id,
          titulo: it.title,
          categoria: it[campos.categoria],
          prioridade: it[campos.prioridade],
          detalhes: it[campos.detalhes],
          etapa: et.nome || it.stageId,
          semantica: et.semantica,
          aberto: it.createdTime,
          origem: "bitrix"
        };
      });
      var locais = chamados.filter(function(c){ return c.origem !== "bitrix"; });
      chamados = deBitrix.concat(locais);
      save(K.chamados, chamados);
      st.textContent = deBitrix.length + " chamados lidos do Bitrix em " +
        new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) + ".";
      renderPainel(); renderSelectChamados();
    })
    .catch(function(e){
      st.textContent = "Falhou: " + e.message + " — confira o webhook na aba Bitrix.";
    });
}
