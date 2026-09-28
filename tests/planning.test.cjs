const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../core.js');require('../trips.js');require('../comparison.js');
const planning=require('../planning.js');
function fixture(){
  const records=TravelTrips.emptyRecords(),trips=[
    {id:'A',nome:'Viagem A',destino_principal:{cidade:'Recife'},data_inicio:'2027-01-10',data_fim:'2027-01-12'},
    {id:'B',nome:'Viagem B',destino_principal:{cidade:'Natal'},data_inicio:'2027-01-12',data_fim:'2027-01-15'},
    {id:'C',nome:'Viagem C',destino_principal:{cidade:'Fortaleza'},data_inicio:'2027-01-18',data_fim:'2027-01-20'},
  ];
  records.orcamento.push({custo_id:'CA',viagem_id:'A',descricao:'A',valor:100,moeda:'BRL'},{custo_id:'CB',viagem_id:'B',descricao:'B',valor:50,moeda:'USD'});
  records.deslocamentos.push({deslocamento_id:'DA',viagem_id:'A',origem:'Casa',destino:'Recife',data_saida:'2027-01-10',hora_saida:'08:00',data_chegada:'2027-01-10',hora_chegada:'10:00'});
  records.compromissos.push({compromisso_id:'EA',viagem_id:'A',nome:'Evento A',data_inicio:'2027-01-12',hora_inicio:'09:00',data_fim:'2027-01-12',hora_fim:'11:00'},{compromisso_id:'EB',viagem_id:'B',nome:'Evento B',data_inicio:'2027-01-12',hora_inicio:'10:00',data_fim:'2027-01-12',hora_fim:'12:00'});
  return TravelTrips.validate({version:2,trips,active_trip_id:'A',records,combined_scenarios:[]});
}
test('detects overlaps and short consecutive gaps without replacement assumptions',()=>{const result=planning.proximity(fixture());assert.equal(result[0].type,'conflict');assert.equal(result[0].overlapDays,1);const opportunity=result.find(r=>r.a.id==='B'&&r.b.id==='C');assert.equal(opportunity.type,'opportunity');assert.equal(opportunity.gapDays,2);assert.match(opportunity.suggestion,/Avalie ligar/);});
test('combined scenario separates currencies and supports include, order and changed dates',()=>{const scenario={items:[{trip_id:'B',included:false,order:2},{trip_id:'A',included:true,order:1,data_inicio:'2027-02-01',data_fim:'2027-02-03'}]};const result=planning.scenarioSummary(fixture(),scenario);assert.deepEqual(result.totals,{BRL:100});assert.equal(result.availableDays,3);assert.equal(result.transports,1);assert.equal(result.commitments[0].scenario_date,'2027-02-03');scenario.items[0].included=true;assert.deepEqual(planning.scenarioSummary(fixture(),scenario).totals,{BRL:100,USD:50});});
test('global calendar links origins and flags date/time conflicts',()=>{const entries=planning.calendarEntries(fixture()),events=entries.filter(e=>e.type==='Evento');assert.equal(events.length,2);assert.ok(events.every(e=>e.conflicts.length));assert.equal(events[0].hash,'compromissos');assert.equal(events[0].trip_name,'Viagem A');});
test('version 2 migration adds scenarios without losing records and roundtrips them',()=>{const old=fixture();delete old.combined_scenarios;const migrated=TravelTrips.migrate(old);assert.deepEqual(migrated.combined_scenarios,[]);assert.equal(migrated.records.orcamento.length,2);migrated.combined_scenarios.push({id:'S1',nome:'As duas',items:[{trip_id:'A',included:true,order:1},{trip_id:'B',included:true,order:2}]});assert.deepEqual(TravelTrips.migrate(JSON.parse(JSON.stringify(migrated))),migrated);});
