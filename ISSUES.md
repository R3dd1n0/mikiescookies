# Mikies Cookies — Issues Conhecidos & Melhorias Futuras

## Bugs conhecidos

### GAS
- [ ] **Triggers precisam ser recriados manualmente após cada novo deploy**: `criarTriggers()` precisa ser executada manualmente no editor GAS sempre que o script for atualizado. Não há como automatizar isso pelo Apps Script sem permissões administrativas adicionais.
- [ ] **Relatório automático depende do fuso do projeto GAS**: Se o fuso não estiver como `America/Fortaleza`, os triggers de 8h disparam no horário errado. Verificar em: *Configurações do projeto → Fuso horário*. O mesmo vale para o fuso da planilha (Arquivo → Configurações).
- [ ] **`onEditInstalavel` não dispara em edições via API**: Se o status for atualizado por integração externa (ex: Zapier, Make), o trigger de edição não dispara — imagem de agradecimento e alertas de status não são enviados.

### Frontend (index.html)
- [ ] **Cópia do código Pix pode falhar em Safari iOS**: `navigator.clipboard.writeText()` requer interação direta do usuário em alguns contextos iOS. O fallback `document.execCommand('copy')` foi mantido, mas pode não funcionar em todos os casos.
- [ ] **Campo de data mínima no agendamento usa UTC no input `min`**: O cálculo é feito em UTC-3 via JS, mas `input[type=date]` interpreta `min` como fuso local do dispositivo. Pode ocorrer discrepância de 1 dia em horários limítrofes (0h–3h).

---

## Melhorias futuras

### Alta prioridade
- [ ] **Confirmação de pagamento pelo cliente**: Adicionar botão "Já paguei!" na tela de sucesso que envia notificação ao Telegram — fecha o gap entre o cliente pagar e a loja ver o comprovante.
- [ ] **Validação de WhatsApp no formulário**: Aceitar apenas números com DDD brasileiro (10–11 dígitos). Atualmente qualquer string de 10+ caracteres é aceita.
- [ ] **Planilha — coluna de canal de origem**: Registrar se o pedido veio do site, de link direto ou de outro canal. Útil para análise de conversão.

### Média prioridade
- [ ] **WhatsApp Business API**: Substituir links `wa.me` por mensagens via API oficial assim que o número for fixo e verificado. Permite templates aprovados, rastreamento e funil automatizado.
- [ ] **Avaliação pós-entrega**: Google Form já previsto (`FORM_AVALIACAO_URL`). Criar formulário, salvar ID no PropertiesService e configurar template Slides de agradecimento com `{{form_url}}`.
- [ ] **Página de status do pedido**: Consulta pública por número de pedido + WhatsApp, sem precisar abrir o Telegram.
- [x] **CRM básico de clientes**: Aba "Clientes" consolidada diariamente via `consolidarClientes()` — agnóstico de fonte (site, WA direto, manual).
- [ ] **Imagens otimizadas**: Converter JPGs para WebP para melhorar performance mobile em 3G.

### Baixa prioridade
- [ ] **Modo manutenção**: Flag `LOJA_FECHADA=true` no PropertiesService desabilita o formulário e exibe banner customizado sem editar o HTML.
- [ ] **Cupom de desconto**: Campo opcional no formulário, validado pelo GAS contra lista na planilha.
- [ ] **Integração com Google Calendar**: Pedidos agendados criam evento no calendário da loja.
- [ ] **Multi-sabor dinâmico**: Refatorar itens para JSON na planilha, suportando sabores sazonais sem alterar estrutura de colunas.

---

## Dívida técnica
- [ ] **Migração de colunas na planilha**: GAS v1.0.x usa L(12)=Frete, N(14)=Valor Confirmado, O(15)=StatusPix, P(16)=StatusProd, Q(17)=Ocasião, R(18)=MensagemCartão, S(19)=Quando. Confirmar que os cabeçalhos da planilha correspondem.
- [ ] **`bot_tests.gs` não está no repositório**: Por estar no `.gitignore`, precisa ser recriado manualmente no GAS ao trocar de máquina.
- [ ] **Sem testes automatizados**: Todo teste é manual via funções no editor GAS.
