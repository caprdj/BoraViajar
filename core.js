/* Shared, dependency-free data helpers. Also exercised by Node tests. */
(function (root) {
  'use strict';
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/, 1)[0];
    const delimiter = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { value += '"'; i++; }
        else if (quoted || value === '') quoted = !quoted;
        else throw new Error('CSV com aspas inválidas.');
      } else if (c === delimiter && !quoted) { row.push(value); value = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(value); if (row.some(v => v.trim())) rows.push(row); row = []; value = '';
      } else value += c;
    }
    if (quoted) throw new Error('CSV com aspas não fechadas.');
    row.push(value); if (row.some(v => v.trim())) rows.push(row);
    if (rows.length < 2) throw new Error('O CSV precisa de cabeçalho e pelo menos um registro.');
    const headers = rows.shift().map(v => v.trim());
    if (new Set(headers).size !== headers.length || headers.some(v => !v || ['__proto__','constructor','prototype'].includes(v))) throw new Error('Cabeçalhos inválidos ou repetidos.');
    return rows.map((r, index) => {
      if (r.length !== headers.length) throw new Error(`A linha ${index + 2} tem uma quantidade incorreta de colunas.`);
      return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
    });
  }
  function toCSV(rows) {
    if (!rows.length) return '';
    const columns = [...new Set(rows.flatMap(Object.keys))].filter(k => !['_id','print_data'].includes(k));
    const escape = v => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
    return '\uFEFF' + [columns.map(escape).join(','), ...rows.map(r => columns.map(k => escape(r[k])).join(','))].join('\r\n');
  }
  function number(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const str = String(value).trim();
    const n = Number(str.includes(',') ? str.replace(/\./g, '').replace(',', '.') : str);
    return Number.isFinite(n) ? n : null;
  }
  function budget(rows) {
    const totals = {};
    for (const row of rows) {
      if (String(row.status).toUpperCase() === 'CANCELADO') continue;
      const currency = String(row.moeda || 'BRL').toUpperCase();
      const n = number(row.valor); if (n === null || n < 0) continue;
      totals[currency] ||= { total: 0, paid: 0 };
      totals[currency].total += n;
      if (String(row.status).toUpperCase() === 'PAGO') totals[currency].paid += n;
    }
    return totals;
  }
  const selected = hotel => hotel.escolhido === true || hotel.escolhido === 'true';
  function nights(stage) {
    if (!stage?.data_inicio || !stage?.data_fim) return null;
    const start = Date.parse(stage.data_inicio + 'T00:00:00Z');
    const end = Date.parse(stage.data_fim + 'T00:00:00Z');
    const n = (end - start) / 86400000;
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  function travelers(stage) { return Math.max(1, Math.floor(number(stage?.numero_viajantes) || 1)); }
  function hotelCost(hotel, stage) {
    const count = number(hotel.numero_noites) ?? nights(stage);
    const daily = number(hotel.preco_diaria), quoted = number(hotel.preco_total);
    const rooms = Math.max(1, Math.floor(number(hotel.numero_quartos) || 1));
    const total = quoted !== null ? quoted : daily !== null && count > 0 ? daily * count * rooms : null;
    return { nights: count, rooms, total: total !== null && total >= 0 ? Math.round(total * 100) / 100 : null };
  }
  function personalShare(expense, stage) {
    const total = number(expense.valor);
    if (total === null) return null;
    if (expense.divisao === 'IGUAL') return Math.round(total / travelers(stage) * 100) / 100;
    if (expense.divisao === 'PERSONALIZADO') return number(expense.minha_parte);
    return total;
  }
  function effectiveBudget(state) {
    const manual = state.records.orcamento.filter(r => !String(r.custo_id).startsWith('AUTO_'));
    const generated = state.records.hoteis.filter(selected).map(h => {
      const stage = state.records.estadias.find(s => s.estadia_id === h.estadia_id);
      const cost = hotelCost(h, stage);
      if (!stage || cost.total === null) return null;
      // A linked manual expense is authoritative, including a paid reservation.
      if (manual.some(r => r.hotel_id === h.hotel_id && String(r.status).toUpperCase() !== 'CANCELADO')) return null;
      return { custo_id: 'AUTO_HOTEL_' + h.hotel_id, hotel_id: h.hotel_id, estadia_id: stage.estadia_id,
        viagem_id: state.trip.id, categoria: 'HOSPEDAGEM', descricao: h.nome,
        valor: cost.total, moeda: 'BRL', status: h.status_custo || 'ESTIMADO', data: stage.data_inicio || '',
        divisao: h.divisao || 'INDIVIDUAL', minha_parte: h.minha_parte ?? '', automatico: true };
    }).filter(Boolean);
    const transport = (state.records.deslocamentos || []).map(r => {
      const value=number(r.preco);
      if(value===null || value<0 || manual.some(e=>e.deslocamento_id===r.deslocamento_id && String(e.status).toUpperCase()!=='CANCELADO')) return null;
      return {custo_id:'AUTO_TRANSPORTE_'+r.deslocamento_id,deslocamento_id:r.deslocamento_id,estadia_id:r.estadia_id||'',viagem_id:state.trip.id,categoria:'TRANSPORTE',descricao:[r.origem,r.destino].filter(Boolean).join(' → ')||r.empresa||'Transporte',valor:value,moeda:r.moeda||'BRL',status:r.status_custo||'ESTIMADO',data:r.data_saida||'',automatico:true};
    }).filter(Boolean);
    const food = (state.records.alimentacao || []).map(r => {
      const value=number(r.valor);
      if(value===null || value<0 || manual.some(e=>e.alimentacao_id===r.alimentacao_id && String(e.status).toUpperCase()!=='CANCELADO')) return null;
      return {custo_id:'AUTO_ALIMENTACAO_'+r.alimentacao_id,alimentacao_id:r.alimentacao_id,estadia_id:r.estadia_id||'',viagem_id:state.trip.id,categoria:'ALIMENTAÇÃO',descricao:r.descricao||r.tipo||'Alimentação',valor:value,moeda:r.moeda||'BRL',status:r.status_custo||'ESTIMADO',data:r.data||'',automatico:true};
    }).filter(Boolean);
    return [...manual, ...generated, ...transport, ...food];
  }
  function chooseHotel(state, id) {
    const next = structuredClone(state), hotel = next.records.hoteis.find(h => h.hotel_id === id);
    if (!hotel) throw new Error('Hospedagem não encontrada.');
    const stage = next.records.estadias.find(s => s.estadia_id === hotel.estadia_id);
    if (!stage) throw new Error('Edite a hospedagem e selecione uma etapa antes de escolher.');
    if (next.records.hoteis.some(h=>h.estadia_id===hotel.estadia_id && selected(h) && h.status_custo==='PAGO')) throw new Error('Revise a situação do custo pago antes de trocar ou retirar a hospedagem.');
    const deselect = selected(hotel);
    if (!deselect && hotelCost(hotel, stage).total === null) throw new Error('Informe o total cotado ou a diária e as noites da hospedagem.');
    for (const h of next.records.hoteis) if (h.estadia_id === hotel.estadia_id) h.escolhido = !deselect && h.hotel_id === id;
    return next;
  }
  function validateRelations(state) {
    const stages = new Set(state.records.estadias.map(s => s.estadia_id));
    const chosen = new Set();
    for (const stage of state.records.estadias) {
      const n = number(stage.numero_viajantes);
      if (n !== null && (!Number.isInteger(n) || n < 1)) throw new Error('O número de viajantes deve ser um inteiro maior que zero.');
      if (stage.data_inicio && stage.data_fim && stage.data_fim < stage.data_inicio) throw new Error('Revise as datas da etapa.');
    }
    for (const [key, records] of Object.entries(state.records)) for (const r of records) {
      if (key !== 'estadias' && r.estadia_id && !stages.has(r.estadia_id)) throw new Error('Uma etapa vinculada não existe. Importe primeiro o CSV de etapas.');
      if (r.divisao === 'PERSONALIZADO') {
        const total = key === 'hoteis' ? hotelCost(r, state.records.estadias.find(s => s.estadia_id === r.estadia_id)).total : number(r.valor);
        const share = number(r.minha_parte);
        if (share === null || share < 0 || (total !== null && share > total)) throw new Error('Informe sua parte entre zero e o valor total.');
      }
      if (key === 'hoteis' && selected(r)) {
        if (!r.estadia_id || chosen.has(r.estadia_id)) throw new Error('Escolha somente uma hospedagem por etapa.');
        if (hotelCost(r, state.records.estadias.find(s => s.estadia_id === r.estadia_id)).total === null) throw new Error('Uma hospedagem escolhida precisa de total ou diária e noites.');
        chosen.add(r.estadia_id);
      }
    }
    return state;
  }
  function hotelLink(value) {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Use um link http ou https.');
    const result = { link: url.href, fonte: url.hostname.replace(/^www\./, '') };
    const match = url.pathname.match(/\/hotel\/[a-z]{2}\/([^/]+)/i);
    if (match) result.nome = decodeURIComponent(match[1]).replace(/\.(?:pt-br|en-gb|en-us|html).*$/i,'').replace(/\.html$/i,'').replace(/-/g, ' ');
    const start = url.searchParams.get('checkin') || url.searchParams.get('check_in');
    const end = url.searchParams.get('checkout') || url.searchParams.get('check_out');
    const count = nights({data_inicio:start,data_fim:end});
    if (count) result.numero_noites = String(count);
    return result;
  }
  function hotelText(text) {
    const result = {};
    const lines = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const named = lines.find(s => /^(?:hotel|pousada|resort|hostel)\s+\S/i.test(s) && !/^(hotel|pousada)\s+(em|in)\s/i.test(s));
    if (named) result.nome = named.slice(0, 150);
    const count = text.match(/\b(\d+)\s*(?:noites|nights)\b/i);
    if (count) result.numero_noites = count[1];
    const amount = /R\$\s*([\d.]+(?:,\d{2})?)/i;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(amount); if (!m) continue;
      const n = number(m[1]); if (n === null) continue;
      // Only use amounts with explicit labels; never guess from the largest price.
      if (/(?:por|\/)\s*(?:noite|di[aá]ria)|di[aá]ria/i.test(lines[i])) result.preco_diaria = String(n);
      else if (/total/i.test(lines[i]) || /^total\b/i.test(lines[i-1] || '')) result.preco_total = String(n);
    }
    return result;
  }
  root.TravelCore = { parseCSV, toCSV, number, budget, selected, nights, travelers, hotelCost, personalShare, effectiveBudget, chooseHotel, validateRelations, hotelLink, hotelText };
  if (typeof module !== 'undefined') module.exports = root.TravelCore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
