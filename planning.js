/* Global 2.2 analyses: combined scenarios, nearby trips and calendar. */
(function(root){
  'use strict';
  const DAY=86400000;
  const parseDay=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?Date.parse(value+'T00:00:00Z'):NaN;
  const dayDiff=(a,b)=>(parseDay(b)-parseDay(a))/DAY;
  const addDays=(value,days)=>new Date(parseDay(value)+days*DAY).toISOString().slice(0,10);
  const point=(date,time,end=false)=>date?Date.parse(`${date}T${time || (end?'23:59':'00:00')}:00`):NaN;
  function proximity(library,maxGap=3){
    const dated=library.trips.filter(t=>Number.isFinite(parseDay(t.data_inicio))&&Number.isFinite(parseDay(t.data_fim))).toSorted((a,b)=>a.data_inicio.localeCompare(b.data_inicio));
    const result=[];
    for(let i=0;i<dated.length;i++)for(let j=i+1;j<dated.length;j++){
      const a=dated[i],b=dated[j];if(dayDiff(a.data_fim,b.data_inicio)>maxGap)break;
      const overlap=Math.min(parseDay(a.data_fim),parseDay(b.data_fim))-Math.max(parseDay(a.data_inicio),parseDay(b.data_inicio));
      const gap=Math.max(0,dayDiff(a.data_fim,b.data_inicio)-1);
      if(overlap>=0) result.push({type:'conflict',a,b,overlapDays:Math.floor(overlap/DAY)+1,registered:true});
      else result.push({type:'opportunity',a,b,gapDays:gap,registered:true,suggestion:`Avalie ligar ${a.destino_principal?.cidade||a.nome} a ${b.destino_principal?.cidade||b.nome} no mesmo deslocamento.`});
    }
    return result;
  }
  function scenarioSummary(library,scenario){
    const items=scenario.items.filter(i=>i.included!==false).toSorted((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
    const totals={},commitments=[];let transports=0;
    for(const item of items){
      const summary=root.TravelComparison.tripSummary(library,item.trip_id);if(!summary)continue;
      for(const [currency,value] of Object.entries(summary.financial.total))totals[currency]=Math.round(((totals[currency]||0)+value)*100)/100;
      const state=root.TravelTrips.view(library,item.trip_id),shift=Number.isFinite(parseDay(item.data_inicio))&&summary.trip.data_inicio?dayDiff(summary.trip.data_inicio,item.data_inicio):0;
      transports+=state.records.deslocamentos.length;
      for(const event of state.records.compromissos)commitments.push({...event,trip_id:item.trip_id,trip_name:summary.trip.nome,scenario_date:event.data_inicio&&shift?addDays(event.data_inicio,shift):event.data_inicio});
    }
    const days=new Set();for(const item of items){const trip=library.trips.find(t=>t.id===item.trip_id),start=item.data_inicio||trip?.data_inicio,end=item.data_fim||trip?.data_fim;if(!Number.isFinite(parseDay(start))||!Number.isFinite(parseDay(end)))continue;for(let d=parseDay(start);d<=parseDay(end);d+=DAY)days.add(new Date(d).toISOString().slice(0,10));}
    return {items,totals,availableDays:days.size,transports,commitments:commitments.toSorted((a,b)=>(a.scenario_date||'9999').localeCompare(b.scenario_date||'9999'))};
  }
  function calendarEntries(library){
    const entries=[];
    const push=(trip,type,label,startDate,startTime,endDate=startDate,endTime='',hash,id)=>{if(!Number.isFinite(point(startDate,startTime)))return;entries.push({trip_id:trip.id,trip_name:trip.nome,type,label,startDate,startTime:startTime||'',endDate:endDate||startDate,endTime:endTime||'',start:point(startDate,startTime),end:point(endDate||startDate,endTime,true),hash,id});};
    for(const trip of library.trips){
      push(trip,'Viagem',trip.nome,trip.data_inicio,'',trip.data_fim,'','viagens',trip.id);
      const state=root.TravelTrips.view(library,trip.id);
      for(const r of state.records.estadias)push(trip,'Etapa',r.nome,r.data_inicio,'',r.data_fim,'','estadias',r.estadia_id);
      for(const r of state.records.hoteis){const stage=state.records.estadias.find(s=>s.estadia_id===r.estadia_id);push(trip,'Hospedagem',r.nome,stage?.data_inicio,'',stage?.data_fim,'','hoteis',r.hotel_id);}
      for(const r of state.records.deslocamentos)push(trip,'Transporte',`${r.origem||'?'} → ${r.destino||'?'}`,r.data_saida,r.hora_saida,r.data_chegada,r.hora_chegada,'deslocamentos',r.deslocamento_id);
      for(const r of state.records.compromissos)push(trip,'Evento',r.nome,r.data_inicio,r.hora_inicio,r.data_fim,r.hora_fim,'compromissos',r.compromisso_id);
    }
    entries.sort((a,b)=>a.start-b.start||a.end-b.end);
    for(const entry of entries)entry.conflicts=[];
    for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length&&entries[j].start<=entries[i].end;j++)if(entries[i].trip_id!==entries[j].trip_id || ['Transporte','Evento'].includes(entries[i].type)||['Transporte','Evento'].includes(entries[j].type)){entries[i].conflicts.push(entries[j].id);entries[j].conflicts.push(entries[i].id);}
    return entries;
  }
  root.TravelPlanning={proximity,scenarioSummary,calendarEntries};
  if(typeof module!=='undefined')module.exports=root.TravelPlanning;
})(typeof globalThis!=='undefined'?globalThis:this);
