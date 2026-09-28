const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../core.js');
require('../trips.js');
const comparison=require('../comparison.js');

function library() {
  const records=TravelTrips.emptyRecords();
  const trips=[
    {id:'A',nome:'Fortaleza',destino_principal:{cidade:'Fortaleza'},data_inicio:'2026-10-01',data_fim:'2026-10-05',situacao:'PLANEJADA'},
    {id:'B',nome:'Patagônia',destino_principal:{cidade:'El Calafate'},data_inicio:'',data_fim:'',situacao:'EM ANÁLISE'},
    {id:'C',nome:'Lisboa',destino_principal:{cidade:'Lisboa'},data_inicio:'2026-12-10',data_fim:'2026-12-10'},
  ];
  records.estadias.push({estadia_id:'EA',viagem_id:'A',nome:'Praia',numero_viajantes:2});
  records.hoteis.push({hotel_id:'HA',viagem_id:'A',estadia_id:'EA',nome:'Hotel',preco_total:500,escolhido:true,divisao:'IGUAL',status_custo:'PAGO'});
  records.orcamento.push(
    {custo_id:'A1',viagem_id:'A',estadia_id:'EA',categoria:'TRANSPORTE',valor:300,moeda:'BRL',status:'PAGO',divisao:'INDIVIDUAL'},
    {custo_id:'A2',viagem_id:'A',estadia_id:'EA',categoria:'ALIMENTAÇÃO',valor:200,moeda:'BRL',status:'ESTIMADO',divisao:'PERSONALIZADO',minha_parte:80},
    {custo_id:'A3',viagem_id:'A',categoria:'OUTROS',valor:100,moeda:'USD',status:'ESTIMADO'},
    {custo_id:'A4',viagem_id:'A',categoria:'EVENTOS',valor:999,moeda:'BRL',status:'CANCELADO'},
    {custo_id:'B1',viagem_id:'B',categoria:'ATIVIDADES',valor:120,moeda:'BRL',status:'PAGO'},
  );
  return TravelTrips.validate({version:2,trips,active_trip_id:'A',records});
}
test('compares two trips with inclusive duration, categories and missing dates',()=>{
  const [a,b]=comparison.compare(library(),['A','B']);
  assert.equal(a.duration,5);assert.equal(b.duration,null);assert.equal(a.counts.stages,1);assert.equal(a.counts.chosenHotels,1);
  assert.deepEqual(a.categories.HOSPEDAGEM,{BRL:500});assert.deepEqual(a.categories.EVENTOS,{});
  assert.equal(b.financial.perDay,null);assert.deepEqual(b.financial.total,{BRL:120});
});
test('rejects incomplete, invalid and reversed periods',()=>{
  assert.equal(comparison.duration({data_inicio:'2026-02-28',data_fim:'2026-02-30'}),null);
  assert.equal(comparison.duration({data_inicio:'2026-03-02',data_fim:'2026-03-01'}),null);
  assert.equal(comparison.duration({data_inicio:'2026-03-01'}),null);
});
test('keeps currencies separate and calculates total, paid, pending and per day',()=>{
  const a=comparison.tripSummary(library(),'A');
  assert.deepEqual(a.financial.total,{BRL:1000,USD:100});assert.deepEqual(a.financial.paid,{BRL:800,USD:0});
  assert.deepEqual(a.financial.pending,{BRL:200,USD:100});assert.deepEqual(a.financial.perDay,{BRL:200,USD:20});
});
test('reuses individual, equal and customized personal-share rules',()=>{
  const a=comparison.tripSummary(library(),'A');
  assert.deepEqual(a.personal.total,{BRL:630,USD:100});assert.deepEqual(a.personal.paid,{BRL:550,USD:0});
  assert.deepEqual(a.personal.pending,{BRL:80,USD:100});assert.deepEqual(a.personal.perDay,{BRL:126,USD:20});
});
test('compares three trips while keeping records isolated',()=>{
  const result=comparison.compare(library(),['A','B','C','A']);
  assert.equal(result.length,3);assert.deepEqual(result.map(item=>item.financial.total),[{BRL:1000,USD:100},{BRL:120},{}]);
  assert.equal(result[2].duration,1);
});
test('comparison remains correct after duplicating a trip',()=>{
  let data=library();data=TravelTrips.duplicate(data,'A');const copy=data.active_trip_id;
  const [original,duplicate]=comparison.compare(data,['A',copy]);
  assert.notEqual(original.id,duplicate.id);assert.deepEqual(duplicate.financial,original.financial);assert.deepEqual(duplicate.personal,original.personal);
});
test('linked manual hotel expense replaces the automatic amount without duplication',()=>{
  const data=library();data.records.orcamento.push({custo_id:'HOTEL_MANUAL',viagem_id:'A',hotel_id:'HA',estadia_id:'EA',categoria:'HOSPEDAGEM',valor:450,moeda:'BRL',status:'PAGO'});
  const summary=comparison.tripSummary(TravelTrips.validate(data),'A');
  assert.deepEqual(summary.categories.HOSPEDAGEM,{BRL:450});assert.deepEqual(summary.financial.total,{BRL:950,USD:100});
});
