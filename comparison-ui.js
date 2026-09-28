'use strict';
const comparisonSelection = new Set();
const comparisonLabels = {
  HOSPEDAGEM:'Hospedagem',TRANSPORTE:'Transporte',ALIMENTAÇÃO:'Alimentação',ATIVIDADES:'Atividades',EVENTOS:'Eventos',OUTROS:'Outros',
};
function comparisonAmounts(amounts) {
  if(amounts===null)return 'A definir';
  const entries=Object.entries(amounts || {});
  return entries.length?entries.map(([currency,value])=>money(value,currency)).join(' + '):money(0);
}
function comparisonPage() {
  const summaries=TravelComparison.compare(library,[...comparisonSelection]);
  if(summaries.length<2) return heading('Comparar viagens','Veja custos e detalhes logísticos lado a lado.')+
    '<section class="empty"><h2>Selecione pelo menos duas viagens</h2><p>Volte para Minhas viagens e marque os planejamentos que deseja comparar.</p><a class="button primary" href="#viagens">Selecionar viagens</a></section>';
  const row=(label,render,className='')=>`<div class="comparison-row ${className}" role="row"><strong class="comparison-label" role="rowheader">${label}</strong>${summaries.map(summary=>`<div role="cell">${render(summary)}</div>`).join('')}</div>`;
  const dates=summary=>summary.trip.data_inicio && summary.trip.data_fim?`${date(summary.trip.data_inicio)} — ${date(summary.trip.data_fim)}`:'A definir';
  return heading('Comparar viagens',`${summaries.length} planejamentos selecionados.`,'<a class="button" href="#viagens">Alterar seleção</a>')+
    '<p class="notice">Valores em moedas diferentes permanecem separados. Esta comparação não atribui nota nem recomenda uma viagem.</p>'+
    `<div class="comparison-scroll" tabindex="0" aria-label="Comparação de viagens"><div class="comparison-table" role="table" style="--comparison-count:${summaries.length}">
      <div class="comparison-row comparison-head" role="row"><strong class="comparison-label" role="columnheader">Critério</strong>${summaries.map(summary=>`<div role="columnheader"><span class="tag">${esc(summary.trip.situacao || 'EM ANÁLISE')}</span><h2>${esc(summary.trip.nome)}</h2><small>${esc(summary.trip.destino_principal?.cidade || 'Destino a definir')}</small></div>`).join('')}</div>
      ${row('Período',dates)}${row('Duração',s=>s.duration?`${s.duration} dia(s)`:'A definir')}${row('Etapas',s=>s.counts.stages)}${row('Transportes',s=>s.counts.transports)}${row('Hospedagens escolhidas',s=>s.counts.chosenHotels)}
      ${TravelComparison.CATEGORIES.map(category=>row(comparisonLabels[category],s=>comparisonAmounts(s.categories[category]))).join('')}
      ${row('Total',s=>comparisonAmounts(s.financial.total),'comparison-total')}${row('Minha parte',s=>comparisonAmounts(s.personal.total),'comparison-total')}
      ${row('Pago',s=>comparisonAmounts(s.financial.paid))}${row('Minha parte paga',s=>comparisonAmounts(s.personal.paid))}
      ${row('Pendente',s=>comparisonAmounts(s.financial.pending))}${row('Minha parte pendente',s=>comparisonAmounts(s.personal.pending))}
      ${row('Custo/dia',s=>comparisonAmounts(s.financial.perDay))}${row('Minha parte/dia',s=>comparisonAmounts(s.personal.perDay))}
    </div></div>`;
}
function comparisonSelectionBar() {
  const available=new Set(library.trips.map(trip=>trip.id));
  for(const id of comparisonSelection)if(!available.has(id))comparisonSelection.delete(id);
  const count=comparisonSelection.size;
  return `<div class="comparison-actions"><span><strong>${count}</strong> ${count===1?'viagem selecionada':'viagens selecionadas'}</span><button class="button primary" data-action="compare-trips" ${count<2?'disabled':''}>Comparar viagens</button></div>`;
}
document.addEventListener('change',event=>{
  const input=event.target.closest('[data-compare-trip]');if(!input)return;
  if(input.checked)comparisonSelection.add(input.dataset.compareTrip);else comparisonSelection.delete(input.dataset.compareTrip);
  const bar=document.querySelector('.comparison-actions');if(bar)bar.outerHTML=comparisonSelectionBar();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action="compare-trips"]');if(button && comparisonSelection.size>=2)location.hash='comparar';
});
