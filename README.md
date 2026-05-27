# Mikies Cookies

Site de pedidos online para a **Mikies Cookies** — confeitaria artesanal de Fortaleza, CE.

## Sobre o projeto

Página única (SPA) que permite ao cliente escolher sabores, preencher seus dados e finalizar o pedido diretamente pelo WhatsApp, com pagamento via Pix.

## Funcionalidades

- Cardápio interativo com 5 sabores
- Controle de quantidade por produto
- Resumo do pedido em tempo real
- Validação de formulário com mensagens inline
- Máscara automática no campo de telefone
- Chave Pix com botão de copiar (com fallback para HTTP)
- Registro automático do pedido no Google Sheets
- Redirecionamento para WhatsApp com mensagem pré-preenchida
- Design responsivo, otimizado para mobile

## Sabores disponíveis

| Sabor | Descrição |
|---|---|
| Chocolate Branco | Massa tradicional com gotas de chocolate branco |
| Chocolate ao Leite | Massa tradicional com gotas de chocolate ao leite |
| Black | Massa cacau black com gotas de chocolate ao leite e amargo |
| Red Velvet | Massa red velvet com gotas de chocolate branco |
| Berry | Massa tradicional com gotas de chocolate branco e de morango |

## Tecnologias

- HTML, CSS e JavaScript puro (sem frameworks)
- Google Fonts (Playfair Display + DM Sans)
- Google Apps Script (registro de pedidos em planilha)
- WhatsApp Business API (`wa.me`)
- Hospedagem: [Netlify](https://mikies.netlify.app)

## Estrutura de arquivos

```
mikiescookies/
├── index.html
└── images/
    ├── hero_bg.jpg
    ├── choc_branco.jpg
    ├── choc_leite.jpg
    ├── dark.jpg
    ├── red_velvet.jpg
    └── berry.jpg
```

## Deploy

O site é hospedado no Netlify com deploy automático a partir do branch `main`.

Para atualizar manualmente:
```bash
git add .
git commit -m "descrição da mudança"
git push
```

Ou arraste a pasta do projeto para a aba **Deploys** no painel do Netlify.

## Contato

Instagram: [@mikiescookies](https://www.instagram.com/mikiescookies/)  