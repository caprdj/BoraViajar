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
    const columns = [...new Set(rows.flatMap(Object.keys))].filter(k => k !== '_id');
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
  root.TravelCore = { parseCSV, toCSV, number, budget };
  if (typeof module !== 'undefined') module.exports = root.TravelCore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
