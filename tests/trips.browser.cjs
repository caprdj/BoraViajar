/* Run with NODE_PATH pointing to an installation of playwright. Uses a fresh browser profile. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
require('../core.js');const trips=require('../trips.js');
const baseURL=process.env.TEST_BASE_URL || 'http://localhost:8765';
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
  try {
    const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    const old={version:1,trip:{id:'old',nome:'Viagem original',preferencias:{interesses:['história']}},records:trips.emptyRecords()};
    old.records.estadias=[{estadia_id:'E1',nome:'Etapa original',cidade:'Fortaleza',numero_viajantes:2}];
    old.records.hoteis=[{hotel_id:'H1',estadia_id:'E1',nome:'Hotel original',preco_total:600,escolhido:true}];
    await page.goto(baseURL);
    await page.evaluate(data=>localStorage.setItem('meu-percurso-v1',JSON.stringify(data)),old);await page.reload();
    await page.getByRole('heading',{name:'Minhas viagens',exact:true}).waitFor();
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')));assert.equal(saved.version,2);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1-antes-migracao-v2'))),old);
    await page.getByRole('button',{name:'+ Nova viagem',exact:true}).click();
    await page.locator('[name="nome"]').fill('Segunda viagem');await page.locator('[name="cidade"]').fill('Santiago');
    await page.getByRole('button',{name:'Salvar alterações'}).click();
    await page.locator('#editor').waitFor({state:'hidden'});
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')));assert.equal(saved.trips.length,2);const second=saved.active_trip_id;
    await page.locator(`[data-action="open-trip"][data-id="${second}"]`).click();
    await page.locator('#navigation a[href="#estadias"]').click();await page.getByRole('button',{name:'+ Adicionar',exact:true}).click();
    await page.locator('[name="nome"]').fill('Etapa segunda');await page.locator('[name="cidade"]').fill('Santiago');await page.getByRole('button',{name:'Salvar alterações'}).click();await page.locator('#editor').waitFor({state:'hidden'});
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')));assert.equal(saved.records.estadias.length,2);assert.equal(saved.records.estadias.find(r=>r.nome==='Etapa segunda').viagem_id,second);
    await page.locator('#navigation a[href="#hoteis"]').click();assert.equal(await page.locator('#records').getByText('Hotel original',{exact:true}).count(),0);
    await page.selectOption('#trip-switcher','old');await page.locator('#navigation a[href="#hoteis"]').click();
    await page.getByRole('heading',{name:'Hotel original',exact:true}).waitFor();
    await page.selectOption('#trip-switcher','');await page.locator('[data-action="duplicate-trip"][data-id="old"]').click();
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')));assert.equal(saved.trips.length,3);const copy=saved.active_trip_id;
    assert.equal(saved.records.hoteis.length,2);assert.notEqual(saved.records.hoteis[1].hotel_id,'H1');
    await page.locator(`[data-action="edit-trip"][data-id="${copy}"]`).click();await page.locator('[name="nome"]').fill('Cópia editada');await page.getByRole('button',{name:'Salvar alterações'}).click();
    await page.locator('#editor').waitFor({state:'hidden'});
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')));assert.equal(saved.trips[0].nome,'Viagem original');
    assert.equal(await page.locator('[data-action="settings"]').isVisible(),false);
    await page.locator('#main').focus();
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'tests/viagens-mobile.png',fullPage:true,animations:'disabled'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'tests/viagens-desktop.png',fullPage:true,animations:'disabled'});
    for(const id of ['old',second,copy]) await page.locator(`[data-action="delete-trip"][data-id="${id}"]`).click();
    await page.getByRole('heading',{name:'Seu próximo destino começa aqui'}).waitFor();
    await page.getByRole('button',{name:'+ Nova viagem',exact:true}).click();await page.locator('[name="nome"]').fill('Recomeço');await page.getByRole('button',{name:'Salvar alterações'}).click();await page.locator('#editor').waitFor({state:'hidden'});
    await page.goto(baseURL+'/#dados');await page.getByRole('button',{name:'Restaurar backup'}).click();
    await page.locator('#file-input').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('meu-percurso-v1')).trips[0].id==='old');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1-antes-restauracao')).trips[0].nome),'Recomeço');
    const before=await page.evaluate(()=>localStorage.getItem('meu-percurso-v1'));
    const invalid=JSON.parse(before);invalid.records.hoteis[0].estadia_id='missing';
    await page.getByRole('button',{name:'Restaurar backup'}).click();await page.locator('#file-input').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
    await page.getByRole('status').filter({hasText:'Uma etapa vinculada não existe'}).waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('meu-percurso-v1')),before);
    // A second tab refreshes the scoped view and closes a stale editor.
    const peer=await page.context().newPage();await peer.goto(baseURL+'/#inicio');
    await peer.locator('[data-action="settings"]').click();
    await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('meu-percurso-v1'));d.trips[0].nome='Atualizada em outra aba';localStorage.setItem('meu-percurso-v1',JSON.stringify(d));});
    await peer.locator('#editor').waitFor({state:'hidden'});await peer.getByRole('heading',{name:'Atualizada em outra aba',exact:true}).waitFor();await peer.close();
    // A migration write failure must leave the source intact and block all writes.
    await page.evaluate(data=>localStorage.setItem('meu-percurso-v1',JSON.stringify(data)),old);
    await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota full','QuotaExceededError');};});await page.reload();
    await page.getByRole('alert').waitFor();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('meu-percurso-v1'))),old);
    assert.deepEqual(errors,[]);console.log('Browser checks passed: migration, isolation, creation, editing, duplication, deletion, empty state, restore, invalid backup, quota failure, mobile layout.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
