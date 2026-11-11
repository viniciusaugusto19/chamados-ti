"use strict";
/* ---------------- SLA ---------------- */
var SLA = [
  {n:"Alta",                h:4,   t:"Até 4 horas úteis — operação parada ou risco de perda de dados"},
  {n:"Média",               h:8,   t:"Até 1 dia útil (8h) — falha parcial com alternativa temporária"},
  {n:"Baixa",               h:24,  t:"Até 3 dias úteis (24h) — dúvidas, melhorias, sem impacto direto"},
  {n:"N2 Presencial",       h:72,  t:"Agendamento em 72h úteis"},
  {n:"N2 P&D",              h:8,   t:"8h úteis"},
  {n:"ICL Hardware",        h:16,  t:"2 dias úteis"},
  {n:"ICL Software",        h:24,  t:"3 dias úteis"},
  {n:"ICL Calibração",      h:120, t:"15 dias úteis"},
  {n:"ICL API",             h:24,  t:"3 dias úteis"},
  {n:"ICL Dashboard",       h:24,  t:"3 dias úteis"}
];
var ETAPAS = ["Registro de Chamado","Disparo de alertas","Análise do chamado",
              "Em atendimento","Aguardando terceiros (Pausa)","Automação de Conclusão","Concluir"];

/* ---------------- Bitrix: processo 1032 (Chamado Técnico) ---------------- */
var B = {
  tipo: 1032,
  portal: "https://straylight.bitrix24.com.br",
  campo: {
    categoria:   "ufCrm11_1751054181669",
    prioridade:  "ufCrm11_1759935160305",
    canal:       "ufCrm11_1755618058164",
    detalhes:    "ufCrm11_1751284890540",
    descricao:   "ufCrm11_1724351543085",
    resolucao:   "ufCrm11_1751290355233",
    testes:      "ufCrm11_1755618106980",
    passos:      "ufCrm11_1755615692022",
    pausaMotivo: "ufCrm11_1764332637629",
    pausaIni:    "ufCrm11_1755624999423",
    pausaFim:    "ufCrm11_1755624321694"
  }
};
var etapasBitrix = {};   /* stageId -> {nome, semantica} */
var etapasLista  = [];   /* [{id, nome, semantica}] na ordem do funil */
var motivosPausa = [];   /* [{id, nome}] do campo Ticket pausado motivo */
var itemAtual    = null; /* chamado carregado na aba Documentar */

/* a prioridade no Bitrix vem com o SLA escrito junto; casamos pelo começo do rótulo */
function slaDeLabel(label){
  if(!label) return null;
  var txt = String(label);
  var achado = null;
  for(var i=0;i<SLA.length;i++){
    if(txt.indexOf(SLA[i].n) === 0 && (!achado || SLA[i].n.length > achado.n.length)) achado = SLA[i];
  }
  return achado;
}
function rotuloCurto(label){
  var s = slaDeLabel(label);
  return s ? s.n : (label ? String(label).split(",")[0].slice(0,22) : "—");
}
