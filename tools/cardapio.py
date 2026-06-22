#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cardápio Mikies Cookies — PDF editorial (capa + página de menu)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = A4  # 595.27 x 841.89

GREEN   = HexColor('#97A572')   # verde-sálvia do logo
GREEN_D = HexColor('#5F6B41')   # verde escuro p/ preço (contraste no creme)
INK     = HexColor('#211F18')   # quase-preto
MUTED   = HexColor('#5E5C50')   # texto de apoio
CREAM   = HexColor('#F7F2E7')   # fundo das páginas de menu
CREAM_2 = HexColor('#FBF8F0')

SERIF   = 'Times-Roman'; SERIF_I='Times-Italic'; SERIF_B='Times-Bold'; SERIF_BI='Times-BoldItalic'
SANS    = 'Helvetica';   SANS_B ='Helvetica-Bold'

LOGO = "images/marca-mikies.jpg"
OUT  = "cardapio-mikies.pdf"

EMBALAGENS = [
    ("Mikies Mimo",     "R$ 59,90",          "40 cookies · 300 g · até 3 sabores"),
    ("Mikies Dip",      "R$ 64,90",          "30 cookies · 225 g · até 3 sabores\nacompanha nutela + caramelo salgado"),
    ("Mikies Jewel",    "R$ 39,90",          "24 cookies · 180 g · 1 sabor"),
    ("Mikies to Share", "R$ 25,90",          "20 cookies · 150 g · 1 sabor"),
    ("Mikies Pocket",   "R$ 12,90 / pacote", "6 cookies por pacote · 40 g · 1 sabor · mínimo 10 pacotes"),
]

SABORES = [
    ("Chocolate ao Leite", "Massa tradicional com gotas de chocolate ao leite.", False),
    ("Ninho",              "Massa cremosa de leite Ninho, docinha na medida.", False),
    ("Red Velvet",         "Aveludada, com gotas de chocolate branco.", False),
    ("Black",              "Cacau intenso com chocolate ao leite e meio amargo.", False),
    ("Morango",            "Chocolate branco com pedacinhos de morango.", False),
    ("Matcha",             "Matcha com chocolate branco; levemente amarga.", True),
]

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Cardápio — Mikies Cookies")


def wrap(text, font, size, maxw):
    out = []
    for para in text.split("\n"):
        words, line = para.split(" "), ""
        for w in words:
            t = (line + " " + w).strip()
            if c.stringWidth(t, font, size) <= maxw:
                line = t
            else:
                if line: out.append(line)
                line = w
        out.append(line)
    return out


def centered(txt, font, size, y, color, tracking=0):
    c.setFont(font, size); c.setFillColor(color)
    if tracking:
        total = sum(c.stringWidth(ch, font, size) + tracking for ch in txt) - tracking
        x = (W - total) / 2
        for ch in txt:
            c.drawString(x, y, ch); x += c.stringWidth(ch, font, size) + tracking
    else:
        c.drawCentredString(W/2, y, txt)


# ───────────────────────── PÁGINA 1 · CAPA ─────────────────────────
c.setFillColor(GREEN); c.rect(0, 0, W, H, fill=1, stroke=0)

# moldura fina creme
c.setStrokeColor(CREAM); c.setLineWidth(0.8)
c.rect(28, 28, W-56, H-56, fill=0, stroke=1)

centered("C A R D Á P I O", SANS, 11, H-92, CREAM, tracking=4)

# logo (já traz o wordmark MIKIES); fundo casa com o verde
img = ImageReader(LOGO)
iw, ih = img.getSize()
lw = 330; lh = lw * ih / iw
c.drawImage(img, (W-lw)/2, H-150-lh, width=lw, height=lh, mask=None)

ty = H-150-lh - 46
centered("one bite to love it all.", SERIF_I, 17, ty, CREAM)
c.setStrokeColor(CREAM); c.setLineWidth(0.6)
c.line(W/2-46, ty-16, W/2+46, ty-16)
centered("COOKIES ARTESANAIS", SANS, 9.5, ty-34, CREAM, tracking=3)

centered("FORTALEZA · CE", SANS, 9, 86, CREAM, tracking=3)
centered("mikies.com.br", SERIF_I, 12, 66, CREAM)
c.showPage()

# ───────────────────────── PÁGINA 2 · MENU ─────────────────────────
c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)

ML, MR = 54, W-54
# cabeçalho
c.setFillColor(INK); c.setFont(SERIF_I, 34); c.drawString(ML, H-96, "cardápio")
c.setFont(SANS, 9); c.setFillColor(MUTED); c.drawString(ML+3, H-112, "MIKIES COOKIES")
c.setFont(SANS, 9); c.setFillColor(GREEN_D); c.drawRightString(MR, H-104, "Fortaleza · CE")
c.setStrokeColor(GREEN); c.setLineWidth(1.2); c.line(ML, H-124, MR, H-124)

COL_L, COL_LW = ML, 255
COL_R, COL_RW = 322, MR-322
y0 = H-170

# ---- coluna esquerda: embalagens ----
c.setFont(SERIF_I, 21); c.setFillColor(INK); c.drawString(COL_L, y0, "as embalagens")
y = y0-32
for nome, preco, desc in EMBALAGENS:
    c.setFont(SANS_B, 9.5); c.setFillColor(GREEN_D); c.drawString(COL_L, y, preco)
    c.setFont(SERIF_B, 13.5); c.setFillColor(INK); c.drawString(COL_L, y-16, nome)
    c.setFont(SANS, 8.3); c.setFillColor(MUTED); dy = y-29
    for ln in wrap(desc, SANS, 8.3, COL_LW):
        c.drawString(COL_L, dy, ln); dy -= 10.5
    y = dy - 12
c.setFont(SERIF_I, 9); c.setFillColor(GREEN_D)
for ln in wrap("Matcha tem acréscimo por embalagem (de R$ 2 a R$ 5).", SERIF_I, 9, COL_LW):
    c.drawString(COL_L, y, ln); y -= 12
emb_end = y

# ---- coluna direita: sabores ----
c.setFont(SERIF_I, 21); c.setFillColor(INK); c.drawString(COL_R, y0, "os sabores")
yr = y0-32
for nome, desc, premium in SABORES:
    c.setFont(SERIF_B, 13.5); c.setFillColor(INK); c.drawString(COL_R, yr, nome)
    if premium:
        wn = c.stringWidth(nome, SERIF_B, 13.5)
        c.setFont(SERIF_I, 9); c.setFillColor(GREEN_D); c.drawString(COL_R+wn+6, yr, "premium")
    c.setFont(SANS, 8.3); c.setFillColor(MUTED); dy = yr-12.5
    for ln in wrap(desc, SANS, 8.3, COL_RW):
        c.drawString(COL_R, dy, ln); dy -= 10.5
    yr = dy - 11
sab_end = yr

# ---- bloco central "como pedir" (centralizado no espaço inferior) ----
FH = 104
top = min(emb_end, sab_end)
mid = (top + (FH + 26)) / 2
c.setStrokeColor(GREEN); c.setLineWidth(0.8); c.line(W/2-150, mid+48, W/2+150, mid+48)
centered("como pedir", SERIF_I, 20, mid+22, INK)
c.setFont(SANS, 9); c.setFillColor(MUTED)
c.drawCentredString(W/2, mid, "Escolha a embalagem e monte os sabores   ·   Finalize pelo WhatsApp   ·   Pague no Pix e receba")
centered("·  ·  ·", SERIF, 12, mid-26, GREEN)
centered("Feito à mão, em pequenas fornadas — Fortaleza, CE", SERIF_I, 11.5, mid-50, MUTED)

# ───────── rodapé (faixa verde) ─────────
c.setFillColor(GREEN); c.rect(0, 0, W, FH, fill=1, stroke=0)
centered("one bite to love it all.", SERIF_I, 13.5, FH-28, CREAM)
c.setFont(SANS, 7.9); c.setFillColor(CREAM)
c.drawCentredString(W/2, FH-47, "FRETE   Fortaleza R$ 10  ·  Região Metropolitana R$ 20  ·  Retirada grátis")
c.drawCentredString(W/2, FH-60, "PAGAMENTO   Pix  mikiescookies@gmail.com")
c.setFont(SANS_B, 8.4); c.setFillColor(CREAM)
c.drawCentredString(W/2, FH-78, "mikies.com.br   ·   WhatsApp (85) 92008-0270   ·   @mikiescookies")

c.showPage()
c.save()
print("PDF salvo:", OUT)
