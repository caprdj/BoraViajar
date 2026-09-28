'use strict';
const { parseCSV, toCSV, number: numeric, budget, groupedBudget } = TravelCore;
const STORE = 'meu-percurso-v1';
const icons = {
  inicio:'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
  estadias:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  hoteis:'M3 21V4h14v17 M17 10h4v11 M7 8h2 M12 8h1 M7 12h2 M12 12h1 M8 21v-5h4v5',
  deslocamentos:'m3 13 7 1 7 7 2-1-3-8 5-5c2-3 0-5-3-3l-5 5-8-3-1 2 7 7z',
  alimentacao:'M4 3v8a3 3 0 0 0 3 3v7 M7 3v8 M10 3v8 M17 3c-3 4-3 8 0 9v9 M17 3v18',
  lugares:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  compromissos:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2',
  roteiro:'M6 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M22 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7',
  orcamento:'M3 6h18v15H3z M3 6V3h14v3 M15 11h6v5h-6z',
  cenarios:'M12 21v-8 M5 3v5l7 5 7-5V3 M2 6l3-3 3 3 M16 6l3-3 3 3',
  combinados:'M4 6h6v6H4z M14 12h6v6h-6z M10 9h4 M12 9v6',
  proximas:'M4 18V6 M4 12h16 M16 8l4 4-4 4',
  calendario:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
  dados:'M4 4h16v16H4z M8 4v6h8V4 M8 20v-6h8v6',
  mais:'M5 12h1 M11 12h1 M17 12h1',
};
const icon = key => `<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${icons[key] || icons.estadias}"/></svg></span>`;
// Field format: name, label, input type (or select options), required.
const field = (key,label,type='text',required=false) => ({key,label,type,required});
const status = field('status','Situação',['EM PESQUISA','PLANEJADO','CONFIRMADO','RESERVADO','CANCELADO']);
const obs = field('observacoes','Observações','textarea');
const modules = {
  estadias:{title:'Destinos e estadias',short:'Destinos',singular:'estadia',id:'estadia_id',prefix:'EST',description:'Organize os destinos e o tempo em cada lugar.',fields:[field('nome','Nome da estadia','text',true),field('cidade','Cidade','text',true),field('data_inicio','Chegada','date'),field('data_fim','Saída','date'),field('objetivo_principal','Objetivo da estadia'),obs]},
  hoteis:{title:'Hospedagens',short:'Hospedagens',singular:'hospedagem',id:'hotel_id',prefix:'HOTEL',description:'Suas opções de hospedagem, com conforto em primeiro lugar.',fields:[field('nome','Nome do hotel','text',true),field('cidade','Cidade'),field('bairro','Bairro'),field('endereco','Endereço'),field('preco_diaria','Diária (R$)','number'),field('numero_noites','Número de noites','number'),field('preco_total','Total cotado (R$)','number'),field('fonte','Fonte da pesquisa'),field('link','Link da hospedagem','url'),field('nota','Nota publicada','number'),field('escala_notas_plataforma','Escala da nota',['10','5','100']),field('nota_conforto_plataforma','Nota de conforto publicada','number'),field('pontos_positivos','Pontos positivos','textarea'),field('pontos_negativos','Pontos de atenção','textarea'),obs]},
  deslocamentos:{title:'Transportes',short:'Transportes',singular:'transporte',id:'deslocamento_id',prefix:'DES',description:'Da saída de casa ao próximo destino, tudo no mesmo lugar.',fields:[field('origem','Origem','text',true),field('destino','Destino','text',true),field('tipo_transporte','Transporte',['AVIÃO','ÔNIBUS','TRANSFER','CARRO','TREM','BARCO','OUTRO']),field('empresa','Empresa'),field('data_saida','Data de saída','date'),field('hora_saida','Horário de saída','time'),field('data_chegada','Data de chegada','date'),field('hora_chegada','Horário de chegada','time'),field('preco','Preço','number'),field('moeda','Moeda',['BRL','USD','EUR']),field('status_custo','Situação do custo',['ESTIMADO','CONFIRMADO','PAGO','CANCELADO']),field('identificacao_servico','Voo ou serviço'),status,obs]},
  alimentacao:{title:'Alimentação',short:'Alimentação',singular:'gasto com alimentação',id:'alimentacao_id',prefix:'ALI',description:'Planeje refeições e registre todos os gastos com alimentação.',fields:[field('descricao','Descrição','text',true),field('tipo','Tipo',['CAFÉ DA MANHÃ','ALMOÇO','JANTAR','LANCHE','MERCADO','OUTRO']),field('data','Data','date'),field('valor','Valor','number',true),field('moeda','Moeda',['BRL','USD','EUR']),field('status_custo','Situação do custo',['ESTIMADO','CONFIRMADO','PAGO','CANCELADO']),obs]},
  lugares:{title:'Lugares para conhecer',short:'Lugares',singular:'lugar',id:'lugar_id',prefix:'LUG',description:'Guarde os lugares e experiências que despertam sua curiosidade.',fields:[field('nome','Nome do lugar','text',true),field('cidade','Cidade'),field('categoria','Categoria',['NATUREZA','GASTRONOMIA','MUSEU','ARQUITETURA','GEOLOGIA','PRAIA','OUTRO']),field('prioridade','Prioridade',['ALTA','MÉDIA','BAIXA']),field('endereco','Endereço'),field('duracao_estimada_min','Duração estimada (min)','number'),field('periodo_preferencial','Melhor período',['MANHÃ','TARDE','NOITE','LIVRE']),field('fonte','Fonte'),status,obs]},
  compromissos:{title:'Eventos e compromissos',short:'Eventos',singular:'compromisso',id:'compromisso_id',prefix:'COMP',description:'Reserve espaço para os encontros que já têm data.',fields:[field('nome','Nome do compromisso','text',true),field('tipo','Tipo',['CONGRESSO','RESERVA','VISITA','REUNIÃO','OUTRO']),field('data_inicio','Data de início','date',true),field('hora_inicio','Horário inicial','time'),field('data_fim','Data de término','date'),field('hora_fim','Horário final','time'),field('local','Local'),status,obs]},
  roteiro:{title:'Meu roteiro',short:'Roteiro',singular:'atividade',id:'roteiro_id',prefix:'ROT',description:'Dê ritmo à viagem, um dia de cada vez.',fields:[field('titulo','Título da atividade','text',true),field('data','Dia','date',true),field('hora_inicio','Horário inicial','time'),field('hora_fim','Horário final','time'),field('cidade','Cidade'),field('tipo_item','Tipo',['ATIVIDADE','DESLOCAMENTO','EVENTO','TEMPO LIVRE','REFEIÇÃO']),status,obs]},
  orcamento:{title:'Orçamento',short:'Orçamento',singular:'despesa',id:'custo_id',prefix:'CUSTO',description:'Planeje os gastos e acompanhe o que já foi pago.',fields:[field('descricao','Descrição','text',true),field('categoria','Categoria',['HOSPEDAGEM','TRANSPORTE','ALIMENTAÇÃO','ATIVIDADES','EVENTOS','OUTROS']),field('valor','Valor','number',true),field('moeda','Moeda',['BRL','USD','EUR']),field('status','Situação',['ESTIMADO','CONFIRMADO','PAGO','CANCELADO']),field('data','Data','date'),obs]},
  cenarios:{title:'Cenários de viagem',short:'Cenários',singular:'cenário',id:'cenario_id',prefix:'CEN',description:'Registre alternativas antes de escolher o seu percurso.',fields:[field('nome','Nome do cenário','text',true),field('descricao','Descrição','textarea'),field('data_inicio','Início','date'),field('data_fim','Fim','date'),field('custo_total','Custo estimado manual (R$)','number'),field('status','Situação',['EM ANÁLISE','PREFERIDO','DESCARTADO']),obs]},
};
const initial = () => ({version:2,trips:[],active_trip_id:null,combined_scenarios:[],records:Object.fromEntries(Object.keys(modules).map(k=>[k,[]]))});
const NAV_STORE = 'bora-viajar-nav-order';
let library = TravelTrips.migrate(initial()), state = TravelTrips.view(library), storageBlocked = false, loadError = false, storedSnapshot = null;
try {
  const raw=localStorage.getItem(STORE);storedSnapshot=raw;
  if(raw) {
    const parsed=JSON.parse(raw), migrated=TravelTrips.migrate(parsed);
    if(parsed.version===1) {
      localStorage.setItem(STORE+'-antes-migracao-v2',raw);
      const serialized=JSON.stringify(migrated);localStorage.setItem(STORE,serialized);storedSnapshot=serialized;
    }
    library=migrated;state=TravelTrips.view(library);
  }
} catch { storageBlocked=true;loadError=true; }
const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','') : 'A definir';
const money = (v, currency='BRL') => { try { return new Intl.NumberFormat('pt-BR',{style:'currency',currency}).format(numeric(v) ?? 0); } catch { return `${esc(currency)} ${numeric(v) ?? 0}`; } };
const rows = k => k === 'orcamento' ? TravelCore.effectiveBudget(state) : state.records[k] || [];
const titleOf = r => r.nome || r.titulo || r.descricao || [r.origem,r.destino].filter(Boolean).join(' → ') || 'Sem título';
let page = '', search = '', filter = '', editing = null, importMode = '', toastTimer, orderingNav = false;
function navOrder() {
  let saved=[];try { saved=JSON.parse(localStorage.getItem(NAV_STORE)||'[]'); } catch {}
  const keys=Object.keys(modules);return [...saved.filter(k=>keys.includes(k)),...keys.filter(k=>!saved.includes(k))];
}
function moveNav(key,direction) {
  const order=navOrder(),from=order.indexOf(key),to=from+direction;if(from<0||to<0||to>=order.length)return;
  [order[from],order[to]]=[order[to],order[from]];localStorage.setItem(NAV_STORE,JSON.stringify(order));nav();
}
function toast(msg) { $('#toast').textContent = msg; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500); }
function persist(next) {
  if (loadError) { toast('O armazenamento não pôde ser lido. Exporte uma cópia dos dados antes de continuar em outro navegador.'); return false; }
  try {
    const all=next.trips?TravelTrips.validate(next):TravelTrips.merge(library,next);
    if(localStorage.getItem(STORE)!==storedSnapshot) throw new Error('Os dados mudaram em outra aba. Recarregue a página antes de salvar.');
    const serialized=JSON.stringify(all);localStorage.setItem(STORE,serialized);
    storedSnapshot=serialized;library=all;state=TravelTrips.view(library);storageBlocked=false;return true;
  } catch(error) { toast('Não foi possível salvar. '+error.message);return false; }
}
function nav() {
  const items = [['viagens','Minhas viagens'],...(state.trip?navOrder().map(k=>[k,modules[k].short]):[]),['combinados','Cenários combinados'],['proximas','Viagens próximas'],['calendario','Calendário global'],['dados','Meus dados'],['mais','Mais']];
  $('#navigation').classList.toggle('ordering',orderingNav);
  $('#navigation').innerHTML=items.map(([k,label])=>`<div class="nav-row ${modules[k]?'module-nav':''}"><a href="#${k}" class="nav-item ${(['viagens','roteiro','hoteis','orcamento','mais'].includes(k) || (!state.trip && k==='dados'))?'mobile-nav':''} ${k==='mais'?'mobile-only':''} ${page===k?'active':''}" ${page===k?'aria-current="page"':''}>${icon(k)}<span>${label}</span>${modules[k]?`<span class="count">${rows(k).length || '—'}</span>`:''}</a>${modules[k]&&orderingNav?`<span class="nav-order-controls"><button type="button" data-action="nav-up" data-key="${k}" aria-label="Mover ${esc(label)} para cima">↑</button><button type="button" data-action="nav-down" data-key="${k}" aria-label="Mover ${esc(label)} para baixo">↓</button></span>`:''}</div>`).join('');
  const toggle=$('#nav-order-toggle');if(toggle){toggle.textContent=orderingNav?'Concluir':'Reordenar';toggle.setAttribute('aria-pressed',String(orderingNav));}
}
function heading(title,subtitle,action='') { return `<div class="page-heading"><div><span class="eyebrow">PLANEJAR TAMBÉM É PARTE DA VIAGEM</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${action}</div>`; }
function totalText(totals, key='total') { return Object.entries(totals).map(([c,v])=>money(v[key],c)).join(' + ') || money(0); }
function dashboard() {
  const trip=state.trip, totals=budget(rows('orcamento'));
  const events=[...rows('compromissos')];
  if (!events.length && trip.evento?.nome) events.push({nome:trip.evento.nome,data_inicio:trip.evento.inicio,local:trip.evento.local,status:'DA CONFIGURAÇÃO'});
  events.sort((a,b)=>(a.data_inicio||'9999').localeCompare(b.data_inicio||'9999'));
  const steps=[['estadias','Organizar as etapas da viagem'],['hoteis','Pesquisar uma hospedagem'],['deslocamentos','Organizar os transportes'],['roteiro','Começar o roteiro diário']];
  const completed=steps.filter(([k])=>rows(k).length).length;
  return heading('Sua próxima história','Tudo o que você precisa para tirar a viagem do papel.')+`
    <section class="hero" aria-label="Viagem atual"><div class="hero-content"><span class="pill">◦ &nbsp; Próximo destino</span><h2>${esc(trip.nome)}</h2><p>Saindo de ${esc(trip.origem || 'origem a definir')} · ${esc(trip.destino_principal?.cidade || 'destino a definir')}</p><div class="hero-bottom"><span>▦ &nbsp; ${date(trip.data_inicio)} — ${date(trip.data_fim)}</span><span>·</span><span>${trip.data_fim?'Datas definidas':'Planejamento em construção'}</span></div></div><span class="hero-badge">NOVOS CAMINHOS, BOAS MEMÓRIAS</span></section>
    <div class="stats">${[
      ['estadias','Etapas',rows('estadias').length,'momentos da sua viagem'],
      ['hoteis','Hospedagens',rows('hoteis').length,'opções para comparar'],
      ['roteiro','Meu roteiro',rows('roteiro').length,'atividades planejadas'],
      ['orcamento','Orçamento',totalText(totals),'despesas registradas'],
    ].map(([k,label,value,sub])=>`<a href="#${k}" class="stat"><div class="stat-top">${label}${icon(k)}</div><strong>${value}</strong><small>${sub}</small></a>`).join('')}</div>
    ${stagesOverview()}
    <div class="dashboard-grid"><div><section class="panel"><div class="section-top"><h2>No horizonte</h2><a class="text-link" href="#compromissos">Ver eventos ↗</a></div>${events.length?events.slice(0,3).map(r=>`<div class="event"><div class="date-box"><strong>${esc(r.data_inicio?.slice(8,10)||'—')}</strong>${esc(date(r.data_inicio).split(' ').slice(1).join(' ').replace('de ',''))}</div><div><span class="tag">${esc(r.status || 'PLANEJADO')}</span><h3>${esc(titleOf(r))}</h3><p>${esc(r.local || 'Local a definir')}</p></div></div>`).join(''):'<p class="muted">Seus próximos compromissos aparecerão aqui.</p>'}</section>
    <section class="panel"><div class="section-top"><h2>Próximos passos</h2><span class="muted">${completed} de 4</span></div>${steps.map(([k,label],i)=>`<a class="task" href="#${k}"><span class="task-number">${rows(k).length?'✓':i+1}</span>${label}<span>↗</span></a>`).join('')}<div class="progress-track"><div style="width:${completed*25}%"></div></div><small class="muted">${completed===4?'As quatro seções já têm registros.':'Cada pequeno passo aproxima você do destino.'}</small></section></div>
    <div><section class="panel inspiration"><span class="eyebrow">DO SEU JEITO</span><h2>Menos pressa.<br>Mais descobertas.</h2><p>Um roteiro com espaço para os seus interesses e para o inesperado.</p><div class="interest-list">${(trip.preferencias?.interesses || []).map(s=>`<span>${esc(s)}</span>`).join('')}</div></section><section class="panel"><div class="section-top"><h2>Seu planejamento, seguro</h2>${icon('dados')}</div><p class="muted">Os dados ficam neste navegador. Exporte um backup para guardar uma cópia ou levar para outro dispositivo.</p><button class="button" data-action="backup">Exportar backup ↗</button></section></div></div>`;
}
function recordCard(key,r) {
  if(key==='estadias') return stageCard(r);
  if(key==='hoteis') return hotelCard(r);
  if(key==='orcamento') return expenseCard(r);
  const meta=[];
  if(r.estadia_id) meta.push(stageName(r.estadia_id));
  if(r.cidade) meta.push(r.cidade);
  if(r.local) meta.push(r.local);
  if(r.data || r.data_inicio || r.data_saida) meta.push(date(r.data || r.data_inicio || r.data_saida)+(r.data_fim?' → '+date(r.data_fim):''));
  if(r.hora_inicio || r.hora_saida) meta.push(r.hora_inicio || r.hora_saida);
  if(r.empresa) meta.push(r.empresa);
  if(r.nota && r.escala_notas_plataforma) meta.push(`Nota publicada: ${r.nota}/${r.escala_notas_plataforma}`);
  if(r.duracao_estimada_min) meta.push(`${r.duracao_estimada_min} min`);
  const price=key==='orcamento'||key==='alimentacao'?r.valor:key==='hoteis'?r.preco_diaria:key==='cenarios'?r.custo_total:r.preco;
  const validLink = /^https?:\/\//i.test(r.link||'');
  return `<article class="record"><span class="tag ${['EM PESQUISA','ESTIMADO','EM ANÁLISE'].includes(r.status)?'warm':''}">${esc(r.status || r.categoria || (key==='hoteis'?'OPÇÃO EM PESQUISA':modules[key].short.toUpperCase()))}</span><h2>${esc(titleOf(r))}</h2><div class="record-meta">${meta.map(s=>`<span>${esc(s)}</span>`).join('')}</div>${numeric(price)!==null?`<div class="record-price">${money(price,r.moeda||'BRL')} ${key==='hoteis'?'<small class="muted">/ noite</small>':''}</div>`:''}${r.observacoes?`<p class="record-note">${esc(r.observacoes)}</p>`:''}<div class="record-actions">${validLink?`<a class="button" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer">Abrir link ↗</a>`:''}<button class="button" data-action="edit" data-id="${esc(r[modules[key].id])}">Editar</button><button class="button danger" data-action="delete" data-id="${esc(r[modules[key].id])}">Excluir</button></div></article>`;
}
function recordsHTML() {
  const mod=modules[page];
  let items=rows(page).filter(r=>(!stageFilter || (stageFilter==='unassigned'?!r.estadia_id:r.estadia_id===stageFilter)) && (!search || Object.entries(r).filter(([k])=>k!=='print_data').map(([,v])=>v).join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))) && (!filter || r.status===filter));
  if(page==='estadias') items=items.sort((a,b)=>(numeric(a.ordem)||0)-(numeric(b.ordem)||0));
  if(page==='roteiro') items=items.toSorted((a,b)=>((a.data||'9999')+(a.hora_inicio||'99')).localeCompare((b.data||'9999')+(b.hora_inicio||'99')));
  if(!items.length) return `<div class="empty">${icon(page)}<h2>${search||filter||stageFilter?'Nenhum resultado por aqui':'Espaço para os seus planos'}</h2><p>${search||filter||stageFilter?'Experimente outro termo ou remova os filtros.':page==='cenarios'?'Use cenários para registrar uma alternativa desta viagem, por exemplo “adiar uma semana”. Para combinar duas ou mais viagens, abra Cenários combinados.':`Adicione ${mod.singular==='atividade'?'a primeira atividade':`um registro de ${mod.singular}`} ou importe os dados que você já tem em CSV.`}</p>${search||filter||stageFilter?'<button class="button" data-action="clear-search">Limpar filtros</button>':`<button class="button primary" data-action="add">+ Adicionar ${mod.singular}</button>`}</div>`;
  let previous='';
  return items.map(r=>{let label='';if(page==='roteiro' && r.data!==previous){previous=r.data;label=`<h2 class="timeline-date">${date(r.data)}</h2>`;}return label+recordCard(page,r);}).join('');
}
function collection() {
  const mod=modules[page], totals=budget(scopedExpenses());
  let html=heading(mod.title,mod.description,`<button class="button primary" data-action="add">+ Adicionar</button>`);
  html+=stageToolbar();
  if(page==='orcamento') {
    const groups=groupedBudget(scopedExpenses());
    html+=`<div class="stats budget-stats"><div class="stat"><div class="stat-top">Total registrado</div><strong>${totalText(totals)}</strong><small>Inclui estimados, confirmados e pagos</small></div><div class="stat"><div class="stat-top">Já pago</div><strong>${totalText(totals,'paid')}</strong><small>Somente despesas com situação PAGO</small></div></div><section class="panel budget-groups"><div class="section-top"><h2>Totais por categoria e tipo</h2></div><div class="budget-group-grid">${groups.length?groups.map(g=>`<div><span>${esc(g.categoria)}</span><strong>${esc(g.tipo||'GERAL')}</strong><b>${money(g.valor,g.moeda)}</b><small>${g.quantidade} despesa(s)${g.pago?` · ${money(g.pago,g.moeda)} pago`:''}</small></div>`).join(''):'<p class="muted">Os totais agrupados aparecerão quando você adicionar despesas.</p>'}</div></section><p class="notice">Despesas da mesma categoria e do mesmo tipo são somadas neste resumo — por exemplo, todos os jantares ou todos os transportes de avião. O orçamento reúne despesas manuais, a hospedagem escolhida e os valores registrados em Alimentação e Transportes. Moedas diferentes permanecem separadas, sem conversão.</p>`;
  }
  if(page==='hoteis') html+='<p class="notice">Compare hotéis por etapa. Toque em Escolher para incluir o custo no orçamento. Isso não efetua uma reserva.</p>';
  if(page==='cenarios') html+='<p class="notice">Use esta seção para alternativas da viagem aberta. Exemplo: “adiar uma semana”. Para avaliar realizar ambas, apenas uma ou mudar a ordem de várias viagens, use <a href="#combinados">Cenários combinados</a>.</p>';
  const statuses=[...new Set(rows(page).map(r=>r.status).filter(Boolean))];
  return html+`<div class="toolbar"><input class="search" id="search" type="search" placeholder="Buscar em ${mod.short.toLowerCase()}..." aria-label="Buscar registros" value="${esc(search)}">${statuses.length?`<select id="filter" aria-label="Filtrar por situação"><option value="">Todas as situações</option>${statuses.map(s=>`<option ${filter===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`:''}<button class="button" data-action="import-csv">Importar CSV</button><button class="button" data-action="export-csv" ${rows(page).length?'':'disabled'}>Exportar CSV</button></div><div id="records" class="cards">${recordsHTML()}</div>`;
}
function dataPage() { return heading('Seus dados, com você','Guarde uma cópia do planejamento e continue de onde parou.')+`<div class="notice">Os dados são salvos apenas neste navegador e neste endereço. Não há sincronização automática entre computador e celular. Mantenha um backup antes de limpar o navegador ou mudar de endereço.</div><div class="data-grid"><section class="panel"><h2>Backup completo</h2><p>Salve todas as viagens, suas configurações e registros em um arquivo JSON.</p><button class="button primary" data-action="backup">Exportar backup</button><button class="button" data-action="restore">Restaurar backup</button></section><section class="panel"><h2>Do notebook para o app</h2><p>Em cada seção, use “Importar CSV” e selecione o arquivo correspondente da pasta <strong>01_dados</strong> do seu Google Drive. As colunas extras são preservadas.</p><p>O notebook enviado contém código e saídas de execução; os bancos CSV não vieram junto. Por isso, nenhuma hospedagem, reserva ou despesa foi presumida.</p><button class="button" data-action="import-config">Importar config_viagem.json</button></section><section class="panel"><h2>Acesso pelo celular</h2><p>Na versão hospedada, abra o endereço do Bora Viajar no navegador do celular. No iPhone, use Compartilhar → Adicionar à Tela de Início. No Android, procure Adicionar à tela inicial ou Instalar app no menu do navegador.</p><p>O endereço hospedado funciona sem o computador ligado e precisa de internet. Para transferir seu planejamento da versão local, exporte o backup e restaure-o neste endereço.</p></section><section class="panel"><h2>Sua base original</h2><p>Esta interface facilita o planejamento diário. O notebook continua responsável pelos cálculos avançados de ranking, geocodificação e mobilidade.</p><p>Os dados do navegador não alteram os arquivos do notebook. Para intercâmbio, use os arquivos CSV; para uma cópia fiel de todo o app, use o backup JSON.</p></section></div>`; }
function render() {
  const requested=location.hash.slice(1)||'viagens';
  page=Object.hasOwn(modules,requested)||['viagens','comparar','combinados','proximas','calendario','inicio','dados','mais'].includes(requested)?requested:'viagens';
  if(!state.trip && !['dados','comparar','combinados','proximas','calendario'].includes(page))page='viagens';
  renderTripSwitcher();
  nav(); $('#breadcrumb').textContent=modules[page]?.title || ({viagens:'Minhas viagens',comparar:'Comparar viagens',combinados:'Cenários combinados',proximas:'Viagens próximas',calendario:'Calendário global',inicio:'Visão geral',dados:'Meus dados',mais:'Mais opções'}[page]);
  $('#main').innerHTML=(storageBlocked?'<p class="notice" role="alert">O armazenamento do navegador não está disponível ou o backup salvo é incompatível. Os dados existentes não serão sobrescritos. Exporte o que conseguir recuperar e verifique as permissões do navegador.</p>':'')+(page==='viagens'?tripsPage():page==='comparar'?comparisonPage():page==='combinados'?combinedScenariosPage():page==='proximas'?nearbyTripsPage():page==='calendario'?globalCalendarPage():page==='inicio'?dashboard():page==='dados'?dataPage():page==='mais'?heading('Tudo para a viagem','Encontre cada detalhe do seu planejamento.')+`<div class="more-grid">${[...new Map([...Object.entries(modules).map(([k,v])=>[k,v.title]),['combinados','Cenários combinados'],['proximas','Viagens próximas'],['calendario','Calendário global'],['viagens','Minhas viagens'],['dados','Meus dados']])].map(([k,label])=>`<a href="#${k}">${icon(k)}${label}</a>`).join('')}</div>`:collection());
}
function fieldHTML(f, values) {
  const value=values[f.key] ?? '', required=f.required?'required':'', wide=f.type==='textarea';
  let input;
  if(f.key==='estadia_id') { input=`<select name="estadia_id" ${required}><option value="">${required?'Selecione uma etapa':'Sem etapa / geral'}</option>${rows('estadias').map(s=>`<option value="${esc(s.estadia_id)}" ${value===s.estadia_id?'selected':''}>${esc(s.nome)}</option>`).join('')}</select>`; }
  else if(Array.isArray(f.type)) { const opts=[...f.type];if(value && !opts.includes(String(value))) opts.push(String(value));input=`<select name="${f.key}" ${required}><option value="">Selecionar</option>${opts.map(v=>`<option value="${esc(v)}" ${String(value)===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`; }
  else if(wide) input=`<textarea name="${f.key}" ${required}>${esc(value)}</textarea>`;
  else input=`<input name="${f.key}" type="${f.type}" ${f.type==='number'?'min="0" step="any" inputmode="decimal"':''} value="${esc(f.type==='number'?(numeric(value)??''):value)}" ${required} maxlength="2000">`;
  return `<label class="field ${wide?'wide':''}">${esc(f.label)}${f.required?' *':''}${input}</label>`;
}
const tripFields=[field('situacao','Situação',['EM ANÁLISE','PLANEJADA','CONFIRMADA','CONCLUÍDA','CANCELADA']),field('nome','Nome da viagem','text',true),field('origem','Origem'),field('cidade','Destino principal'),field('estado','Estado'),field('data_inicio','Data de início','date'),field('data_fim','Data de retorno','date'),field('motivo','Motivo da viagem'),field('interesses','Interesses (separados por vírgula)')];
function openEditor(id, settings=false) {
  const mod=modules[page];
  const old=settings?state.trip:id?rows(page).find(r=>r[mod.id]===id):{};
  if (!old) return;
  editing={key:settings?'trip':page,id,old};
  const values=settings?{...old,...old.destino_principal,interesses:(old.preferencias?.interesses || []).join(', ')}:{moeda:'BRL',status:page==='orcamento'?'ESTIMADO':'',escala_notas_plataforma:'10',estadia_id:stageFilter==='unassigned'?'':stageFilter,numero_viajantes:1,numero_quartos:1,ordem:id?Math.max(1,rows('estadias').findIndex(s=>s.estadia_id===id)+1):rows('estadias').length+1,divisao:'INDIVIDUAL',status_custo:'ESTIMADO',...old};
  $('#dialog-title').textContent=settings?'Sua viagem':`${id?'Editar':'Adicionar'} ${mod.singular}`;
  $('#fields').innerHTML=(!settings && page==='hoteis'?hotelAssistantHTML(old):'')+(settings?tripFields:mod.fields.filter(f=>page!=='hoteis'||f.key!=='link')).map(f=>fieldHTML(f,values)).join('')+(!settings?'<div id="stage-context" class="field wide muted"></div>':'');
  $('#form-error').textContent=''; $('#editor').showModal();
  updateStageContext();
}
function nextID(key, items) { const mod=modules[key];let n=1;const taken=new Set(items.map(r=>r[mod.id]));while(taken.has(`${mod.prefix}_${String(n).padStart(3,'0')}`))n++;return `${mod.prefix}_${String(n).padStart(3,'0')}`; }
$('#editor-form').addEventListener('submit', e=>{
  e.preventDefault();if(!editing)return;
  const values=Object.fromEntries(new FormData(e.target).entries());
  for(const key of Object.keys(values)) { if(typeof values[key]==='string')values[key]=values[key].trim(); else delete values[key]; }
  if(editing.key==='stage-model') { saveStageModel(values); return; }
  delete values.assist_text;
  const requiredFields=editing.key==='trip'?tripFields:modules[editing.key].fields;
  if(requiredFields.some(f=>f.required && !values[f.key])) { $('#form-error').textContent='Preencha os campos obrigatórios com um valor válido.'; return; }
  const begin=values.data_inicio||values.data_saida, end=values.data_fim||values.data_chegada;
  if(begin && end && end<begin) { $('#form-error').textContent='A data final deve ser igual ou posterior à data inicial.'; return; }
  if(values.hora_inicio && values.hora_fim && (!end || end===begin) && values.hora_fim<values.hora_inicio) { $('#form-error').textContent='O horário final deve ser posterior ao inicial.'; return; }
  if(editing.key==='hoteis') {
    const scale=numeric(values.escala_notas_plataforma);
    if(['nota','nota_conforto_plataforma'].some(k=>numeric(values[k])!==null && (!scale || numeric(values[k])>scale))) { $('#form-error').textContent='Informe a escala e use notas entre zero e o máximo da escala.'; return; }
  }
  let next=structuredClone(state);
  if(editing.key==='trip') {
    const {cidade,estado,interesses,...rest}=values;
    const base=editing.newTrip?editing.old:next.trip;
    next.trip={...base,...rest,destino_principal:{...base.destino_principal,cidade,estado},preferencias:{...base.preferencias,interesses:interesses.split(',').map(v=>v.trim()).filter(Boolean)}};
    if(editing.newTrip)next=TravelTrips.add(library,next.trip);
  } else {
    const key=editing.key,mod=modules[key];
    const item={...editing.old,...values,[mod.id]:editing.id||nextID(key,next.records[key])};
    if(key==='hoteis') {
      item.print_data=editing.printData ?? editing.old.print_data ?? '';
      if(TravelCore.selected(item) && item.estadia_id!==editing.old.estadia_id) {
        if(editing.old.status_custo==='PAGO') { $('#form-error').textContent='Revise a situação do custo pago antes de mover a hospedagem para outra etapa.';return; }
        item.escolhido=false;
        toast('Etapa alterada. Escolha novamente esta hospedagem na nova etapa.');
      }
      if((numeric(item.numero_noites)!==null && (!Number.isInteger(numeric(item.numero_noites)) || numeric(item.numero_noites)<1)) || (numeric(item.numero_quartos)!==null && (!Number.isInteger(numeric(item.numero_quartos)) || numeric(item.numero_quartos)<1))) { $('#form-error').textContent='Noites e quartos devem ser números inteiros maiores que zero.'; return; }
    }
    const relationError=recordDateError(key,item,next);
    if(relationError) { $('#form-error').textContent=relationError;return; }
    item.viagem_id=state.trip.id;
    if(editing.id) next.records[key]=next.records[key].map(r=>r[mod.id]===editing.id?item:r); else next.records[key].push(item);
  }
  if(persist(next)) { $('#editor').close();render();toast('Alterações salvas neste navegador.'); }
});
function download(name,content,type) { const url=URL.createObjectURL(new Blob([content],{type})); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000); }
function backup() { download(`bora-viajar-${new Date().toISOString().slice(0,10)}.json`,loadError?(localStorage.getItem(STORE)||'{}'):JSON.stringify(library,null,2),'application/json'); }
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='settings' && state.trip)openEditor(null,true);
  if(action==='add')openEditor();
  if(action==='edit')openEditor(button.dataset.id);
  if(action==='close')$('#editor').close();
  if(action==='backup')backup();
  if(action==='toggle-nav-order'){orderingNav=!orderingNav;nav();}
  if(action==='nav-up')moveNav(button.dataset.key,-1);
  if(action==='nav-down')moveNav(button.dataset.key,1);
  if(action==='clear-search') { search='';filter='';stageFilter='';render(); }
  if(action==='export-csv')download(`${page}.csv`,toCSV(rows(page)),'text/csv;charset=utf-8');
  if(['import-csv','restore','import-config'].includes(action)) { importMode=action==='import-csv'?page:action;$('#file-input').accept=action==='import-csv'?'.csv':'.json';$('#file-input').value='';$('#file-input').click(); }
  if(action==='delete') { const key=page,id=button.dataset.id;const row=rows(key).find(r=>r[modules[key].id]===id);if(key==='hoteis' && TravelCore.selected(row||{}) && row.status_custo==='PAGO'){toast('Revise a situação do custo pago antes de excluir a hospedagem.');return;}if(key==='estadias' && Object.entries(state.records).some(([k,list])=>k!=='estadias' && list.some(r=>r.estadia_id===id))) { toast('Esta etapa tem registros vinculados. Reatribua-os antes de excluir.');return; } if(row && confirm(`Excluir “${titleOf(row)}”? ${key==='hoteis' && TravelCore.selected(row)?'O custo automático também será retirado do orçamento. ':''}Esta ação não pode ser desfeita.`)){const next=structuredClone(state);next.records[key]=state.records[key].filter(r=>r[modules[key].id]!==id);if(persist(next)){render();toast('Registro excluído.');}} }
});
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value;$('#records').innerHTML=recordsHTML();}});
document.addEventListener('change',e=>{if(e.target.id==='filter'){filter=e.target.value;$('#records').innerHTML=recordsHTML();}});
$('#file-input').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  const importSnapshot=storedSnapshot, importingTrip=library.active_trip_id, mode=importMode;
  try {
    if(file.size>10*1024*1024)throw new Error('Selecione um arquivo de até 10 MB.');
    const text=await file.text();
    if(importSnapshot!==storedSnapshot || importingTrip!==library.active_trip_id || mode!==importMode)throw new Error('A viagem ou os dados mudaram durante a leitura. Selecione o arquivo novamente.');
    let next=structuredClone(state);
    if(importMode==='restore') {
      next=TravelTrips.migrate(JSON.parse(text));
      if(!confirm('Restaurar este backup substituirá os dados atuais deste navegador. Deseja continuar?'))return;
      backup();
      if(loadError)throw new Error('Recarregue ou recupere os dados originais antes de restaurar.');
      localStorage.setItem(STORE+'-antes-restauracao',localStorage.getItem(STORE)||JSON.stringify(library));
    } else if(importMode==='import-config') {
      const trip=JSON.parse(text);
      if(!trip || typeof trip.nome!=='string' || !trip.nome.trim() || typeof trip.id!=='string' || (trip.preferencias?.interesses && !Array.isArray(trip.preferencias.interesses)))throw new Error('Configuração de viagem inválida.');
      if(!state.trip || trip.id!==state.trip.id)throw new Error('Esta configuração pertence a outra viagem. Abra ou crie a viagem correspondente antes de importar.');
      next.trip=trip;
    } else {
      const key=importMode,mod=modules[key],incoming=parseCSV(text);
      if(!Object.hasOwn(incoming[0],mod.id))throw new Error(`CSV incorreto: esta seção espera a coluna ${mod.id}.`);
      if(incoming.some(r=>r.viagem_id && r.viagem_id!==state.trip.id))throw new Error('O CSV contém registros de outra viagem. Importe primeiro a configuração correspondente.');
      const ids=incoming.map(r=>r[mod.id]).filter(Boolean);
      if(new Set(ids).size!==ids.length)throw new Error('O arquivo contém identificadores repetidos. Corrija o CSV antes de importar.');
      const existing=new Set(rows(key).map(r=>r[mod.id]));
      if(ids.some(id=>existing.has(id)) && !confirm('Existem registros com os mesmos identificadores. Atualizar esses registros com os dados do CSV?'))return;
      for(const r of incoming) {
        if(key==='orcamento' && String(r.custo_id).startsWith('AUTO_HOTEL_')) {r.custo_id=r.custo_id.replace('AUTO_HOTEL_','IMPORTADO_HOTEL_');r.automatico=false;}
        if(!r[mod.id])r[mod.id]=nextID(key,[...next.records[key],...incoming]);
        const i=next.records[key].findIndex(old=>old[mod.id]===r[mod.id]);
        if(i>=0)next.records[key][i]={...next.records[key][i],...r};else next.records[key].push(r);
      }
    }
    if(persist(next)){render();toast('Dados importados e salvos.');}
  } catch(error) { toast(error instanceof SyntaxError?'Arquivo JSON inválido. Verifique o arquivo selecionado.':error.message); }
});
window.addEventListener('hashchange',()=>{search='';filter='';stageFilter='';render();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{
  if(e.key!==STORE && e.key!==null)return;
  try {
    if(!e.newValue)throw new Error('Armazenamento removido');
    library=TravelTrips.migrate(JSON.parse(e.newValue));state=TravelTrips.view(library);storedSnapshot=e.newValue;loadError=false;storageBlocked=false;
    if($('#editor').open)$('#editor').close();
    search='';filter='';stageFilter='';editing=null;render();toast('Dados atualizados em outra aba.');
  } catch { loadError=true;storageBlocked=true;render();toast('A atualização de outra aba não pôde ser carregada. Recarregue a página.'); }
});
configureStages();
render();
