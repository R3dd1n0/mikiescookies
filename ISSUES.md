# Mikies Cookies — Issues Conhecidos & Melhorias Futuras

## Bugs conhecidos

### GAS
- [ ] **Triggers precisam ser recriados manualmente após cada novo deploy**: `criarTriggers()` precisa ser executada manualmente no editor GAS sempre que o script for atualizado. Não há como automatizar isso pelo Apps Script sem permissões administrativas adicionais.
- [ ] **Relatório automático diário depende do fuso no projeto GAS**: Se o fuso do projeto GAS não estiver configurado como `America/Fortaleza`, os triggers de horário (8h) disparam no fuso errado. Verificar em: *Configurações do projeto → Fuso horário*.
- [ ] **`onEditInstalavel` não dispara em edições via API**: Se o status for atualizado por integração externa (ex: Zapier, Make), o trigger de edição não dispara — imagem de agradecimento e alertas de status não são enviados.

### Frontend (index.html)
- [ ] **Cópia do código Pix pode falhar em Safari iOS**: `navigator.clipboard.writeText()` requer interação direta do usuário em alguns contextos iOS. O fallback `document.execCommand('copy')` foi mantido, mas pode não funcionar em todos os casos.
- [ ] **Campo de data mínima no agendamento usa UTC no input `min`**: O cálculo de `proximoDiaUtil` é feito em UTC-3 via JS, mas `input[type=date]` interpreta `min` como local. Pode ocorrer discrepância de 1 dia em horários limítrofes (0h–3h).

---

## Melhorias futuras

### Alta prioridade
- [ ] **Confirmação de leitura do Pix pelo cliente**: Atualmente o site não sabe se o cliente copiou o código ou escaneou o QR. Adicionar botão "Já paguei!" que envia uma notificação ao grupo Telegram.
- [ ] **Validação de WhatsApp no formulário**: Aceitar apenas números com DDD brasileiro (10–11 dígitos). Atualmente qualquer string é aceita.
- [ ] **Planilha — coluna de canal de origem**: Registrar se o pedido veio do site, do link direto de WA, ou de outro canal. Útil para análise de conversão.

### Média prioridade
- [ ] **WhatsApp Business API**: Substituir links `wa.me` por mensagens enviadas via API oficial assim que o número for fixo e verificado. Permite templates aprovados, rastreamento de entrega de mensagem e funil automatizado.
- [ ] **Avaliação pós-entrega**: Google Form já previsto (`FORM_AVALIACAO_URL`). Criar o formulário, salvar o ID no PropertiesService, e configurar o template Slides de agradecimento com o placeholder `{{form_url}}`.
- [ ] **Página de status do pedido**: Mini-site ou link direto com consulta por número de pedido + WhatsApp, sem precisar abrir o Telegram.
- [ ] **CRM básico de clientes**: Aba "Clientes" na planilha consolidando histórico por WhatsApp (total gasto, último pedido, sabores favoritos). Sem formulário extra — alimentado automaticamente pelo GAS ao salvar pedido.
- [ ] **Cardápio com fotos otimizadas**: As imagens atuais são JPGs externos. Converter para WebP + lazy loading para melhorar performance mobile (especialmente 3G).

### Baixa prioridade
- [ ] **Modo manutenção**: Flag no PropertiesService (`LOJA_FECHADA=true`) que desabilita o formulário e exibe banner customizado no site sem precisar editar o HTML.
- [ ] **Cupom de desconto**: Campo opcional no formulário. GAS valida código contra lista na planilha e aplica desconto antes de gravar total.
- [ ] **Notificação de aniversário**: Se coletar data de nascimento, trigger mensal envia WA personalizado com oferta.
- [ ] **Integração com Google Calendar**: Pedidos agendados criam evento no calendário da loja automaticamente.
- [ ] **Multi-sabor ilimitado**: Atualmente limitado a 5 sabores fixos na planilha. Refatorar para formato JSON na coluna de itens para suportar sabores sazonais sem alterar estrutura da planilha.

---

## Dívida técnica
- [ ] **Migração de colunas L–Q na planilha**: A estrutura atual do GAS (v1.0.0) usa colunas L(12)=Frete, N(14)=Valor Confirmado, O(15)=StatusPix, P(16)=StatusProd, Q(17)=Ocasião, R(18)=MensagemCartão, S(19)=Quando. Confirmar que os cabeçalhos da planilha real correspondem a esse mapeamento.
- [ ] **`bot_tests.gs` não está no repositório**: Por estar no `.gitignore`, o arquivo de testes precisa ser recriado manualmente no GAS ao trocar de máquina. Considerar manter uma cópia comentada neste repositório ou em Gist privado.
- [ ] **Sem testes automatizados**: Todo teste é manual via funções no editor GAS. A longo prazo, considerar mover lógica de negócio para funções puras testáveis.
