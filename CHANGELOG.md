# Changelog

Todas as mudanças relevantes do projeto estão documentadas aqui.

---

## [1.1.0] - 2026-05-27

### Performance
- Imagens extraídas do HTML para arquivos externos — página reduziu de **1.5 MB para 22 KB**
- Adicionado `loading="lazy"` nas imagens dos produtos

### SEO
- Adicionadas meta tags `description` e Open Graph (`og:title`, `og:description`, `og:image`, `og:url`)
- Adicionado `theme-color` para personalizar a barra do navegador no mobile

### UX / Formulário
- Validação substituída de `alert()` para mensagens inline abaixo de cada campo
- Máscara de formatação automática no campo de telefone (`85 9 9922-6322`)
- Campo de telefone com `inputmode="numeric"` para abrir teclado numérico no mobile
- Campos envolvidos em `<form>` com `onsubmit` — suporte a enviar com Enter
- Adicionados atributos `autocomplete` nos campos (`name`, `tel`, `address-level3`)

### Acessibilidade
- `aria-label` adicionado nos botões de quantidade (`−` e `+`)
- `aria-live="polite"` no contador de quantidade para leitores de tela

### Código
- Criadas constantes `PIX_KEY` e `WA_NUMBER` para evitar duplicação no código
- Mensagem do WhatsApp reescrita usando `encodeURIComponent` — elimina risco de caracteres quebrados
- Adicionado fallback para `navigator.clipboard` em ambientes sem HTTPS

---

## [1.0.0] - 2026-05-24

### Lançamento inicial
- Página única com cardápio de 5 sabores
- Controle de quantidade por produto
- Resumo do pedido com total em tempo real
- Formulário com nome, WhatsApp e bairro
- Integração com Google Sheets via Google Apps Script
- Finalização de pedido via WhatsApp com mensagem pré-preenchida
- Chave Pix exibida com botão de copiar
- Tela de sucesso após envio do pedido
- Design responsivo com fundo animado e faixa de tagline
