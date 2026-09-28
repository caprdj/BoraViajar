# Bora Viajar

Planejador pessoal de viagens com interface adaptada ao celular.

Este repositório reúne a fonte principal, os testes e as ferramentas locais. Para desenvolver em outro computador, consulte [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md). A estrutura e a recuperação dos dados estão descritas em [MIGRACAO_V2.md](MIGRACAO_V2.md).

Versão 2.0: organize múltiplas viagens, alterne pelo seletor no cabeçalho e gerencie cada planejamento em “Minhas viagens”. Backups JSON incluem todas as viagens. Dados e backups da versão anterior são migrados automaticamente, preservando etapas e registros. Faça a atualização usando todos os arquivos de `dist/`, incluindo `trips.js` e `trips-ui.js`.

Versão 2.1: selecione duas ou mais viagens em “Minhas viagens” para comparar lado a lado período, estrutura logística, custos por categoria, valores pagos e pendentes, custo por dia e sua parte. As moedas permanecem separadas e a comparação não cria notas ou recomendações.

Versão 2.2: crie cenários que combinam duas ou mais viagens, incluindo a alternativa de fazer ambas, desativar uma ou ajustar ordem e datas. A análise de viagens próximas separa conflitos calculados de sugestões de encadeamento, e o calendário global reúne viagens, etapas, hospedagens escolhidas, transportes e eventos com acesso ao cadastro original. Valores continuam separados por moeda.

## Publicar com GitHub Pages

O workflow **Publicar Bora Viajar** prepara somente os arquivos públicos e publica automaticamente cada atualização integrada à branch `main`. Em **Settings → Pages**, mantenha **Source** configurado como **GitHub Actions**. Também é possível executar esse workflow manualmente pela aba **Actions**.

Após a publicação, o endereço esperado é **https://caprdj.github.io/BoraViajar/**.

## Usar no celular

Abra o endereço no Safari ou Chrome. No iPhone, toque em **Compartilhar → Adicionar à Tela de Início**. No Android, use **Adicionar à tela inicial** ou **Instalar app**, conforme disponível no menu do navegador.

O app hospedado precisa de internet para abrir. O computador não precisa estar ligado.

## Dados pessoais

O repositório contém apenas a interface, iniciando na lista vazia de planejamentos. Reservas, despesas, documentos e backups pessoais não devem ser enviados ao GitHub.

O planejamento é armazenado no navegador de cada dispositivo. Não existe sincronização automática. Use **Mais → Meus dados → Exportar backup** para guardar uma cópia e **Restaurar backup** para transferir dados entre dispositivos ou da versão local para o site publicado.

## Funcionalidades

Destinos, hospedagens, transportes, lugares, compromissos, roteiro diário, orçamento por moeda e cenários. Cadastros, pesquisa, importação/exportação CSV e backup JSON. Os cálculos avançados do notebook original não fazem parte desta interface.

### Análises globais da versão 2.2

**Cenários combinados** são planos de avaliação, não reservas: cada cenário referencia pelo menos duas viagens existentes e permite incluir ou desconsiderar cada uma, inverter a ordem e testar novas datas. Os totais vêm dos registros cadastrados e são exibidos por moeda, sem conversão. Dias disponíveis contam datas únicas do cenário; deslocamentos e compromissos vêm das viagens incluídas.

**Viagens próximas** considera viagens com período completo. Sobreposições são marcadas como conflitos; intervalos de até três dias livres são oportunidades. A possível conexão entre destinos é identificada explicitamente como sugestão e não substitui nenhuma viagem nem altera dados.

**Calendário global** ordena todos os registros datados de todas as viagens e permite abrir a seção de origem. Ele inclui o período geral, etapas, hospedagens vinculadas a etapas, transportes e eventos. Sobreposições entre viagens e choques envolvendo transportes ou eventos são sinalizados. No celular, cada ocorrência vira um cartão de largura única.

### Etapas, companhia e hospedagem

Em **Mais → Etapas**, crie os momentos da viagem ou use o modelo de três etapas (congresso e turismo em dois destinos). O modelo sugere 1 viajante no congresso e 2 no turismo; o número é editável, e as datas precisam ser informadas. Os registros antigos de estadias passam a ser apresentados como etapas, mantendo seus IDs e os dados existentes.

Cada etapa tem ordem, cidade, datas, número de viajantes e acompanhantes. Hospedagens, atividades, eventos, lugares, transportes e despesas podem ser vinculados à etapa. O roteiro e os compromissos são validados contra as datas da etapa ao salvar seus formulários. As listagens têm filtro por etapa.

Cadastre várias opções em **Hospedagens**. O botão **Escolher e incluir no orçamento** mantém uma escolha por etapa. O custo automático usa o total cotado (já incluindo quartos e taxas) ou, se vazio, diária por quarto × noites × quartos. Noites em branco seguem as datas da etapa. Totais cotados não mudam com as datas; confira a validade da oferta antes de reservar. Escolher não faz uma reserva no hotel.

O orçamento mostra o custo total e sua parte. **INDIVIDUAL** significa que você paga o total; **IGUAL** divide pelo número de viajantes da etapa; **PERSONALIZADO** usa o valor informado. Alterar a escolha substitui o custo automático. Custos automáticos são editados pela hospedagem, inclusive a situação ESTIMADO/CONFIRMADO/PAGO. Uma escolha marcada como paga exige revisão dessa situação antes de ser retirada ou trocada.

Despesas manuais vinculadas ao mesmo `hotel_id` têm prioridade sobre o custo automático, para evitar duplicação. Despesas manuais nunca são apagadas ao trocar uma escolha. Registros manuais sem `hotel_id` não podem ser reconhecidos como duplicados: revise-os ao escolher um hotel já lançado. Despesas automáticas exportadas em CSV voltam como manuais na importação; prefira o backup JSON para transferir todas as relações fielmente.

### Cadastro por link e print

No formulário da hospedagem, cole o endereço e toque em **Ler link**. A fonte vem do domínio e as noites vêm das datas no endereço, quando presentes. Links de hotel do Booking também podem sugerir o nome. O app não acessa o conteúdo das páginas de reserva, não busca preços em tempo real e não substitui campos já preenchidos.

Use **Anexar print → Ler texto do print** para leitura local com [Tesseract.js](https://github.com/naptha/tesseract.js), versão 6.0.1. A primeira leitura baixa a biblioteca e os modelos de idioma pela internet. A imagem é processada no aparelho, sem envio a um serviço de OCR. Textos identificados ficam disponíveis para revisão; somente preços com rótulo explícito de diária ou total são sugeridos. Também é possível colar o texto da oferta. A leitura pode errar, especialmente em imagens pequenas ou com várias ofertas; confira todos os campos.

Prints JPG/PNG/WebP de até 10 MB são reduzidos para armazenamento local. O backup JSON inclui os prints; CSV não inclui imagens. Muitos prints podem esgotar o armazenamento do navegador: o app informa a falha e mantém o formulário aberto para corrigir, sem descartar silenciosamente os dados anteriores.

## Atualizações

Os recursos estáticos na raiz são a fonte do site, acompanhados de testes e ferramentas de desenvolvimento. Alterações na branch `main` são publicadas pelo workflow do GitHub Pages. O build recria `dist/` do zero para que recursos antigos não permaneçam no site, e os arquivos da versão 2.1 usam identificadores de cache atualizados. O identificador interno de armazenamento `meu-percurso-v1` e o schema 2 foram mantidos. Backups anteriores recebem automaticamente a coleção vazia `combined_scenarios`; registros e relações existentes não são modificados. Cenários combinados passam a fazer parte do backup JSON e são validados na restauração.
