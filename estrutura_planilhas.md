# Mikies Cookies — Estrutura das Planilhas

## Observações gerais

- Arquivo Google Sheets com duas abas relevantes: **Pedidos** e **Clientes**
- A aba Pedidos é populada pelo Google Apps Script (GAS) via site + entradas manuais
- A aba Clientes é gerada/atualizada automaticamente pelo GAS diariamente às 6h
- O GAS **nunca deve ser bloqueado** por proteções de célula — apenas os campos manuais precisam de validação visual, não de lock

---

## Aba: Pedidos

**Estrutura de linhas:**
- Linhas 1–3: área de cabeçalho (título, labels de coluna, totalizadores opcionais)
- Linha 4 em diante: dados dos pedidos (Pedido #1 = linha 4, #2 = linha 5, etc.)

**23 colunas — A até W:**

> Os índices de coluna são fixos e estão centralizados na constante `COL` do GAS.
> Todos os valores monetários são gravados pelo GAS (sem fórmulas na planilha).

| Col | Letra | Nome sugerido | Tipo de dado | Quem preenche | Observações |
|-----|-------|---------------|--------------|---------------|-------------|
| 1 | A | # Pedido | Inteiro | GAS (auto) | Sequencial. Pedido 1 = linha 4 |
| 2 | B | Data / Hora | Data-hora | GAS (auto) | Formato: `dd/MM/yyyy HH:mm` |
| 3 | C | Nome do Cliente | Texto | GAS | Nome completo como digitado no site |
| 4 | D | WhatsApp | Texto | GAS | 11 dígitos sem formatação. Ex: `85999226322` |
| 5 | E | Itens | Texto | GAS | Legível, 1 embalagem por linha. Ex: `1× Mikies Mimo [Black, Ninho, Matcha]` |
| 6 | F | Mikies Mimo | Inteiro ≥ 0 | GAS | Qtd de caixas dessa embalagem no pedido |
| 7 | G | Mikies Dip | Inteiro ≥ 0 | GAS | Idem |
| 8 | H | Mikies Jewel | Inteiro ≥ 0 | GAS | Idem |
| 9 | I | Mikies to Share | Inteiro ≥ 0 | GAS | Idem |
| 10 | J | Mikies Pocket | Inteiro ≥ 0 | GAS | Qtd de pacotes |
| 11 | K | Total Cookies | Inteiro | GAS | Soma de cookies de todas as embalagens |
| 12 | L | Peso (g) | Inteiro | GAS | Peso total estimado |
| 13 | M | Subtotal | Moeda (R$) | GAS | Produtos, já com acréscimo de matcha |
| 14 | N | Frete | Moeda (R$) | GAS | Valores: 0,00 / 10,00 / 20,00 |
| 15 | O | Total | Moeda (R$) | GAS | Subtotal + Frete |
| 16 | P | Valor Confirmado | Moeda (R$) | **Manual** | Operador preenche/corrige após conferir |
| 17 | Q | Status Pix | Texto (enum) | GAS + Manual | Valores fixos — ver abaixo. **Observada pelo `onEdit`** |
| 18 | R | Status Pedido | Texto (enum) | GAS + Manual | Valores fixos — ver abaixo. **Observada pelo `onEdit`** |
| 19 | S | Ocasião | Texto | GAS | Texto livre ou opção do formulário |
| 20 | T | Mensagem Cartão | Texto | GAS | Até ~80 caracteres. Pode ser vazio |
| 21 | U | Quando | Texto | GAS | Previsão de entrega — ver valores abaixo |
| 22 | V | Token Avaliação | Texto | GAS | UUID de uso único; vira `USADO` após a avaliação |
| 23 | W | Pedido (JSON) | Texto/JSON | GAS | `{ itens, saboresFreq, counts, cookies, peso }` — fonte de verdade dos relatórios/CRM |

**Valores possíveis — Status Pix (col Q):**
- `Aguardando`
- `Pago`
- `Cancelado`

**Valores possíveis — Status Pedido (col R):**
- `Pix ainda não confirmado`
- `Em produção`
- `Pronto`
- `Entregue`
- `Cancelado`

**Valores possíveis — Quando (col U):**
- `O quanto antes`
- `Hoje · tarde (13h–17h)`
- `Hoje · noite (18h–21h)`
- `Agendado · DD/MM/AAAA` (data escolhida pelo cliente)
- `Não informado` (fallback)

**Regras importantes para o design:**
- Não há fórmulas: **M, N e O** são gravadas pelo GAS. Não é necessário protegê-las, mas evite editá-las à mão (o GAS sobrescreve em cada pedido novo, não em pedidos antigos).
- A cozinha **não recebe unidades por sabor** — ela distribui as unidades das embalagens com vários sabores. A referência de produção é a coluna **E (Itens)**.
- Coluna **W (JSON)** não deve ser editada manualmente — alimenta relatórios e CRM.
- Colunas **Q e R** (status) mudam ao longo do tempo — ideal usar **formatação condicional** por cor:
  - `Aguardando` / `Pix ainda não confirmado` → amarelo
  - `Pago` / `Em produção` / `Pronto` → azul ou laranja
  - `Entregue` → verde
  - `Cancelado` → vermelho / tachado
- Coluna **U** com valor `O quanto antes` pode receber destaque visual (ex: borda ou fundo laranja) pois indica urgência máxima

---

## Aba: Clientes

**Estrutura de linhas:**
- Linha 1: cabeçalho (criado automaticamente pelo GAS, com negrito e linha congelada)
- Linha 2 em diante: um cliente por linha

**13 colunas — A até M:**

| Col | Letra | Nome | Tipo de dado | Quem preenche | Observações |
|-----|-------|------|--------------|---------------|-------------|
| 1 | A | Telefone | Texto | GAS | 11 dígitos normalizados. Ex: `85999226322`. Chave primária |
| 2 | B | Nome | Texto | GAS | Nome do pedido mais recente |
| 3 | C | Total Pedidos | Inteiro | GAS | Contagem de pedidos não cancelados |
| 4 | D | Total Gasto | Moeda (R$) | GAS | Soma do Total (col O da aba Pedidos) |
| 5 | E | Ticket Médio | Moeda (R$) | GAS | Total Gasto ÷ Total Pedidos |
| 6 | F | Primeiro Pedido | Data | GAS | Formato: `dd/MM/yyyy` |
| 7 | G | Último Pedido | Data | GAS | Formato: `dd/MM/yyyy` |
| 8 | H | Sabor Favorito | Texto | GAS | Sabor mais escolhido (por frequência). Ex: `Black` |
| 9 | I | Sabores | Texto | GAS | Detalhado. Ex: `Black×5, Matcha×2, Morango×1` |
| 10 | J | Ocasiões Usadas | Texto | GAS | Ocasiões distintas já utilizadas, separadas por vírgula |
| 11 | K | Aniversário | Data ou Texto | **Manual** | Formato livre. Ex: `15/03` ou `15/03/1990` |
| 12 | L | Instagram | Texto | **Manual** | Ex: `@nomedobuyer` |
| 13 | M | Notas | Texto | **Manual** | Campo livre para observações internas |

**Regras importantes para o design:**
- Colunas **A a J** são **sobrescritas a cada consolidação diária** — não devem ter formatação que dependa de conteúdo inserido manualmente
- Colunas **K, L e M são manuais** — o GAS nunca toca nelas. Recomenda-se fundo diferenciado (ex: creme/bege) para sinalizar que são editáveis pela equipe
- Coluna **C** (Total Pedidos): clientes com 3+ pedidos podem receber ícone ou cor especial (cliente fiel / recorrente)
- Coluna **G** (Último Pedido): clientes sem pedido há 60+ dias podem receber destaque visual (sinalizar risco de churn)
- A aba é criada automaticamente pelo GAS se não existir. O GAS aplica negrito na linha 1 e congela a primeira linha
- O GAS aplica formatação `R$ #.##0,00` nas colunas D e E e `dd/MM/yyyy` nas colunas F e G a cada consolidação — formatações customizadas nessas células serão sobrescritas

---

## Notas para quem for formatar

1. **Não inserir nem remover colunas** nas abas sem avisar o desenvolvedor — o GAS usa índices fixos de coluna (A=1, B=2 etc.) e qualquer deslocamento quebra a integração
2. **Validações de dados** (listas suspensas) são bem-vindas nas colunas de status Q e R (Pedidos) e na coluna S (Ocasião) — evitam erros de digitação manual
3. **Linha de totalizadores** pode ser adicionada acima do cabeçalho em Pedidos (linha 1 ou 2), desde que os dados continuem começando na **linha 4**
4. **Filtros e ordenação** na linha de cabeçalho de Clientes são úteis para segmentar por total gasto, último pedido, etc.
5. O GAS reaplica formatação de moeda (D, E) e data (F, G) na aba Clientes a cada consolidação — o design aplicado manualmente nessas células pode ser sobrescrito
