# BoraViajar 2.0

Esta entrega cobre somente múltiplas viagens. Comparações, câmbio, cenários combinados e o novo modelo financeiro continuam fora desta versão.

## Compatibilidade 2.2

A versão 2.2 mantém `version: 2` e acrescenta somente a coleção opcional `combined_scenarios`. Ao abrir ou restaurar um backup 2.0/2.1 sem essa propriedade, o app trabalha sobre uma cópia e inicializa a coleção vazia antes da validação. IDs, viagens, etapas, imagens e demais registros permanecem intactos. Depois do primeiro salvamento ou da próxima exportação, a nova coleção é incluída no JSON. A migração é idempotente e cenários só podem referenciar viagens existentes.

## Estrutura e compatibilidade

O armazenamento mantém a chave `meu-percurso-v1`, agora com `version: 2`, `trips[]`, `active_trip_id` e `records`. Todas as coleções recebem `viagem_id`, inclusive etapas, hotéis e cenários. As etapas continuam dentro de cada viagem.

`trips.js` concentra migração, validação, seleção, atualização, duplicação e exclusão. Os módulos existentes recebem uma cópia contendo apenas `trip` e os registros da viagem ativa. Essa visão temporária não é o formato persistido. O salvamento substitui somente a parcela da viagem ativa e preserva as demais.

Os IDs legados são mantidos. A identidade de um registro é o par `(viagem_id, ID do módulo)`, permitindo importar CSVs antigos com identificadores iguais em viagens distintas. Relações precisam apontar para registros da mesma viagem. Duplicações geram novos IDs para a viagem e seus registros e remapeiam os vínculos conhecidos. Campos extras e imagens permanecem nos dados.

## Migração e restauração

1. Ler e clonar o conteúdo, sem modificar o original.
2. Converter a versão 1, acrescentando a propriedade de viagem a cada registro.
3. Validar schema, identidades, viagem ativa, relações e regras existentes de hospedagem/divisão.
4. Antes de gravar uma migração, salvar o JSON original em `meu-percurso-v1-antes-migracao-v2`.
5. Somente depois gravar a versão 2 na chave principal.

Se a leitura, validação ou gravação falhar, a chave original permanece intacta e as edições ficam bloqueadas. O botão de backup permite exportar o conteúdo original para recuperação. Registros que indiquem outra viagem ou relações inexistentes exigem correção do arquivo; não são apagados ou reatribuídos silenciosamente.

A restauração aceita versões 1 e 2, valida antes da confirmação, exporta o backup atual e guarda uma cópia local em `meu-percurso-v1-antes-restauracao`. Essa última chave guarda a cópia da restauração mais recente; o download permite arquivá-la. Falha ao guardar a cópia preventiva impede a substituição. Backups v2 não devem ser importados na versão antiga do aplicativo.

O app reage às mudanças entre abas, fecha editores antigos e verifica se o armazenamento mudou antes de salvar. Como antes, não há sincronização entre dispositivos. Exportar o backup completo inclui todas as viagens. CSV permanece limitado à seção da viagem aberta.

## Interface e publicação

“Minhas viagens” é a entrada padrão. Os cards mostram destino, datas, dias corridos inclusivos, situação, orçamento, pago e pendente, separando moedas e preservando o cálculo automático de hospedagem. A situação da viagem é editável; o modelo financeiro anterior permanece.

Criar, editar, abrir, duplicar e excluir estão nos cards. Excluir sempre pede confirmação e remove os registros vinculados. É possível excluir a última viagem e recomeçar. O seletor no cabeçalho troca a viagem e limpa filtros. Cenários continuam pertencendo a uma viagem, como na versão anterior.

`build_public.py` inclui os novos módulos e mantém a configuração pública sem dados pessoais. `dist/` contém os arquivos para GitHub Pages. Esta entrega não publica automaticamente o site. O manifesto e os caminhos relativos foram preservados; suporte offline não foi acrescentado.

## Validação

- `node --test tests/core.test.cjs tests/stages.test.cjs tests/trips.test.cjs`
- `python build_public.py`
- `python -m unittest discover -s tests -p "test_*.py"`
- Com o servidor local na porta 8765 e Playwright disponível: `node tests/trips.browser.cjs`. Por padrão usa o Edge instalado, em perfil temporário; `BROWSER_CHANNEL` permite mudar o canal.

Os testes cobrem migração imutável, isolamento, IDs legados coincidentes entre viagens, duplicação com vínculos, exclusão, backup, dados inválidos, criação após excluir todas as viagens, falha de armazenamento, atualização entre abas e layout móvel. Os testes anteriores continuam cobrindo CSV, hospedagem automática, divisão, interpretação de links e texto extraído de prints.
