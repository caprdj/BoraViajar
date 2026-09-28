/* Pure comparison calculations for two or more isolated trips. */
(function(root) {
  'use strict';
  const CATEGORIES = ['HOSPEDAGEM','TRANSPORTE','ALIMENTAÇÃO','ATIVIDADES','EVENTOS','OUTROS'];
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  function validDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value || ''))return false;
    const parsed=new Date(value+'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===value;
  }
  function duration(trip) {
    if(!validDate(trip?.data_inicio) || !validDate(trip?.data_fim)) return null;
    const start=Date.parse(trip.data_inicio+'T00:00:00Z'), end=Date.parse(trip.data_fim+'T00:00:00Z');
    const days=(end-start)/86400000+1;
    return Number.isInteger(days) && days>0 ? days : null;
  }
  function values(totals,key) {
    return Object.fromEntries(Object.entries(totals).map(([currency,total])=>[currency,round(total[key] || 0)]));
  }
  function pending(totals) {
    return Object.fromEntries(Object.entries(totals).map(([currency,total])=>[currency,round(total.total-total.paid)]));
  }
  function perDay(amounts,days) {
    return days ? Object.fromEntries(Object.entries(amounts).map(([currency,value])=>[currency,round(value/days)])) : null;
  }
  function tripSummary(library,id) {
    const state=root.TravelTrips.view(library,id), trip=state.trip;
    if(!trip) return null;
    const expenses=root.TravelCore.effectiveBudget(state);
    const days=duration(trip);
    const totals=root.TravelCore.budget(expenses);
    const personalExpenses=expenses.map(expense=>({...expense,valor:root.TravelCore.personalShare(expense,state.records.estadias.find(stage=>stage.estadia_id===expense.estadia_id))}));
    const personalTotals=root.TravelCore.budget(personalExpenses);
    const total=values(totals,'total'), paid=values(totals,'paid');
    const personalTotal=values(personalTotals,'total'), personalPaid=values(personalTotals,'paid');
    const categories=Object.fromEntries(CATEGORIES.map(category=>{
      const rows=expenses.filter(expense=>(CATEGORIES.includes(String(expense.categoria).toUpperCase())?String(expense.categoria).toUpperCase():'OUTROS')===category);
      return [category,values(root.TravelCore.budget(rows),'total')];
    }));
    return {id,trip,duration:days,counts:{
      stages:state.records.estadias.length,
      transports:state.records.deslocamentos.length,
      chosenHotels:state.records.hoteis.filter(root.TravelCore.selected).length,
    },categories,financial:{total,paid,pending:pending(totals),perDay:perDay(total,days)},personal:{
      total:personalTotal,paid:personalPaid,pending:pending(personalTotals),perDay:perDay(personalTotal,days),
    }};
  }
  function compare(library,ids) {
    const unique=[...new Set(ids)];
    return unique.map(id=>tripSummary(library,id)).filter(Boolean);
  }
  root.TravelComparison={CATEGORIES,duration,tripSummary,compare};
  if(typeof module!=='undefined') module.exports=root.TravelComparison;
})(typeof globalThis!=='undefined'?globalThis:this);
