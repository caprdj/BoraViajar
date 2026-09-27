# Desenvolvimento do Bora Viajar

O repositório `https://github.com/caprdj/BoraViajar` contém a fonte do aplicativo, recursos estáticos, testes e ferramentas locais. A raiz inicia com uma configuração pública vazia. Não copie configurações pessoais para o código.

## Em outro computador ou ambiente de desenvolvimento

Use Git, Node.js 22 ou superior e Python 3.10 ou superior. O aplicativo em si não exige instalação de pacotes nem servidor remoto.

```sh
git clone https://github.com/caprdj/BoraViajar.git
cd BoraViajar
git switch main
git pull --ff-only
git switch -c minha-alteracao
python server.py --port 8765
```

Abra `http://localhost:8765`. O servidor entrega apenas os recursos públicos permitidos; não expõe testes, documentação técnica ou arquivos pessoais. Em ambientes que usam `python3`, substitua `python` nos comandos.

Uma tarefa em outro ambiente deve partir do clone atualizado, criar sua própria branch, executar os testes e apresentar o diff antes de integrar mudanças. Não use push forçado para substituir trabalho remoto. Se `git pull --ff-only` falhar, examine as divergências antes de continuar.

## Testes

Os testes de dados e do servidor não exigem dependências extras:

```sh
node --test tests/core.test.cjs tests/stages.test.cjs tests/trips.test.cjs
python build_public.py
python -m unittest discover -s tests -p "test_*.py"
```

O teste de interface usa Playwright e um navegador de teste. Foi validado com Playwright 1.62.1. Para preparar esse teste sem adicionar dependências ao aplicativo:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
```

Com o servidor em execução, no Linux/macOS:

```sh
BROWSER_CHANNEL=chromium node tests/trips.browser.cjs
```

No PowerShell:

```powershell
$env:BROWSER_CHANNEL = 'chromium'
node tests/trips.browser.cjs
```

Em Windows com Edge instalado, o canal padrão `msedge` também funciona. Em Linux, o navegador pode exigir bibliotecas de sistema; a instalação delas depende do ambiente. `TEST_BASE_URL` permite usar outra porta (por exemplo `http://localhost:8766`). O teste usa um perfil temporário, sem os dados pessoais do navegador, e gera capturas ignoradas pelo Git.

## Arquivos que devem ser versionados

- Fonte: `app.js`, `core.js`, `stages.js`, `trips.js`, `trips-ui.js`, `index.html` e `styles.css`.
- Recursos: manifesto, ícones, `coast.svg` e `.nojekyll`.
- Ferramentas: `server.py`, `build_public.py` e `Iniciar app.cmd`.
- Documentação e testes em `tests/`; `tests/hotel-print.png` é uma imagem sintética, sem reserva real.

Não envie notebooks, configurações de viagem, reservas, CSVs, backups, documentos, tokens, caches ou capturas pessoais. O `.gitignore` ajuda a prevenir inclusões acidentais, mas revise sempre `git diff --cached` antes de enviar.

## GitHub Pages

A configuração documentada do projeto publica a raiz de `main`. Mantemos os recursos do aplicativo nessa raiz para preservar esse fluxo. `build_public.py` também gera uma cópia somente dos recursos públicos em `dist/`, útil para distribuição; `dist/` é gerado e não é versionado. Não substitua o clone inteiro por `dist/`: isso perderia testes e ferramentas.

Enviar uma branch de desenvolvimento não integra suas mudanças a `main`. Integrar a `main` pode atualizar o site conforme a configuração do Pages. Confirme a autorização para envio e publicação antes dessas ações.

Os dados de viagens continuam no armazenamento local de cada navegador. Clonar o código em outro computador não transfere esses dados; use o backup JSON do aplicativo quando necessário.
