# Instruções de Migração — Planilha Mikies Cookies

## Visão Geral das Mudanças

Duas categorias de alterações:

1. **Novas colunas de Frete** — refletem o GAS v5.0.0 e o novo site
2. **Correção de fórmulas do Dashboard** — estão apontando para colunas erradas
   (provavelmente quebraram quando "Valor Confirmado" foi inserido depois do Dashboard ter sido criado)

---

## PARTE 1 — Aba "Pedidos": Inserir 2 novas colunas

### Passo 1 — Inserir as colunas

1. Clique com o botão direito no cabeçalho da coluna **L** ("Valor Confirmado")
2. Selecione **"Inserir 2 colunas à esquerda"**

A planilha vai deslocar tudo automaticamente. O resultado deve ser:

| Coluna | Cabeçalho | Preenchimento |
|--------|-----------|---------------|
| **L** (12) | Frete | GAS automático / R$ 0 para pedidos antigos |
| **M** (13) | Total c/ Frete | GAS automático / fórmula para pedidos antigos |
| N (14) | Valor Confirmado | manual (deslocada de L) |
| O (15) | Status Pix | GAS / manual (deslocada de M) |
| P (16) | Status Pedido | GAS / manual (deslocada de N) |
| Q (17) | Link WhatsApp | fórmula (deslocada de O) |

### Passo 2 — Adicionar cabeçalhos nas novas colunas

Na linha 3:
- Célula **L3**: escreva `Frete`
- Célula **M3**: escreva `Total c/ Frete`

### Passo 3 — Formatar como moeda

Selecione o intervalo **L4:M1000**:
1. Menu Formatar → Número → Moeda (R$)

### Passo 4 — Preencher linhas existentes

Para os pedidos já existentes (que não tinham frete), nas linhas 4 em diante que tiverem cliente preenchido:

- Coluna **L** (Frete): deixe em `0` (zero) — esses pedidos foram feitos antes da feature
- Coluna **M** (Total c/ Frete): cole a fórmula abaixo em **M4** e arraste até o fim dos dados:
  ```
  =IF(C4<>"",K4+L4,"")
  ```

---

## PARTE 2 — Aba "Pedidos": Atualizar fórmula do Link WhatsApp

A fórmula do Link WhatsApp (coluna Q, deslocada automaticamente de O) ainda referencia
`K4` para o total — que é só o total de cookies, sem frete. Atualizar para usar `M4` (Total c/ Frete).

Na célula **Q4**, substitua a fórmula atual pela versão abaixo e arraste até o fim dos dados:

```
=IF(C4<>"","https://wa.me/55"&D4&"?text=Ola%20"&C4&"%2C%20aqui%20e%20a%20Mikies%20Cookies!%20Confirmando%20seu%20pedido%3A%20"&E4&"x%20Choc%20Branco%2C%20"&F4&"x%20Choc%20Leite%2C%20"&G4&"x%20Dark%2C%20"&H4&"x%20Red%20Velvet%2C%20"&I4&"x%20Morango.%20Total%3A%20R%24%20"&TEXT(M4,"0.00")&"%20Pix%3A%2060458177377","")
```

> A única mudança é `TEXT(M4,"0.00")` no lugar de `TEXT(K4,"0.00")`.

---

## PARTE 3 — Aba "Dashboard": Corrigir fórmulas quebradas

> **Atenção:** as fórmulas abaixo estão erradas MESMO ANTES da migração do frete.
> Os contadores de status (Aguardando Pix, Em produção, etc.) provavelmente estão
> mostrando zero. Esta é a correção definitiva, válida após a migração.

### Linha 7 — Faturamento total

Célula **B7** — substituir por:
```
=SUMIF(Pedidos!C4:C103,"<>"&"",Pedidos!M4:M103)
```
> Antes usava col L (Valor Confirmado). Agora usa col M (Total c/ Frete), que é preenchido automaticamente pelo GAS e reflete o valor real do pedido incluindo entrega.

### Linha 10 — Aguardando Pix

Célula **B10** — substituir por:
```
=COUNTIF(Pedidos!O4:O103,"Aguardando")
```

### Linha 11 — Pix confirmado

Célula **B11** — substituir por:
```
=COUNTIF(Pedidos!O4:O103,"Pago")
```

### Linha 12 — Pedidos entregues

Célula **B12** — substituir por:
```
=COUNTIF(Pedidos!P4:P103,"Entregue")
```

### Linha 13 — Em produção

Célula **B13** — substituir por:
```
=COUNTIF(Pedidos!P4:P103,"Em produção")
```

### Linha 14 — Pronto p/ entrega

Célula **B14** — substituir por:
```
=COUNTIF(Pedidos!P4:P103,"Pronto")
```

### Linha 15 — Cancelado (Pix)

Célula **B15** — substituir por:
```
=COUNTIF(Pedidos!O4:O103,"Cancelado")
```

### Linha 16 — Cancelado (Pedido)

Célula **B16** — substituir por:
```
=COUNTIF(Pedidos!P4:P103,"Cancelado")
```

---

## PARTE 4 — Aba "Pedidos": Validação de dados (opcional mas recomendado)

As colunas O (Status Pix) e P (Status Pedido) devem ter listas suspensas para evitar erros de digitação. Se a validação das antigas colunas M e N não migrou automaticamente:

**Coluna O (Status Pix) — O4:O1000:**
1. Selecione O4:O1000
2. Menu Dados → Validação de dados → Lista de itens
3. Itens: `Aguardando,Pago,Cancelado`

**Coluna P (Status Pedido) — P4:P1000:**
1. Selecione P4:P1000
2. Menu Dados → Validação de dados → Lista de itens
3. Itens: `Pix ainda não confirmado,Em produção,Pronto,Entregue,Cancelado`

---

## PARTE 5 — Opcional: ampliar intervalo do Dashboard

As fórmulas do Dashboard cobrem só até a linha 103 (100 pedidos). Se quiser ampliar:

Substituir `C4:C103`, `L4:L103`, etc. por `C4:C1003` em todas as fórmulas do Dashboard
(linhas B6 a B16 e B21 a B25).

---

## Resumo rápido do que fazer

| # | Onde | O que fazer |
|---|------|-------------|
| 1 | Pedidos col L–M | Inserir 2 colunas após K, adicionar cabeçalhos "Frete" e "Total c/ Frete" |
| 2 | Pedidos L4:M? | Formatar como moeda; preencher linhas existentes com 0 e fórmula `=K+L` |
| 3 | Pedidos col Q | Atualizar fórmula do Link WhatsApp para usar `TEXT(M4,...)` |
| 4 | Dashboard B7 | Corrigir Faturamento para usar col M (Total c/ Frete) |
| 5 | Dashboard B10–B11 | Corrigir contadores de Status Pix para coluna O |
| 6 | Dashboard B12–B14 | Corrigir contadores de Status Pedido para coluna P |
| 7 | Dashboard B15–B16 | Corrigir Cancelados para colunas O e P |
| 8 | Pedidos O e P | Adicionar validação de dados (listas suspensas) |
