# Changelog

Todas as mudanças relevantes do projeto estão documentadas aqui.

---

## [2.2.0] - 2026-05-28

### Bot GAS (v1.1.0) — CRM de Clientes
- Nova aba "Clientes" consolidada automaticamente às 6h (`consolidarClientes()`)
- Identificador por telefone normalizado: remove +55, código de país, parênteses, espaços e traços
- Normalização aplicada também em deduplicação (`_isDuplicado`) e contagem de pedidos anteriores
- Campos calculados: pedidos, total gasto, ticket médio, primeiro/último pedido, sabor favorito, sabores detalhados, ocasiões usadas
- Campos manuais preservados na consolidação: aniversário, Instagram, notas
- Cabeçalho e formatação de datas/valores aplicados automaticamente na criação da aba
- `criarTriggers()` atualizado com trigger diário às 6h para `consolidarClientes`

---

## [2.1.0] - 2026-05-28

### Correções
- QR Pix: removidos atributos `width`/`height` do SVG via JS — eliminada barra branca abaixo do código
- Slots de entrega: campo de data exibido imediatamente quando "Agendar" está pré-selecionado (fora do horário o `change` event nunca disparava)
- Mensagem do cartão no resumo: layout alterado para coluna — texto longo não desalinha mais
- Formato de data na planilha corrigido de `DD/MM/YYYY` (inválido no Sheets) para `dd/MM/yyyy HH:mm`
- `verificarPedidosParados`: range de leitura corrigido de 16 para 19 colunas — campo `quando` (col S) estava sendo lido como `undefined`

### Bot GAS (v1.0.1)
- Removido objeto `_E` — `\u{1F49B}` usado inline onde necessário (caption Telegram)
- Mescladas funções `_itensTexto` e `_itensTextoObj` (eram idênticas)
- Alertas de pedidos parados ordenados por urgência e exibem campo `quando`
- Novo comando `/pendentes`: lista pedidos não concluídos ordenados por urgência, sempre no tópico Status

### Site
- Sub-texto dos slots alterado para linguagem neutra ("Em até 2h" em vez de "Entrega na próxima hora")
- Labels "Entrega" / "Retirada" dinâmicos no resumo e na mensagem WA
- Agendamento limitado a 21 dias a partir de hoje
- Emojis removidos da mensagem WA do formulário (ocasião e cartão)

---

## [2.0.0] - 2026-05-28

### Bot GAS (v1.0.0 — reescrita)
- Condensado e versionado do zero a partir das versões anteriores
- Emojis nas mensagens WA gerados via `String.fromCodePoint()` para evitar corrupção no editor GAS
- Proteção contra pedido duplicado: mesmo WhatsApp + mesmos itens em 5 minutos
- Slots de disponibilidade enviados ao Sheets (`quando`)
- Triggers de relatório semanal (segunda 8h) e mensal (dia 1 às 8h)
- Imagem de agradecimento: todos os 4 placeholders substituídos (`{{nome}}`, `{{numero}}`, `{{itens}}`, `{{form_url}}`)
- Coluna de data com formato `dd/MM/yyyy HH:mm`
- Funções de teste movidas para `bot_tests.gs` (separado)

### Site
- QR Code Pix dinâmico com payload EMV — substitui link `pix://` que não funcionava no Brave/Safari
- Slots de entrega dinâmicos baseados no horário de Fortaleza
- Aviso de fora do horário com previsão do próximo dia útil
- Mensagem de sucesso adaptada ao horário

---

## [1.1.0] - 2026-05-27

### Performance
- Imagens extraídas do HTML para arquivos externos — página reduziu de 1,5 MB para 22 KB
- Adicionado `loading="lazy"` nas imagens dos produtos

### SEO
- Meta tags `description` e Open Graph adicionadas
- `theme-color` para personalizar barra do navegador no mobile

### UX / Formulário
- Validação inline substituindo `alert()`
- Máscara de formatação automática no campo de telefone
- `inputmode="numeric"` para teclado numérico no mobile
- Campos em `<form>` com `onsubmit` — suporte a Enter

### Acessibilidade
- `aria-label` nos botões de quantidade
- `aria-live="polite"` no contador para leitores de tela

### Código
- Constantes `PIX_KEY` e `WA_NUMBER` criadas
- Mensagem WA reescrita com `encodeURIComponent`
- Fallback para `navigator.clipboard` sem HTTPS

---

## [1.0.0] - 2026-05-24

### Lançamento inicial
- Página única com cardápio de 5 sabores
- Controle de quantidade e resumo em tempo real
- Formulário com nome, WhatsApp e bairro
- Integração com Google Sheets via Google Apps Script
- Finalização via WhatsApp com mensagem pré-preenchida
- Chave Pix com botão de copiar
- Tela de sucesso após envio
- Design responsivo com fundo animado
