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
| Col | Conteúdo | Quem preenche |
|-----|----------|---------------|
| A (1) | # Pedido | GAS (auto) |
| B (2) | Data | GAS (auto) |
| C (3) | Nome | GAS |
| D (4) | WhatsApp | GAS |
| E–I (5–9) | Qtd por sabor (Choc. Branco, Choc. Leite, Dark, Red Velvet, Berry) | GAS |
| J (10) | Qtd total | Fórmula |
| K (11) | Total Produtos | Fórmula |
| L (12) | Frete | GAS |
| M (13) | Total c/ Frete | Fórmula |
| N (14) | Valor Confirmado | Manual |
| O (15) | Status Pix | GAS / Manual |
| P (16) | Status Pedido | GAS / Manual |
| Q (17) | Ocasião | GAS |
| R (18) | Mensagem Cartão | GAS |
| S (19) | Quando (previsão) | GAS |

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
| H | Sabor Favorito | GAS |
| I | Sabores | GAS (detalhado) |
| J | Ocasiões Usadas | GAS |
| K | Aniversário | **Manual** |
| L | Instagram | **Manual** |
| M | Notas | **Manual** |

## Produtos
Controlados pelo array `produtos[]` em `index.html`.
- `active: true` → visível no cardápio
- `active: false` → oculto (produtos sazonais/encomenda)
- `badge: 'Texto'` → exibe selo no card (ex: `'Encomenda'`)

Para ativar um novo produto: alterar `active` + adicionar coluna na planilha + adicionar campo no payload do GAS.

## Frete
| Modalidade | Valor |
|------------|-------|
| Fortaleza | R$ 10,00 |
| Reg. Metropolitana | R$ 20,00 |
| Retirada | Grátis |

## Chave Pix e contatos
- Pix: `mikiescookies@gmail.com`
- WhatsApp da loja: `5585920080270`
- Site: `https://r3dd1n0.github.io/mikiescookies/`

## Comandos do bot Telegram
`/pedido`, `/status`, `/relatorio`, `/pendentes`, `/consultarpedido`

## Convenções de código
- Sem frameworks. HTML/CSS/JS vanilla no frontend.
- GAS usa `getConfig()` para ler TOKEN e CHAT_ID do PropertiesService.
- Não adicionar comentários óbvios — só quando o motivo não é evidente.
