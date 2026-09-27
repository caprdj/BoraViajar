'use strict';
function renderTripSwitcher() {
  $('#trip-switcher').innerHTML='<option value="">Minhas viagens</option>'+library.trips.map(t=>`<option value="${esc(t.id)}" ${page!=='viagens' && t.id===library.active_trip_id?'selected':''}>${esc(t.nome)}</option>`).join('');
  $('[data-action="settings"]').hidden=!state.trip || page==='viagens';
}
function tripsPage() {
  return heading('Minhas viagens','Cada viagem com suas etapas, escolhas e planos.', '<button class="button primary" data-action="new-trip">+ Nova viagem</button>')+
    '<p class="notice">Os valores incluem as despesas registradas e as hospedagens escolhidas. Moedas diferentes são exibidas separadamente.</p>'+
    (library.trips.length?'<div class="cards">'+library.trips.map(t=>{
      const scoped=TravelTrips.view(library,t.id), totals=budget(TravelCore.effectiveBudget(scoped));
      const duration=t.data_inicio && t.data_fim?Math.round((Date.parse(t.data_fim+'T00:00:00Z')-Date.parse(t.data_inicio+'T00:00:00Z'))/86400000)+1:null;
      const pending=Object.fromEntries(Object.entries(totals).map(([currency,v])=>[currency,{total:v.total-v.paid}]));
      return `<article class="record"><span class="tag">${esc(t.situacao || 'EM ANÁLISE')}</span><h2>${esc(t.nome)}</h2><p>${esc(t.destino_principal?.cidade || 'Destino a definir')}</p><p>${date(t.data_inicio)} — ${date(t.data_fim)} · ${Number.isFinite(duration)?duration+' dia(s)':'Duração a definir'}</p><dl class="trip-totals"><dt>Orçamento estimado</dt><dd>${totalText(totals)}</dd><dt>Já pago</dt><dd>${totalText(totals,'paid')}</dd><dt>Pendente</dt><dd>${totalText(pending)}</dd></dl><div class="record-actions"><button class="button primary" data-action="open-trip" data-id="${esc(t.id)}">Abrir viagem</button><button class="button" data-action="edit-trip" data-id="${esc(t.id)}">Editar</button><button class="button" data-action="duplicate-trip" data-id="${esc(t.id)}">Duplicar</button><button class="button danger" data-action="delete-trip" data-id="${esc(t.id)}">Excluir</button></div></article>`;
    }).join('')+'</div>':'<section class="empty"><h2>Seu próximo destino começa aqui</h2><p>Crie uma viagem para organizar suas etapas e seu planejamento.</p></section>');
}
function activateTrip(id, navigate=true) {
  const next=structuredClone(library);next.active_trip_id=id;
  if(!persist(next))return false;
  search='';filter='';stageFilter='';editing=null;importMode='';$('#file-input').value='';
  if($('#editor').open)$('#editor').close();
  if(navigate)location.hash='inicio';
  render();return true;
}
function newTripEditor() {
  const trip={id:TravelTrips.uid(),nome:'',origem:'',destino_principal:{cidade:'',estado:''},data_inicio:'',data_fim:'',motivo:'',preferencias:{interesses:[]},situacao:'EM ANÁLISE'};
  editing={key:'trip',old:trip,newTrip:true};
  $('#dialog-title').textContent='Nova viagem';
  $('#fields').innerHTML=tripFields.map(f=>fieldHTML(f,trip)).join('');
  $('#form-error').textContent='';$('#editor').showModal();
}
document.addEventListener('change',e=>{
  if(e.target.id!=='trip-switcher')return;
  if(!e.target.value){location.hash='viagens';render();}else activateTrip(e.target.value);
});
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action,id=button.dataset.id;
  try {
    if(action==='new-trip')newTripEditor();
    if(action==='open-trip')activateTrip(id);
    if(action==='edit-trip' && activateTrip(id,false))openEditor(null,true);
    if(action==='duplicate-trip' && persist(TravelTrips.duplicate(library,id))) {render();toast('Cópia criada com novos identificadores.');}
    if(action==='delete-trip') {
      const trip=library.trips.find(t=>t.id===id);if(!trip)return;
      const count=Object.values(library.records).reduce((n,list)=>n+list.filter(r=>r.viagem_id===id).length,0);
      if(confirm(`Excluir “${trip.nome}” e seus ${count} registros vinculados? Esta ação não pode ser desfeita. Exporte um backup se precisar guardar uma cópia.`) && persist(TravelTrips.remove(library,id))) {stageFilter='';render();toast('Viagem excluída.');}
    }
  } catch(error) {toast(error.message);}
});
