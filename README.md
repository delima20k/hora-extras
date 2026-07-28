# Controle de Horas Extras

PWA mobile-first para registrar horas extras pessoais. O aplicativo funciona localmente no navegador: não exige conta, não envia dados a servidores e pode ser instalado em dispositivos Android compatíveis.

## Funcionalidades

- Perfil único com foto, jornada, salário e configuração de fechamento.
- Calendário mensal navegável e persistência do período selecionado.
- Lançamentos de horas extras, inclusive atravessando a meia-noite, com validação de conflitos e exclusão lógica.
- Total mensal de duração e estimativa financeira simples baseada em salário mensal/jornada cadastrada.
- Instalação PWA, cache offline após o primeiro acesso e suporte a tema escuro do sistema.

> A estimativa financeira não calcula adicionais legais, impostos, banco de horas, períodos de folha ou encargos. Ela não substitui cálculo trabalhista ou de folha de pagamento.

## Arquitetura e privacidade

- JavaScript ES Modules, HTML5, CSS3, Vite e Vitest.
- IndexedDB para perfil, jornada, configurações e lançamentos; LocalStorage somente para período do calendário e dispensa temporária da instalação.
- O banco usa transações para salvar o perfil e índices por funcionário/data para consultas eficientes.
- Avatares JPG, JPEG, PNG e WEBP de até 5 MB são redimensionados localmente e salvos como `Blob`.
- Dados do usuário são inseridos na interface com APIs DOM seguras; não há envio de dados, analytics, tokens ou segredos.

Não há Firebase Authentication, Firestore, Cloud Functions, App Check, SmartThings, bridge local, WebSocket, controle remoto, integrações de streaming ou backend neste projeto. Portanto, auditorias desses serviços são **não aplicáveis** à versão atual.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes e validação

```bash
npm run test
npm run test:e2e
npm run build:firebase
npm run build:github
npm audit --omit=dev
```

Os testes unitários cobrem modelos, persistência, cálculo de tempo, perfil, calendário, rotas e regressões de transação/cache. Os testes de navegador cobrem menu por teclado, acessibilidade com Axe, Service Worker e larguras de 320 a 1440 px.

## Publicação

### Firebase Hosting

O `firebase.json` serve `dist` e redireciona rotas para `index.html`.

```bash
npm run build:firebase
firebase login
firebase use --add
firebase deploy --only hosting
```

O Firebase CLI e o projeto Firebase devem ser configurados pelo responsável pela conta. Nenhuma credencial é armazenada neste repositório.

### GitHub Pages

```bash
npm run build:github
```

Publique o conteúdo de `dist` no repositório `delima20k/hora-extras` usando GitHub Pages. Esse build usa a base `/hora-extras/`; o build Firebase usa `/`.

## Auditoria de produção

| Achado | Correção |
| --- | --- |
| Calendário não recebia mês/ano inicial válidos | Estado padronizado em `selectedMonth` e `selectedYear`. |
| Consulta de lançamentos filtrava todo o histórico | Índice composto `employeeId_date` e consulta por faixa mensal. |
| Atualizações assíncronas podiam renderizar tela fechada | Controladores de dia e total cancelam respostas obsoletas. |
| Menu lateral não continha foco | Foco inicial, retorno ao gatilho, Escape, overlay e ciclo de Tab implementados. |
| Cache do Service Worker podia interferir no Vite local | Módulos de desenvolvimento não são cacheados; cache de produção é versionado. |
| Contraste do calendário abaixo de WCAG AA | Cores ajustadas e verificadas com Axe. |
| Documentação descrevia uma etapa antiga | README atualizado com comportamento, limites, testes e deploy atuais. |

## Limites conhecidos

- O aplicativo é local a cada navegador/dispositivo; não há sincronização ou backup em nuvem.
- A licença ainda não foi definida pelo proprietário do repositório.
