const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseCSV,toCSV,number,budget,groupedBudget}=require('../core.js');
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
test('budget groups matching categories and types while keeping currencies separate',()=>{
  const groups=groupedBudget([{categoria:'ALIMENTAÇÃO',tipo_despesa:'JANTAR',valor:40,status:'PAGO'},{categoria:'ALIMENTAÇÃO',tipo_despesa:'JANTAR',valor:60,status:'CONFIRMADO'},{categoria:'TRANSPORTE',tipo_despesa:'AVIÃO',valor:200,moeda:'USD'},{categoria:'ALIMENTAÇÃO',tipo_despesa:'JANTAR',valor:999,status:'CANCELADO'}]);
  assert.deepEqual(groups,[{categoria:'ALIMENTAÇÃO',tipo:'JANTAR',moeda:'BRL',valor:100,pago:40,quantidade:2},{categoria:'TRANSPORTE',tipo:'AVIÃO',moeda:'USD',valor:200,pago:0,quantidade:1}]);
});
