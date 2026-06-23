# Mikies Cookies

Site de pedidos online para a **Mikies Cookies** — confeitaria artesanal de Fortaleza, CE.

## Sobre o projeto

Página única que permite ao cliente escolher uma embalagem, montar os sabores, preencher seus dados e finalizar o pedido diretamente pelo WhatsApp, com pagamento via Pix. O backend é um Google Apps Script que registra pedidos em planilha e notifica a equipe via Telegram.

## Funcionalidades

- Cardápio de embalagens com configurador de sabores (até N por caixa ou quantidade por pacote)
- Acréscimo automático de Matcha conforme a embalagem
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

## Embalagens

| Embalagem | Preço | Cookies | Sabores |
|---|---|---|---|
| Mikies Mimo | R$ 59,90 | 40 | até 3 |
| Mikies Dip | R$ 64,90 | 30 | até 3 · acompanha nutela + caramelo salgado |
| Mikies Jewel | R$ 39,90 | 24 | 1 |
| Mikies to Share | R$ 25,90 | 20 | 1 |
| Mikies Pocket | R$ 12,90 /pacote | 6 /pacote | 1 · mínimo 10 pacotes |

Acréscimo de **Matcha** por embalagem (R$ 2 a R$ 5). Detalhes em `CLAUDE.md`.

## Sabores

Chocolate ao Leite · Ninho · Red Velvet · Black · Morango · Matcha

## Tecnologias

- HTML, CSS e JavaScript puro (sem frameworks, sem build)
- Google Fonts (Playfair Display + DM Sans)
- qrcode-generator (CDN) para QR Code Pix
- Google Apps Script (Web App + Trigger-based polling)
- Google Sheets (banco de dados de pedidos)
- Google Slides (templates de imagem para Telegram)
- Telegram Bot API
- Hospedagem: [GitHub Pages](https://mikies.com.br/) (domínio custom via `CNAME`)

## Estrutura de arquivos

```
mikiescookies/
├── index.html              # Site completo (single-file)
├── bot_mikies_cookies.gs   # Google Apps Script (versionado)
├── bot_tests.gs            # Funções de teste do GAS (gitignored)
├── ISSUES.md               # Bugs conhecidos e melhorias futuras
└── images/
    ├── ill-logo.png          # Ilustração da marca (servindo cookies)
    ├── ill-duo.png            # Ilustração (dupla de cookies)
    ├── ill-run.png            # Ilustração (figura correndo)
    │                          #   (+ variantes -cream.png p/ fundo bordô)
    ├── mikies-favicon.svg     # Monograma M
    ├── apple-touch-icon.png   # Ícone iOS
    ├── og-mikies.jpg          # Imagem de compartilhamento (OG)
    ├── choc_branco.webp       # Fotos dos sabores (placeholder até as reais)
    ├── choc_leite.webp
    ├── dark.webp
    ├── red_velvet.webp
    └── berry.webp
```

## Deploy

O site é hospedado no GitHub Pages com deploy automático a partir do branch `main`.

Para atualizar:
```bash
git add index.html
git commit -m "descrição da mudança"
git push
```

O bot GAS é **versionado neste repositório** (`bot_mikies_cookies.gs`), mas roda em [script.google.com](https://script.google.com). Fluxo: editar aqui → copiar o conteúdo para o editor → **Implantar → Gerenciar implantações → editar → Nova versão** (mantém a mesma URL) → executar `criarTriggers()` uma vez.

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
