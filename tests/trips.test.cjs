const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../core.js');
const t=require('../trips.js');
function legacy() {
  const records=t.emptyRecords();
  records.estadias=[{estadia_id:'E1',nome:'Etapa',numero_viajantes:2}];
  records.hoteis=[{hotel_id:'H1',estadia_id:'E1',escolhido:true,preco_total:600,print_data:'data:image/png;base64,ABC'}];
  records.orcamento=[{custo_id:'C1',hotel_id:'H1',estadia_id:'E1',valor:600,status:'PAGO'}];
  records.roteiro=[{roteiro_id:'R1',estadia_id:'E1',hotel_id:'H1',observacoes:'Preservar'}];
  return {version:1,trip:{id:'A',nome:'Viagem A',evento:{nome:'Congresso'},preferencias:{interesses:['museus']}},records};
}
test('migration preserves IDs, extras, relationships and source; migration is idempotent',()=>{
  const old=legacy(), snapshot=JSON.stringify(old), next=t.migrate(old);
  assert.equal(JSON.stringify(old),snapshot);assert.equal(next.version,2);assert.equal(next.trip,undefined);
  assert.deepEqual(next.trips[0],old.trip);assert.equal(next.records.hoteis[0].hotel_id,'H1');
  for(const list of Object.values(next.records))for(const r of list)assert.equal(r.viagem_id,'A');
  assert.deepEqual(t.migrate(next),next);
});
test('active view and save isolate every collection, including colliding imported IDs',()=>{
  let data=t.migrate(legacy());data=t.add(data,{id:'B',nome:'Viagem B'});
  const second=t.view(data);second.records.estadias.push({estadia_id:'E1',nome:'Outra etapa'});
  data=t.merge(data,second);assert.equal(t.view(data,'A').records.estadias[0].nome,'Etapa');
  assert.equal(t.view(data,'B').records.hoteis.length,0);
  second.trip.nome='Editada';data=t.merge(data,second);assert.equal(data.trips[0].nome,'Viagem A');
});
test('duplicates remap every ID and foreign key, preserve images and manual precedence',()=>{
  const data=t.migrate(legacy()), next=t.duplicate(data,'A'), copy=t.view(next);
  assert.notEqual(copy.trip.id,'A');assert.notEqual(copy.records.hoteis[0].hotel_id,'H1');
  assert.equal(copy.records.hoteis[0].estadia_id,copy.records.estadias[0].estadia_id);
  assert.equal(copy.records.roteiro[0].hotel_id,copy.records.hoteis[0].hotel_id);
  assert.equal(copy.records.orcamento[0].hotel_id,copy.records.hoteis[0].hotel_id);
  assert.equal(copy.records.hoteis[0].print_data,data.records.hoteis[0].print_data);
  assert.equal(TravelCore.effectiveBudget(copy).length,1);assert.equal(TravelCore.effectiveBudget(copy)[0].status,'PAGO');
  assert.deepEqual(t.view(next,'A'),t.view(data,'A'));
});
test('delete removes only linked records; last trip can be deleted and recreated',()=>{
  let data=t.duplicate(t.migrate(legacy()),'A');const id=data.active_trip_id;
  data=t.remove(data,'A');assert.equal(data.trips.length,1);assert.equal(data.records.hoteis.length,1);
  data=t.remove(data,id);assert.equal(data.active_trip_id,null);assert.equal(t.view(data).trip,null);
  data=t.add(data,{id:'C',nome:'Nova'});assert.equal(t.view(data).trip.nome,'Nova');
});
test('invalid schemas, ownership, duplicate IDs and dangling relations are rejected',()=>{
  for(const mutate of [d=>d.version=99,d=>d.records.hoteis=null,d=>d.active_trip_id='missing',d=>d.trips.push(d.trips[0]),d=>d.records.hoteis.push(d.records.hoteis[0]),d=>d.records.hoteis[0].viagem_id='missing',d=>d.records.orcamento[0].hotel_id='missing',d=>d.records.hoteis[0].estadia_id='missing']) {
    const data=t.migrate(legacy());mutate(data);assert.throws(()=>t.validate(data));
  }
  const data=legacy();data.records.hoteis[0].viagem_id='foreign';assert.throws(()=>t.migrate(data));assert.equal(data.version,1);
});
test('cross-trip foreign keys are rejected, backup roundtrip retains all trips',()=>{
  const data=t.add(t.migrate(legacy()),{id:'B',nome:'B'});
  assert.deepEqual(t.migrate(JSON.parse(JSON.stringify(data))),data);
  data.records.orcamento.push({custo_id:'B1',hotel_id:'H1',viagem_id:'B'});assert.throws(()=>t.validate(data));
});
test('migration adds a missing food collection to version 1 backups without changing the source',()=>{
  const data=legacy(),snapshot=structuredClone(data);delete data.records.alimentacao;delete snapshot.records.alimentacao;
  const migrated=t.migrate(data);
  assert.deepEqual(data,snapshot);assert.deepEqual(migrated.records.alimentacao,[]);
  assert.deepEqual(migrated.trips,[snapshot.trip]);
  for(const [key,rows] of Object.entries(snapshot.records))assert.deepEqual(migrated.records[key].map(({viagem_id,...row})=>row),rows);
});
test('migration adds a missing food collection to version 2 backups',()=>{
  const data=t.add(t.migrate(legacy()),{id:'B',nome:'Viagem B'}),trips=structuredClone(data.trips),records=structuredClone(data.records);
  delete data.records.alimentacao;delete records.alimentacao;
  const migrated=t.migrate(data);
  assert.deepEqual(migrated.records.alimentacao,[]);assert.deepEqual(migrated.trips,trips);
  for(const key of Object.keys(records))assert.deepEqual(migrated.records[key],records[key]);
});
test('migration rejects an existing invalid food collection instead of replacing it',()=>{
  for(const version of [1,2]) {
    const data=version===1?legacy():t.migrate(legacy());data.records.alimentacao=null;
    assert.throws(()=>t.migrate(data),/Seção inválida: alimentacao/);assert.equal(data.records.alimentacao,null);
  }
});
