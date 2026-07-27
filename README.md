# Controle de Horas Extras

PWA mobile-first para organizar dados de perfil e preparar o controle local de horas extras. Esta primeira etapa não calcula horas extras, valores ou fechamento de folha.

## Tecnologias

- JavaScript ES Modules, HTML e CSS
- Vite e Vitest
- IndexedDB com `fake-indexeddb` nos testes
- Service worker manual e Web App Manifest

## Executar

```bash
npm install
npm run dev
```

Para executar os testes e gerar a versão de produção:

```bash
npm run test
npm run build
npm run preview
```

Abra a URL exibida pelo Vite no navegador. Para testar a instalação no celular, acesse a versão servida por HTTPS ou pela mesma rede local, quando aplicável. O card de instalação aparece apenas em navegadores que oferecem o evento de instalação.

## Estrutura

- `src/models`: entidades e regras de validação.
- `src/services`: IndexedDB, armazenamento leve, datas, imagens e PWA.
- `src/repositories`: leitura e persistência do perfil e suas configurações.
- `src/controllers`: navegação interna e fluxo de perfil.
- `src/views`: layout persistente e telas renderizadas dentro de `main#app`.
- `public`: manifesto, service worker, ícones e avatar padrão.

## Dados locais e avatar

Todos os dados ficam no IndexedDB do próprio dispositivo. Há somente um perfil principal, identificado por `appSettings.primaryEmployeeId`. Salvar o perfil atualiza funcionário, jornada, folha e ponteiro em uma única transação.

Fotos JPG, JPEG, PNG e WEBP de até 5 MB são redimensionadas localmente para até 512×512 px, comprimidas e armazenadas como `Blob`. Nenhuma imagem ou dado é enviado a servidor.

## Implementado

- Header, menu lateral acessível e rotas hash `today`, `month`, `total` e `profile`.
- Perfil, jornada, salário, dia de fechamento e estratégia para meses sem o dia escolhido.
- IndexedDB, prevenção de perfil principal duplicado e salvamento atômico.
- Prévia de avatar, PWA instalável e cache offline após o primeiro carregamento.
- Testes de modelos, persistência transacional e navegação.

## Próximas etapas

Calendário, lançamentos de horas, cálculo de duração, adicionais, hora-base, períodos reais de folha, histórico, relatórios e exportações permanecem fora do escopo atual.
