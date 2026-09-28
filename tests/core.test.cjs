const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseCSV,toCSV,number,budget,budgetGroups,budgetCategoryTotals}=require('../core.js');
test('CSV preserves quoted commas, line breaks, escaped quotes and UTF-8 BOM',()=>{
  const input='\ufeffhotel_id,nome,observacoes\r\nHOTEL_001,"Café, Sol","Linha 1\n""Conforto"""\r\n';
  assert.deepEqual(parseCSV(input),[{hotel_id:'HOTEL_001',nome:'Café, Sol',observacoes:'Linha 1\n"Conforto"'}]);
});
test('semicolon and Brazilian decimals',()=>{assert.equal(parseCSV('id;valor\na;12,50')[0].valor,'12,50');assert.equal(number('1.234,50'),1234.5);assert.equal(number('0'),0);assert.equal(number(''),null);assert.equal(number('abc'),null);});
test('malformed CSV does not silently discard data',()=>{
  for(const value of ['a,a\n1,2','a,b\n1','a,b\n"unterminated,2','__proto__,b\nx,y'])assert.throws(()=>parseCSV(value));
});
test('CSV preserves extra columns across export and import',()=>{
  const data=[{hotel_id:'HOTEL_001',nome:'Praia',evidencia_cama:'Muito boa',extra:'a,b\nc'}];
  assert.deepEqual(parseCSV(toCSV(data)),data);
});
test('export protects formula-like cells',()=>assert.equal(parseCSV(toCSV([{nome:'=SUM(A1:A2)'}]))[0].nome,"'=SUM(A1:A2)"));
test('budget separates currencies, includes zero, excludes canceled and invalid amounts',()=>{
  assert.deepEqual(budget([{valor:'1.000,50',moeda:'BRL',status:'PAGO'},{valor:'200',moeda:'BRL',status:'ESTIMADO'},{valor:99,moeda:'USD',status:'CONFIRMADO'},{valor:900,moeda:'BRL',status:'CANCELADO'},{valor:-5,moeda:'BRL'},{valor:'invalid',moeda:'BRL'}]),{BRL:{total:1200.5,paid:1000.5},USD:{total:99,paid:0}});
});
test('budget groups food and transport by their types and sums repeated expenses',()=>{
  const groups=budgetGroups([{categoria:'ALIMENTAÇÃO',tipo:'JANTAR',valor:40,moeda:'BRL',status:'PAGO'},{categoria:'ALIMENTAÇÃO',tipo:'JANTAR',valor:60,moeda:'BRL',status:'ESTIMADO'},{categoria:'TRANSPORTE',tipo_transporte:'TREM',valor:20,moeda:'EUR'},{categoria:'TRANSPORTE',tipo_transporte:'TREM',valor:30,moeda:'EUR'}]);
  assert.deepEqual(groups,[{label:'ALIMENTAÇÃO · JANTAR',count:2,totals:{BRL:{total:100,paid:40}}},{label:'TRANSPORTE · TREM',count:2,totals:{EUR:{total:50,paid:0}}}]);
});

test('budgetCategoryTotals consolidates expenses by main category',()=>{
  const totals=budgetCategoryTotals([
    {categoria:'ALIMENTAÇÃO',tipo:'ALMOÇO',valor:30,moeda:'BRL',status:'PAGO'},
    {categoria:'ALIMENTAÇÃO',tipo:'JANTAR',valor:70,moeda:'BRL',status:'ESTIMADO'},
    {categoria:'TRANSPORTE',tipo_transporte:'AVIÃO',valor:500,moeda:'BRL',status:'PAGO'},
    {categoria:'TRANSPORTE',tipo_transporte:'UBER',valor:50,moeda:'BRL',status:'ESTIMADO'},
    {categoria:'HOSPEDAGEM',valor:800,moeda:'BRL',status:'PAGO'},
  ]);
  assert.deepEqual(totals.map(t=>({label:t.label,total:t.totals.BRL.total,paid:t.totals.BRL.paid,count:t.count})),[
    {label:'HOSPEDAGEM',total:800,paid:800,count:1},
    {label:'TRANSPORTE',total:550,paid:500,count:2},
    {label:'ALIMENTAÇÃO',total:100,paid:30,count:2}
  ]);
});
