# Mikies Cookies

Site de pedidos online para a **Mikies Cookies** — confeitaria artesanal de Fortaleza, CE.

## Sobre o projeto

Página única que permite ao cliente escolher sabores, preencher seus dados e finalizar o pedido diretamente pelo WhatsApp, com pagamento via Pix. O backend é um Google Apps Script que registra pedidos em planilha e notifica a equipe via Telegram.

## Funcionalidades

- Cardápio interativo com 5 sabores e controle de quantidade
- Slots de disponibilidade dinâmicos (O quanto antes / Hoje tarde / Hoje noite / Agendar)
- QR Code Pix dinâmico com payload EMV gerado no frontend
- Formulário com validação inline, máscara de telefone e agendamento (até 3 semanas)
- Proteção contra pedido duplicado (mesmo WA + mesmos itens em 5 min)
- Registro automático no Google Sheets via Google Apps Script
- Finalização via WhatsApp com mensagem pré-preenchida
- Notificações Telegram em tópicos separados (Pedidos / Status / Alertas / Relatórios)
- Relatórios automáticos: diário (8h), semanal (segunda 8h) e mensal (dia 1 às 8h)
- Aviso de fora do horário com previsão do próximo dia útil
- Design responsivo, otimizado para mobile

## Sabores disponíveis

| Sabor | Descrição |
|---|---|
| Chocolate Branco | Massa tradicional com gotas de chocolate branco |
| Chocolate ao Leite | Massa tradicional com gotas de chocolate ao leite |
| Dark | Massa cacau black com gotas de chocolate ao leite e amargo |
| Red Velvet | Massa red velvet com gotas de chocolate branco |
| Berry | Massa tradicional com gotas de chocolate branco e de morango |

## Tecnologias

- HTML, CSS e JavaScript puro (sem frameworks, sem build)
- Google Fonts (Playfair Display + DM Sans)
- qrcode-generator (CDN) para QR Code Pix
- Google Apps Script (Web App + Trigger-based polling)
- Google Sheets (banco de dados de pedidos)
- Google Slides (templates de imagem para Telegram)
- Telegram Bot API
- Hospedagem: [GitHub Pages](https://r3dd1n0.github.io/mikiescookies/)

## Estrutura de arquivos

```
mikiescookies/
├── index.html              # Site completo (single-file)
├── bot_mikies_cookies.gs   # Google Apps Script (gitignored)
├── bot_tests.gs            # Funções de teste do GAS (gitignored)
├── ISSUES.md               # Bugs conhecidos e melhorias futuras
└── images/
    ├── hero_bg.jpg
    ├── choc_branco.jpg
    ├── choc_leite.jpg
    ├── dark.jpg
    ├── red_velvet.jpg
    └── berry.jpg
```

## Deploy

O site é hospedado no GitHub Pages com deploy automático a partir do branch `main`.

Para atualizar:
```bash
git add index.html
git commit -m "descrição da mudança"
git push
```

O bot GAS é gerenciado diretamente em [script.google.com](https://script.google.com) e **não está no repositório** (ver `.gitignore`). Após atualizar o script, execute `criarTriggers()` uma vez para recriar os triggers.

## Configurações necessárias (GAS)

Salvar no PropertiesService (`Projeto → Configurações → Propriedades do script`):

| Chave | Descrição |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token do bot |
| `TELEGRAM_CHAT_ID` | ID do supergrupo |
| `TELEGRAM_TOPIC_PEDIDOS` | ID do tópico Pedidos |
| `TELEGRAM_TOPIC_STATUS` | ID do tópico Status |
| `TELEGRAM_TOPIC_ALERTAS` | ID do tópico Alertas |
| `TELEGRAM_TOPIC_RELATORIOS` | ID do tópico Relatórios |
| `SLIDE_TEMPLATE_ID` | ID do template Slides de novo pedido (opcional) |
| `SLIDE_THANK_YOU_ID` | ID do template Slides de agradecimento (opcional) |
| `FORM_AVALIACAO_URL` | URL do formulário de avaliação (opcional) |

## Contato

Instagram: [@mikiescookies](https://www.instagram.com/mikiescookies/)
