/* Versioned storage and isolated views for the existing trip modules. */
(function(root) {
  'use strict';
  const ids = {estadias:'estadia_id',hoteis:'hotel_id',deslocamentos:'deslocamento_id',alimentacao:'alimentacao_id',lugares:'lugar_id',compromissos:'compromisso_id',roteiro:'roteiro_id',orcamento:'custo_id',cenarios:'cenario_id'};
  const clone = value => structuredClone(value);
  const emptyRecords = () => Object.fromEntries(Object.keys(ids).map(k=>[k,[]]));
  const uid = () => 'V_' + crypto.randomUUID();
  const object = value => value && typeof value==='object' && !Array.isArray(value);
  function validDate(value) {
    if(value===null || value===undefined || value==='')return true;
    if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
  }
  function view(data, id=data.active_trip_id) {
    return {version:2,trip:clone(data.trips.find(t=>t.id===id) || null),records:Object.fromEntries(Object.keys(ids).map(k=>[k,clone(data.records[k].filter(r=>r.viagem_id===id))]))};
  }
  function validate(data) {
    if (!data || data.version!==2 || !Array.isArray(data.trips) || !data.records) throw new Error('Backup incompatível com a versão 2.0.');
    const tripIds=new Set();
    for(const t of data.trips) {
      if(!t || typeof t.id!=='string' || !t.id.trim() || tripIds.has(t.id) || typeof t.nome!=='string' || !t.nome.trim()) throw new Error('Viagens com nome ou identificador inválido.');
      if(!validDate(t.data_inicio) || !validDate(t.data_fim))throw new Error('Datas de viagem inválidas.');
      for(const key of ['destino_principal','preferencias','evento']) if(t[key]!=null && !object(t[key]))throw new Error('Configuração de viagem inválida.');
      if(t.preferencias?.interesses && (!Array.isArray(t.preferencias.interesses) || t.preferencias.interesses.some(v=>typeof v!=='string'))) throw new Error('Interesses inválidos.');
      if(t.data_inicio && t.data_fim && t.data_fim<t.data_inicio) throw new Error('Revise as datas da viagem.');
      tripIds.add(t.id);
    }
    if(data.trips.length ? !tripIds.has(data.active_trip_id) : data.active_trip_id!==null) throw new Error('Viagem ativa inválida.');
    if(data.combined_scenarios===undefined) data.combined_scenarios=[];
    if(!Array.isArray(data.combined_scenarios)) throw new Error('Cenários combinados inválidos.');
    const scenarioIds=new Set();
    for(const scenario of data.combined_scenarios) {
      if(!scenario || typeof scenario.id!=='string' || !scenario.id || scenarioIds.has(scenario.id) || typeof scenario.nome!=='string' || !scenario.nome.trim() || !Array.isArray(scenario.items) || scenario.items.length<2) throw new Error('Cenário combinado inválido.');
      const itemTrips=new Set();
      for(const item of scenario.items) {
        if(!item || !tripIds.has(item.trip_id) || itemTrips.has(item.trip_id) || !validDate(item.data_inicio) || !validDate(item.data_fim) || (item.data_inicio && item.data_fim && item.data_fim<item.data_inicio)) throw new Error('Alternativa inválida em cenário combinado.');
        itemTrips.add(item.trip_id);
      }
      scenarioIds.add(scenario.id);
    }
    for(const [key,idKey] of Object.entries(ids)) {
      const seen=new Set();
      if(!Array.isArray(data.records[key])) throw new Error(`Seção inválida: ${key}.`);
      for(const r of data.records[key]) {
        if(!r || typeof r!=='object' || Array.isArray(r) || Object.values(r).some(v=>v!==null && typeof v==='object') || typeof r[idKey]!=='string' || !r[idKey] || !tripIds.has(r.viagem_id)) throw new Error(`Registro inválido em ${key}.`);
        const identity=JSON.stringify([r.viagem_id,r[idKey]]);
        if(seen.has(identity)) throw new Error(`Identificador repetido em ${key}.`);
        seen.add(identity);
      }
    }
    for(const t of data.trips) {
      const scoped=view(data,t.id);
      root.TravelCore.validateRelations(scoped);
      for(const [key,list] of Object.entries(scoped.records)) for(const r of list) {
        for(const [target,foreign] of Object.entries(ids)) {
          if(target!==key && r[foreign] && !scoped.records[target].some(item=>item[foreign]===r[foreign])) throw new Error(`Vínculo ${foreign} inexistente nesta viagem.`);
        }
      }
    }
    return data;
  }
  function migrate(input) {
    const data=clone(input);
    if(data?.version===1) {
      if(!data.trip || !data.records) throw new Error('Backup antigo inválido.');
      for(const key of Object.keys(ids)) data.records[key] ||= [];
      data.version=2;data.trips=[data.trip];data.active_trip_id=data.trip.id;delete data.trip;
      for(const key of Object.keys(ids)) {
        if(!Array.isArray(data.records[key])) throw new Error(`Seção inválida: ${key}.`);
        for(const r of data.records[key]) {
          if(!r || typeof r!=='object' || Array.isArray(r)) throw new Error('Registro antigo inválido.');
          if(r.viagem_id && r.viagem_id!==data.active_trip_id) throw new Error('Há registros de outra viagem no backup antigo. Os dados foram preservados.');
          r.viagem_id=data.active_trip_id;
        }
      }
    }
    if(data?.version===2) {
      if(data.combined_scenarios===undefined) data.combined_scenarios=[];
      // Keep older v2 backups compatible when a new planning collection is introduced.
      if(data.records) for(const key of Object.keys(ids)) data.records[key] ||= [];
    }
    return validate(data);
  }
  function merge(data, scoped) {
    const next=clone(data), id=data.active_trip_id;
    if(!id || scoped.trip?.id!==id) throw new Error('A configuração deve manter o identificador da viagem ativa.');
    next.trips=next.trips.map(t=>t.id===id?clone(scoped.trip):t);
    for(const key of Object.keys(ids)) next.records[key]=[...next.records[key].filter(r=>r.viagem_id!==id),...scoped.records[key].map(r=>({...r,viagem_id:id}))];
    return validate(next);
  }
  function add(data, trip) {
    const next=clone(data);next.trips.push(clone(trip));next.active_trip_id=trip.id;
    return validate(next);
  }
  function remove(data,id) {
    const next=clone(data);next.trips=next.trips.filter(t=>t.id!==id);
    for(const key of Object.keys(ids)) next.records[key]=next.records[key].filter(r=>r.viagem_id!==id);
    if(next.active_trip_id===id) next.active_trip_id=next.trips[0]?.id || null;
    next.combined_scenarios=next.combined_scenarios.map(s=>({...s,items:s.items.filter(item=>item.trip_id!==id)})).filter(s=>s.items.length>=2);
    return validate(next);
  }
  function duplicate(data,id) {
    const scoped=view(data,id);if(!scoped.trip) throw new Error('Viagem não encontrada.');
    const newId=uid(), maps={};
    for(const [key,idKey] of Object.entries(ids)) maps[idKey]=new Map(scoped.records[key].map(r=>[r[idKey],idKey+'_'+crypto.randomUUID()]));
    const next=clone(data);next.trips.push({...scoped.trip,id:newId,nome:scoped.trip.nome+' (cópia)'});next.active_trip_id=newId;
    for(const key of Object.keys(ids)) for(const r of scoped.records[key]) {
      const copy={...r,viagem_id:newId};
      for(const [idKey,map] of Object.entries(maps)) if(map.has(copy[idKey])) copy[idKey]=map.get(copy[idKey]);
      // Generated costs are recomputed from the copied selected hotels.
      if(key==='orcamento' && String(r.custo_id).startsWith('AUTO_HOTEL_')) continue;
      next.records[key].push(copy);
    }
    return validate(next);
  }
  root.TravelTrips={ids,emptyRecords,uid,view,validate,migrate,merge,add,remove,duplicate};
  if(typeof module!=='undefined') module.exports=root.TravelTrips;
})(typeof globalThis!=='undefined'?globalThis:this);
