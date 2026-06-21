# Mikies Cookies — Instruções para o Claude

## Git
- Desenvolva e faça commit **direto no `main`**. Não crie branches separados.
- Sempre faça `git push origin main` ao final de cada sessão ou quando solicitado.

## Visão geral do projeto
Landing page + bot Telegram para gestão de pedidos de uma confeitaria artesanal em Fortaleza, CE.

- **`index.html`** — site completo (single-file, sem build). Imagens em `images/`.
- **`bot_mikies_cookies.gs`** — Google Apps Script. Rodando como Web App no Google Sheets. Gerencia pedidos, notificações Telegram e relatórios via bot.
- **`images/`** — fotos dos cookies e hero (JPG externos, não base64).

## Arquitetura
```
Usuário → index.html → GAS Web App → Google Sheets
                     ↓
                  Telegram Bot (notificações e comandos)
```

## Planilha (Google Sheets — aba "Pedidos")
Todos os valores monetários são escritos pelo GAS (sem fórmulas na planilha).
Os índices de coluna estão centralizados na constante `COL` do GAS — ao mexer
no layout, atualize `COL` e este quadro juntos.

| Col | Conteúdo | Quem preenche |
|-----|----------|---------------|
| A (1) | # Pedido | GAS (auto) |
| B (2) | Data | GAS (auto) |
| C (3) | Nome | GAS |
| D (4) | WhatsApp | GAS |
| E (5) | Itens (texto legível, 1 embalagem por linha) | GAS |
| F–J (6–10) | Qtd por embalagem (Mimo, Dip, Jewel, to Share, Pocket) | GAS |
| K (11) | Total Cookies | GAS |
| L (12) | Peso (g) | GAS |
| M (13) | Subtotal | GAS |
| N (14) | Frete | GAS |
| O (15) | Total | GAS |
| P (16) | Valor Confirmado | **Manual** |
| Q (17) | Status Pix | GAS / Manual |
| R (18) | Status Pedido | GAS / Manual |
| S (19) | Ocasião | GAS |
| T (20) | Mensagem Cartão | GAS |
| U (21) | Quando (previsão) | GAS |
| V (22) | Token Avaliação | GAS |
| W (23) | Pedido (JSON: itens, saboresFreq, counts) | GAS |

O `onEdit` observa as colunas **Q (Status Pix)** e **R (Status Pedido)**.
A coluna **W (JSON)** é a fonte de verdade para relatórios e CRM — a planilha
não guarda unidades por sabor (a cozinha distribui), então as análises de sabor
são por **frequência de escolha**, lidas do JSON.

## Planilha (Google Sheets — aba "Clientes")
Criada e mantida automaticamente por `consolidarClientes()` (roda às 6h diariamente).
Identificador: telefone normalizado (sem +55, sem formatação).

| Col | Conteúdo | Quem preenche |
|-----|----------|---------------|
| A | Telefone | GAS (chave) |
| B | Nome | GAS (mais recente) |
| C | Pedidos | GAS (contagem) |
| D | Total Gasto | GAS (R$) |
| E | Ticket Médio | GAS (R$) |
| F | Primeiro Pedido | GAS (data) |
| G | Último Pedido | GAS (data) |
| H | Sabor Favorito | GAS (por frequência de escolha) |
| I | Sabores | GAS (detalhado: `Sabor×freq`) |
| J | Ocasiões Usadas | GAS |
| K | Aniversário | **Manual** |
| L | Instagram | **Manual** |
| M | Notas | **Manual** |

## Embalagens e sabores
Definidos no `index.html` (arrays `embalagens[]` e `SABORES`) e espelhados no GAS
(`EMBALAGENS` e `SABORES_LISTA`). Mantenha os dois lados em sincronia.

**Sabores (6):** Chocolate ao Leite · Ninho · Red Velvet · Black · Morango · Matcha.
O **Matcha** tem acréscimo (`matchaExtra`) por embalagem.

**Embalagens:**
| id | Nome | Preço | + Matcha | Cookies | Peso | Sabores |
|----|------|-------|----------|---------|------|---------|
| `mimo` | Mikies Mimo | R$ 59,90 | +R$ 5,00 /caixa | 40 | 300g | até 3 |
| `dip` | Mikies Dip | R$ 64,90 | +R$ 4,00 /caixa | 30 | 225g | até 3 · molhos |
| `jewel` | Mikies Jewel | R$ 39,90 | +R$ 5,00 /caixa | 24 | 180g | 1 |
| `toshare` | Mikies to Share | R$ 25,90 | +R$ 3,00 /caixa | 20 | 150g | 1 |
| `pocket` | Mikies Pocket | R$ 12,90 | +R$ 2,00 /pacote | 6/pacote | 40g | 1 · mín. 10 pacotes |

- `modo: 'sabores'` → cliente marca **quais** sabores (cozinha distribui as unidades);
  matcha cobrado **uma vez por caixa** se selecionado.
- `modo: 'unidades'` (Pocket) → cliente escolhe a **quantidade de pacotes por sabor**
  (cada pacote = 1 sabor), mínimo `minPacotes`; matcha cobrado **por pacote**.
- `molhos: [...]` → acompanhamentos fixos exibidos no card e no configurador (sem custo).
- `active: false` → oculta a embalagem do cardápio.

Para adicionar uma embalagem: incluir no `embalagens[]` (front) e no `EMBALAGENS` +
`COL` (GAS), adicionando a coluna correspondente na aba Pedidos.

## Frete
| Modalidade | Valor |
|------------|-------|
| Fortaleza | R$ 10,00 |
| Reg. Metropolitana | R$ 20,00 |
| Retirada | Grátis |

## Chave Pix e contatos
- Pix: `mikiescookies@gmail.com`
- WhatsApp da loja: `5585920080270`
- Site: `https://mikies.com.br/` (GitHub Pages com domínio custom; CNAME no repo)

## Comandos do bot Telegram
`/pedido`, `/status`, `/relatorio`, `/pendentes`, `/consultarpedido`

## Convenções de código
- Sem frameworks. HTML/CSS/JS vanilla no frontend.
- GAS usa `getConfig()` para ler TOKEN e CHAT_ID do PropertiesService.
- Não adicionar comentários óbvios — só quando o motivo não é evidente.
