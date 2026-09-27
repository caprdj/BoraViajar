# Bora Viajar

Planejador pessoal de viagens com interface adaptada ao celular.

Este repositório reúne a fonte principal, os testes e as ferramentas locais. Para desenvolver em outro computador, consulte [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md). A estrutura e a recuperação dos dados estão descritas em [MIGRACAO_V2.md](MIGRACAO_V2.md).

Versão 2.0: organize múltiplas viagens, alterne pelo seletor no cabeçalho e gerencie cada planejamento em “Minhas viagens”. Backups JSON incluem todas as viagens. Dados e backups da versão anterior são migrados automaticamente, preservando etapas e registros. Faça a atualização usando todos os arquivos de `dist/`, incluindo `trips.js` e `trips-ui.js`.

## Publicar com GitHub Pages

No repositório, abra **Settings → Pages**. Em **Source**, escolha **Deploy from a branch**; selecione **main** e **/(root)** e clique em **Save**.

Após a publicação, o endereço esperado é **https://caprdj.github.io/BoraViajar/**.

## Usar no celular

Abra o endereço no Safari ou Chrome. No iPhone, toque em **Compartilhar → Adicionar à Tela de Início**. No Android, use **Adicionar à tela inicial** ou **Instalar app**, conforme disponível no menu do navegador.

O app hospedado precisa de internet para abrir. O computador não precisa estar ligado.

## Dados pessoais

O repositório contém apenas a interface, iniciando com uma viagem vazia. Reservas, despesas, documentos e backups pessoais não devem ser enviados ao GitHub.

O planejamento é armazenado no navegador de cada dispositivo. Não existe sincronização automática. Use **Mais → Meus dados → Exportar backup** para guardar uma cópia e **Restaurar backup** para transferir dados entre dispositivos ou da versão local para o site publicado.

## Funcionalidades

Destinos, hospedagens, transportes, lugares, compromissos, roteiro diário, orçamento por moeda e cenários. Cadastros, pesquisa, importação/exportação CSV e backup JSON. Os cálculos avançados do notebook original não fazem parte desta interface.

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

Os recursos estáticos na raiz são a fonte do site, acompanhados de testes e ferramentas de desenvolvimento. Alterações na branch `main` são publicadas pelo GitHub Pages após sua ativação. O identificador interno de armazenamento `meu-percurso-v1` foi mantido; o conteúdo agora usa o schema 2, com migração automática e cópia preventiva.
