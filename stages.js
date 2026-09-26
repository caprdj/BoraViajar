'use strict';
let stageFilter = '';
const stageName = id => state.records.estadias.find(s=>s.estadia_id===id)?.nome || 'Sem etapa';
const stageOf = record => state.records.estadias.find(s=>s.estadia_id===record.estadia_id);
function configureStages() {
  Object.assign(modules.estadias,{title:'Etapas da viagem',short:'Etapas',singular:'etapa',description:'Uma viagem, diferentes momentos. Defina datas, companhia e planos para cada etapa.'});
  modules.estadias.fields=[field('nome','Nome da etapa','text',true),field('cidade','Cidade','text',true),field('ordem','Ordem na viagem','number',true),field('objetivo_principal','Objetivo',['CONGRESSO','TURISMO','TRABALHO','OUTRO']),field('data_inicio','Início / check-in','date'),field('data_fim','Fim / check-out','date'),field('numero_viajantes','Viajantes (incluindo você)','number',true),field('acompanhantes','Quem vai com você?'),obs];
  for(const key of ['hoteis','roteiro','orcamento','lugares','compromissos','deslocamentos']) modules[key].fields.unshift(field('estadia_id','Etapa da viagem','stage',key==='hoteis'));
  modules.hoteis.fields.splice(7,0,field('numero_quartos','Quartos cotados','number'));
  modules.hoteis.fields.find(f=>f.key==='preco_diaria').label='Diária por quarto (R$)';
  modules.hoteis.fields.find(f=>f.key==='numero_noites').label='Noites da cotação (vazio = etapa)';
  modules.hoteis.fields.find(f=>f.key==='preco_total').label='Total de todos os quartos (R$)';
  const sharing=[field('divisao','Como você paga?',['INDIVIDUAL','IGUAL','PERSONALIZADO']),field('minha_parte','Sua parte personalizada (R$)','number')];
  modules.hoteis.fields.push(...sharing,field('status_custo','Situação do custo',['ESTIMADO','CONFIRMADO','PAGO']));
  modules.orcamento.fields.push(...sharing);
  modules.orcamento.fields=modules.orcamento.fields.map(f=>f.key==='minha_parte'?{...f,label:'Sua parte personalizada (moeda da despesa)'}:f);
}
function scopedExpenses() { return rows('orcamento').filter(r=>!stageFilter || (stageFilter==='unassigned'?!r.estadia_id:r.estadia_id===stageFilter)); }
function personalTotals(items) { return budget(items.map(r=>({...r,valor:TravelCore.personalShare(r,stageOf(r))}))); }
function stageSelect() { return `<label class="stage-filter">Etapa <select id="stage-filter"><option value="">Todas as etapas</option><option value="unassigned" ${stageFilter==='unassigned'?'selected':''}>Sem etapa / geral</option>${rows('estadias').map(s=>`<option value="${esc(s.estadia_id)}" ${stageFilter===s.estadia_id?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></label>`; }
function stagesOverview() {
  return `<section class="panel"><div class="section-top"><h2>Uma viagem, várias etapas</h2><a class="text-link" href="#estadias">Organizar etapas ↗</a></div>${rows('estadias').length?`<div class="stage-strip">${[...rows('estadias')].sort((a,b)=>(numeric(a.ordem)||0)-(numeric(b.ordem)||0)).map(s=>`<a href="#estadias" class="stage-chip"><span class="eyebrow">ETAPA ${esc(s.ordem || '—')}</span><strong>${esc(s.nome)}</strong><small>${esc(s.cidade)} · ${TravelCore.travelers(s)} viajante(s)</small><small>${date(s.data_inicio)} → ${date(s.data_fim)}</small></a>`).join('')}</div>`:'<p class="muted">Separe o congresso dos dias de turismo e organize hospedagem, atividades e custos em cada momento.</p><button class="button primary" data-action="stage-model">Criar minhas 3 etapas</button>'}</section>`;
}
function stageToolbar() {
  if(page==='estadias') return `<div class="notice">Datas, número de viajantes e hospedagem podem mudar a cada etapa. A divisão de custos só é aplicada quando você escolhe IGUAL ou PERSONALIZADO.</div><div class="toolbar"><button class="button" data-action="stage-model">Modelo: congresso + turismo em 2 destinos</button></div>`;
  if(!['hoteis','roteiro','orcamento','lugares','compromissos','deslocamentos'].includes(page)) return '';
  let html=`<div class="stage-tools">${stageSelect()}<a class="text-link" href="#estadias">Gerenciar etapas ↗</a></div>`;
  if(page==='orcamento') html+=`<section class="panel share-summary"><span class="eyebrow">SUA PARTE NO PLANEJAMENTO</span><strong>${totalText(personalTotals(scopedExpenses()))}</strong><p class="muted">INDIVIDUAL: você paga tudo. IGUAL: divide entre os viajantes da etapa. PERSONALIZADO: usa a parte informada.</p></section>`;
  if(page==='hoteis' && !rows('estadias').length) html+='<p class="notice">Comece criando as etapas da viagem. Depois, vincule cada cotação à etapa correspondente.</p>';
  return html;
}
function stageCard(s) {
  const hotels=rows('hoteis').filter(h=>h.estadia_id===s.estadia_id), chosen=hotels.find(TravelCore.selected);
  const expenses=rows('orcamento').filter(r=>r.estadia_id===s.estadia_id);
  const itinerary=rows('roteiro').filter(r=>r.estadia_id===s.estadia_id);
  return `<article class="record stage-record"><span class="tag">ETAPA ${esc(s.ordem||'—')} · ${esc(s.objetivo_principal||'PLANEJAMENTO')}</span><h2>${esc(s.nome)}</h2><p class="muted">${esc(s.cidade)} · ${date(s.data_inicio)} → ${date(s.data_fim)}</p><p class="muted">${TravelCore.travelers(s)} viajante(s)${s.acompanhantes?' · '+esc(s.acompanhantes):''} · ${TravelCore.nights(s)??'—'} noites</p><div class="stage-facts"><span>Hospedagem<strong>${chosen?esc(chosen.nome):'A escolher'}</strong><small>${hotels.length} opção(ões)</small></span><span>Roteiro<strong>${itinerary.length} atividade(s)</strong></span><span>Total da etapa<strong>${totalText(budget(expenses))}</strong><small>Sua parte: ${totalText(personalTotals(expenses))}</small></span></div>${s.observacoes?`<p class="record-note">${esc(s.observacoes)}</p>`:''}<div class="record-actions"><button class="button" data-action="stage-hotels" data-id="${esc(s.estadia_id)}">Ver hotéis</button><button class="button" data-action="edit" data-id="${esc(s.estadia_id)}">Editar</button><button class="button danger" data-action="delete" data-id="${esc(s.estadia_id)}">Excluir</button></div></article>`;
}
function hotelCard(h) {
  const stage=stageOf(h), cost=TravelCore.hotelCost(h,stage), chosen=TravelCore.selected(h);
  const share=TravelCore.personalShare({valor:cost.total,divisao:h.divisao,minha_parte:h.minha_parte},stage);
  const mismatch=numeric(h.numero_noites)!==null && TravelCore.nights(stage)!==null && numeric(h.numero_noites)!==TravelCore.nights(stage);
  const validLink=/^https?:\/\//i.test(h.link||'');
  return `<article class="record ${chosen?'chosen':''}"><span class="tag">${esc(stageName(h.estadia_id))}</span>${chosen?'<span class="tag chosen-tag">✓ ESCOLHIDA</span>':''}<h2>${esc(h.nome)}</h2><div class="record-meta"><span>${esc(h.cidade || stage?.cidade || 'Cidade a definir')}</span><span>${stage?TravelCore.travelers(stage)+' viajante(s)':'Vincule uma etapa'}</span><span>${cost.nights??'—'} noites · ${cost.rooms} quarto(s)</span></div><div class="record-price">${cost.total===null?'Total a definir':money(cost.total)} <small class="muted">total da cotação</small></div>${cost.total!==null?`<p class="muted">Sua parte: ${share===null?'a definir':money(share)} · ${esc(h.divisao||'INDIVIDUAL')}</p>`:''}${h.nota?`<p class="muted">Nota publicada: ${esc(h.nota)} / ${esc(h.escala_notas_plataforma||'—')}</p>`:''}${mismatch?'<p class="notice">As noites desta cotação diferem das datas da etapa. Confira o preço antes de reservar.</p>':''}${h.preco_total!=='' && numeric(h.preco_total)!==null?'<p class="muted">Total cotado mantido. Se as datas ou os viajantes mudarem, atualize a cotação.</p>':''}${h.pontos_positivos?`<p class="record-note">✓ ${esc(h.pontos_positivos)}</p>`:''}${h.pontos_negativos?`<p class="record-note">Atenção: ${esc(h.pontos_negativos)}</p>`:''}${h.observacoes?`<p class="record-note">${esc(h.observacoes)}</p>`:''}<button class="button ${chosen?'':'primary'} choose-hotel" aria-pressed="${chosen}" data-action="choose-hotel" data-id="${esc(h.hotel_id)}">${chosen?'✓ Escolhida · retirar do orçamento':'Escolher e incluir no orçamento'}</button><div class="record-actions">${validLink?`<a class="button" href="${esc(h.link)}" target="_blank" rel="noopener noreferrer">Abrir oferta ↗</a>`:''}${safePrint(h.print_data)?`<button class="button" data-action="view-print" data-id="${esc(h.hotel_id)}">Ver print</button>`:''}<button class="button" data-action="edit" data-id="${esc(h.hotel_id)}">Editar</button><button class="button danger" data-action="delete" data-id="${esc(h.hotel_id)}">Excluir</button></div></article>`;
}
function expenseCard(r) {
  const share=TravelCore.personalShare(r,stageOf(r));
  return `<article class="record"><span class="tag">${esc(r.status||'ESTIMADO')}${r.automatico?' · DA HOSPEDAGEM':''}</span><h2>${esc(r.descricao)}</h2><p class="muted">${esc(stageName(r.estadia_id))} · ${esc(r.categoria||'OUTROS')}</p><div class="record-price">${money(r.valor,r.moeda||'BRL')}</div><p class="muted">Sua parte: ${share===null?'a definir':money(share,r.moeda||'BRL')} · ${esc(r.divisao||'INDIVIDUAL')}</p>${r.observacoes?`<p class="record-note">${esc(r.observacoes)}</p>`:''}<div class="record-actions">${r.automatico?`<button class="button" data-action="edit-hotel" data-id="${esc(r.hotel_id)}">Editar hospedagem e custo</button>`:`<button class="button" data-action="edit" data-id="${esc(r.custo_id)}">Editar</button><button class="button danger" data-action="delete" data-id="${esc(r.custo_id)}">Excluir</button>`}</div></article>`;
}
function recordDateError(key,r,next) {
  if(key==='estadias') {
    if(!Number.isInteger(numeric(r.ordem)) || numeric(r.ordem)<1) return 'A ordem da etapa deve ser um inteiro maior que zero.';
    const linked=[...next.records.roteiro,...next.records.compromissos].filter(v=>v.estadia_id===r.estadia_id);
    if(linked.some(v=>(r.data_inicio && (v.data||v.data_inicio) && (v.data||v.data_inicio)<r.data_inicio) || (r.data_fim && (v.data||v.data_fim||v.data_inicio)>(r.data_fim)))) return 'Há atividades ou compromissos fora desse período. Reajuste os registros antes de encurtar a etapa.';
  }
  const stage=next.records.estadias.find(s=>s.estadia_id===r.estadia_id);
  if(stage && ['roteiro','compromissos'].includes(key)) {
    const start=r.data||r.data_inicio,end=r.data||r.data_fim||r.data_inicio;
    if((stage.data_inicio && start && start<stage.data_inicio)||(stage.data_fim && end && end>stage.data_fim)) return 'A atividade deve ficar dentro das datas da etapa selecionada.';
  }
  return '';
}
function updateStageContext() {
  const el=$('#stage-context');if(!el || !editing)return;
  const form=$('#editor-form'),data=Object.fromEntries(new FormData(form));
  const stage=state.records.estadias.find(s=>s.estadia_id===data.estadia_id);
  let msg=stage?`${stage.nome}: ${TravelCore.travelers(stage)} viajante(s), ${date(stage.data_inicio)} a ${date(stage.data_fim)}.`:'';
  if(editing.key==='hoteis') {
    const cost=TravelCore.hotelCost(data,stage);
    msg+=` ${cost.nights??'—'} noites; total ${cost.total===null?'a definir':money(cost.total)}. A diária é por quarto; o total cotado, quando preenchido, já deve incluir todos os quartos e taxas.`;
  }
  if(['hoteis','orcamento'].includes(editing.key))msg+=' INDIVIDUAL = você paga tudo; IGUAL = divide pelo número de viajantes da etapa; PERSONALIZADO = informe sua parte.';
  el.textContent=msg;
}
function openStageModel() {
  editing={key:'stage-model',old:{}};
  $('#dialog-title').textContent='Congresso + dois destinos';
  $('#fields').innerHTML='<p class="muted field wide">Crie três etapas sem alterar os registros existentes. As datas ficam a definir. Nas etapas de turismo, sugerimos 2 viajantes (você + 1 pessoa); ajuste conforme necessário.</p>'+[
    field('cidade1','Cidade do congresso','text',true),field('cidade2','Cidade da segunda etapa','text',true),field('cidade3','Cidade da terceira etapa','text',true),field('viajantes','Viajantes no turismo','number',true)
  ].map(f=>fieldHTML(f,{cidade1:state.trip.destino_principal?.cidade||'Fortaleza',cidade2:state.trip.destino_principal?.cidade||'Fortaleza',cidade3:state.trip.destinos_adicionais?.[0]||'Jericoacoara',viajantes:2})).join('');
  $('#form-error').textContent='';$('#editor').showModal();
}
function saveStageModel(values) {
  if(!values.cidade1 || !values.cidade2 || !values.cidade3 || !Number.isInteger(numeric(values.viajantes)) || numeric(values.viajantes)<1) { $('#form-error').textContent='Informe as cidades e um número inteiro de viajantes maior que zero.';return; }
  const next=structuredClone(state),offset=Math.max(0,...next.records.estadias.map(s=>numeric(s.ordem)||0));
  [values.cidade1,values.cidade2,values.cidade3].forEach((cidade,i)=>next.records.estadias.push({estadia_id:nextID('estadias',next.records.estadias),nome:i===0?'Congresso':`Turismo em ${cidade}`,cidade,ordem:offset+i+1,numero_viajantes:i===0?1:numeric(values.viajantes),objetivo_principal:i===0?'CONGRESSO':'TURISMO',data_inicio:'',data_fim:'',acompanhantes:''}));
  if(persist(next)) { $('#editor').close();location.hash='estadias';render();toast('Três etapas criadas. Edite as datas e os acompanhantes.'); }
}
function safePrint(data) { return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data||''); }
function hotelAssistantHTML(h) {
  return `<section class="hotel-assistant field wide"><h3>Comece pelo link ou pelo print</h3><p class="muted">Cole o link no campo da hospedagem e use “Ler link”. Para um print, selecione a imagem e use “Ler texto do print”. Revise as sugestões antes de salvar.</p>${fieldHTML(field('link','Link da hospedagem','url'),h)}<div class="assist-buttons"><button type="button" class="button" data-action="read-link">Ler link</button><label class="button">Anexar print<input id="hotel-print" type="file" accept="image/png,image/jpeg,image/webp" class="file-pick"></label></div><div id="print-preview">${safePrint(h.print_data)?`<img src="${h.print_data}" alt="Print da cotação"><button type="button" class="button" data-action="remove-print">Remover print</button>`:''}</div><button type="button" class="button" data-action="read-print">Ler texto do print</button><label class="field">Texto da oferta (você também pode colar aqui)<textarea name="assist_text" id="assist-text" placeholder="Hotel..., total R$..., 3 noites"></textarea></label><button type="button" class="button" data-action="read-text">Sugerir campos pelo texto</button><p id="assist-status" role="status" class="muted">A leitura do print acontece no seu aparelho. Na primeira vez, requer internet para baixar o leitor. Links fornecem apenas os dados escritos no próprio endereço; preços devem vir da oferta.</p></section>`;
}
function applySuggestions(values) {
  const form=$('#editor-form');let count=0;
  for(const [key,value] of Object.entries(values)) { const input=form.elements.namedItem(key);if(input && !input.value && value!==null){input.value=value;count++;} }
  $('#assist-status').textContent=count?`${count} campo(s) sugerido(s). Revise preço, noites, quartos e hóspedes antes de salvar. Campos preenchidos foram preservados.`:'Nenhum campo novo identificado. Preencha os dados conferindo a oferta ou o print.';
  updateStageContext();
}
async function attachPrint(file) {
  if(!file || !editing || editing.key!=='hoteis')return;
  const session=editing;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>10*1024*1024)throw new Error('Use uma imagem JPG, PNG ou WebP de até 10 MB.');
  const url=URL.createObjectURL(file),img=new Image();
  try {
    img.src=url;await img.decode();
    if(img.width*img.height>32000000)throw new Error('A imagem é muito grande. Recorte a área da oferta e tente novamente.');
    const ratio=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement('canvas');
    canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const image=canvas.toDataURL('image/jpeg',.82);
    if(image.length>900000)throw new Error('Recorte a imagem para reduzir o tamanho do print.');
    if(editing!==session || !$('#editor').open)return;
    session.printData=image;
    $('#print-preview').innerHTML=`<img src="${image}" alt="Print da cotação"><button type="button" class="button" data-action="remove-print">Remover print</button>`;
    $('#assist-status').textContent='Print anexado. Use “Ler texto do print” para sugerir campos, ou consulte a imagem e preencha manualmente.';
  } finally {URL.revokeObjectURL(url);}
}
let ocrLoading;
function loadOCR() {
  if(window.Tesseract)return Promise.resolve();
  if(!ocrLoading) ocrLoading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.crossOrigin='anonymous';
    const timer=setTimeout(()=>{script.remove();ocrLoading=null;reject(new Error('O leitor demorou para carregar. Confira a conexão ou preencha usando o print.'));},25000);
    script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();ocrLoading=null;reject(new Error('Não foi possível baixar o leitor. Use o print como referência ou cole o texto da oferta.'));};document.head.append(script);
  });
  return ocrLoading;
}
async function readPrint() {
  const session=editing,data=session?.printData??session?.old?.print_data;
  if(!safePrint(data))throw new Error('Anexe um print primeiro.');
  if(session.ocrBusy)return;
  session.ocrBusy=true;const status=$('#assist-status');status.textContent='Preparando leitura. O primeiro uso pode levar um pouco mais de tempo…';
  let worker,timer;
  try {
    await loadOCR(); if(editing!==session || !$('#editor').open)return;
    const process=(async()=>{worker=await Tesseract.createWorker('por+eng',1,{logger:message=>{if(editing===session && $('#editor').open)status.textContent=message.status==='recognizing text'?`Lendo o print: ${Math.round(message.progress*100)}%`:'Carregando leitor de texto…';}});session.worker=worker; if(session.cancelled){await worker.terminate();throw new Error('Leitura cancelada.');} return worker.recognize(data);})();
    const result=await Promise.race([process,new Promise((_,reject)=>{timer=setTimeout(()=>{session.cancelled=true;reject(new Error('A leitura demorou demais. Tente um recorte menor ou cole o texto da oferta.'));},90000);})]);
    if(editing!==session || !$('#editor').open)return;
    $('#assist-text').value=result.data.text;applySuggestions(TravelCore.hotelText(result.data.text));
  } catch(error) {if(editing===session && $('#editor').open)status.textContent=error.message;}
  finally {clearTimeout(timer);session.ocrBusy=false;session.worker=null;if(worker)await worker.terminate().catch(()=>{});}
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action,id=button.dataset.id;
  try {
    if(action==='stage-model')openStageModel();
    if(action==='choose-hotel') {
      const hotel=rows('hoteis').find(h=>h.hotel_id===id);
      const previous=rows('hoteis').find(h=>h.estadia_id===hotel?.estadia_id && TravelCore.selected(h));
      if(previous?.status_custo==='PAGO')throw new Error('A hospedagem escolhida está marcada como paga. Revise a situação do custo antes de trocar ou retirar a escolha.');
      const manual=state.records.orcamento.filter(r=>r.hotel_id===previous?.hotel_id && r.status!=='CANCELADO');
      if(manual.length && !confirm('Existe uma despesa manual vinculada à hospedagem anterior. Ela será mantida; revise-a no orçamento para evitar duplicidade. Continuar?'))return;
      if(previous && previous.hotel_id!==id && !confirm(`Trocar “${previous.nome}” por “${hotel.nome}”? O custo automático anterior será substituído.`))return;
      if(persist(TravelCore.chooseHotel(state,id))){render();toast('Escolha e orçamento atualizados.');}
    }
    if(action==='edit-hotel') { const oldPage=page;page='hoteis';openEditor(id);page=oldPage; }
    if(action==='stage-hotels') { location.hash='hoteis';setTimeout(()=>{stageFilter=id;render();},0); }
    if(action==='read-link') { const input=$('#editor-form').elements.namedItem('link');const data=TravelCore.hotelLink(input.value);applySuggestions(data); }
    if(action==='read-text')applySuggestions(TravelCore.hotelText($('#assist-text').value));
    if(action==='remove-print'){editing.printData='';$('#print-preview').innerHTML='';}
    if(action==='read-print')await readPrint();
    if(action==='view-print') {
      const h=rows('hoteis').find(v=>v.hotel_id===id);if(!safePrint(h?.print_data))return;
      const dialog=document.createElement('dialog');dialog.className='print-dialog';dialog.innerHTML=`<h2>Print de ${esc(h.nome)}</h2><img src="${h.print_data}" alt="Print da oferta de hospedagem"><form method="dialog"><button class="button">Fechar</button></form>`;document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
    }
  } catch(error) { if($('#assist-status') && $('#editor').open)$('#assist-status').textContent=error.message;else toast(error.message); }
});
document.addEventListener('change',async e=>{
  if(e.target.id==='stage-filter'){stageFilter=e.target.value;render();}
  if(e.target.id==='hotel-print')try{await attachPrint(e.target.files[0]);}catch(error){$('#assist-status').textContent=error.message;}
  if(e.target.closest('#editor-form'))updateStageContext();
});
document.addEventListener('input',e=>{if(e.target.closest('#editor-form'))updateStageContext();});
document.addEventListener('DOMContentLoaded',()=>{
  $('#editor').addEventListener('close',()=>{if(editing){editing.cancelled=true;editing.worker?.terminate().catch(()=>{});} });
});
