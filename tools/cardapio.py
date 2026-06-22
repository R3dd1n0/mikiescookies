#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cardápio Mikies Cookies — 1 página, arco boleado sem moldura, traço artesanal.
Paleta: verde-sálvia da marca + bordô/caramelo do site, sobre creme."""
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = A4

# marca + site
GREEN   = HexColor('#97A572')   # verde-sálvia do logo
GREEN_D = HexColor('#566036')
BORDO   = HexColor('#6B0F2A')   # vinho do site
CARAMEL = HexColor('#C8813A')   # caramelo do site
CARAMEL_D = HexColor('#A85F22') # caramelo p/ texto (mais legível)
INK     = HexColor('#211F18')
MUTED   = HexColor('#5E5C50')
CREAM   = HexColor('#FBF4E8')   # bege-claro do site

SERIF, SERIF_I, SERIF_B = 'Times-Roman', 'Times-Italic', 'Times-Bold'
SANS, SANS_B = 'Helvetica', 'Helvetica-Bold'

LOGO = "images/marca-mikies.jpg"
OUT  = "cardapio-mikies.pdf"

EMBALAGENS = [
    ("Mikies Mimo",     "R$ 59,90",          "40 cookies · 300 g · até 3 sabores"),
    ("Mikies Dip",      "R$ 64,90",          "30 cookies · 225 g · até 3 sabores\nacompanha nutela + caramelo salgado"),
    ("Mikies Jewel",    "R$ 39,90",          "24 cookies · 180 g · 1 sabor"),
    ("Mikies to Share", "R$ 25,90",          "20 cookies · 150 g · 1 sabor"),
    ("Mikies Pocket",   "R$ 12,90 / pacote", "6 cookies/pacote · 40 g · mín. 10 pacotes"),
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

PX0, PX1 = 36, W-36
CX   = W/2
PT   = H-30           # topo do arco
ARCH = 158
YSH  = PT-ARCH        # ombro do arco
YGREEN = PT-230       # base ondulada da tampa verde


def wave_pts(x1, x2, y, amp, wl):
    n = max(2, int(abs(x2-x1)/4))
    return [(x1+(x2-x1)*i/n, y+amp*math.sin((x1+(x2-x1)*i/n)/wl*2*math.pi)) for i in range(n+1)]


def greencap_path():
    p = c.beginPath()
    p.moveTo(PX0, YGREEN)
    p.lineTo(PX0, YSH)
    p.curveTo(PX0, YSH+ARCH*0.55, CX-(CX-PX0)*0.52, PT, CX, PT)
    p.curveTo(CX+(PX1-CX)*0.52, PT, PX1, YSH+ARCH*0.55, PX1, YSH)
    p.lineTo(PX1, YGREEN)
    for x, y in wave_pts(PX1, PX0, YGREEN, 8, 150):
        p.lineTo(x, y)
    p.close()
    return p


def draw_wave(x1, x2, y, amp, wl, color, width):
    pts = wave_pts(x1, x2, y, amp, wl)
    p = c.beginPath(); p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    c.setStrokeColor(color); c.setLineWidth(width); c.setLineCap(1)
    c.drawPath(p, stroke=1, fill=0)


def wrap(text, font, size, maxw):
    out = []
    for para in text.split("\n"):
        line = ""
        for w in para.split(" "):
            t = (line+" "+w).strip()
            if c.stringWidth(t, font, size) <= maxw:
                line = t
            else:
                out.append(line); line = w
        out.append(line)
    return out


# ── fundo + tampa verde em arco (sem moldura) ──
c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(GREEN); c.drawPath(greencap_path(), fill=1, stroke=0)

# logo + tagline na tampa
img = ImageReader(LOGO); iw, ih = img.getSize()
lw = 150; lh = lw*ih/iw
c.drawImage(img, CX-lw/2, PT-28-lh, width=lw, height=lh, mask=None)
c.setFillColor(CREAM); c.setFont(SERIF_I, 16.5)
c.drawCentredString(CX, YGREEN+28, "one bite to love it all.")
draw_wave(CX-56, CX+56, YGREEN+15, 1.6, 16, CREAM, 1.1)

# ── colunas ──
def title(x, y, txt):
    c.setFillColor(BORDO); c.setFont(SERIF_I, 22); c.drawString(x, y, txt)
    w = c.stringWidth(txt, SERIF_I, 22)
    draw_wave(x, x+w, y-8, 1.8, 14, CARAMEL, 1.4)


LX, LW = 54, 236
RX, RW = 312, W-42-312
y0 = YGREEN-48

title(LX, y0, "as embalagens")
y = y0-30
for nome, preco, desc in EMBALAGENS:
    c.setFont(SANS_B, 10.5); c.setFillColor(CARAMEL_D); c.drawString(LX, y, preco)
    c.setFont(SERIF_B, 14); c.setFillColor(INK); c.drawString(LX, y-17, nome)
    c.setFont(SANS, 9); c.setFillColor(MUTED); dy = y-31
    for ln in wrap(desc, SANS, 9, LW):
        c.drawString(LX, dy, ln); dy -= 11.5
    y = dy-13
c.setFont(SERIF_I, 9.5); c.setFillColor(GREEN_D)
c.drawString(LX, y, "Matcha tem acréscimo por embalagem (R$ 2 a R$ 5).")

title(RX, y0, "os sabores")
yr = y0-30
for nome, desc, premium in SABORES:
    c.setFont(SERIF_B, 14); c.setFillColor(INK); c.drawString(RX, yr, nome)
    if premium:
        wn = c.stringWidth(nome, SERIF_B, 14)
        c.setFont(SERIF_I, 9.5); c.setFillColor(BORDO); c.drawString(RX+wn+7, yr, "premium")
    c.setFont(SANS, 9); c.setFillColor(MUTED)
    for i, ln in enumerate(wrap(desc, SANS, 9, RW)):
        c.drawString(RX, yr-13-i*11, ln)
    yr -= 39

# ── rodapé (sem faixa dura) ──
yb = 138
draw_wave(92, W-92, yb, 2.6, 42, GREEN, 1.3)
c.setFillColor(BORDO); c.setFont(SERIF_I, 13.5)
c.drawCentredString(CX, yb-27, "Feito à mão, em pequenas fornadas")
c.setFillColor(MUTED); c.setFont(SANS, 9)
c.drawCentredString(CX, yb-46, "FRETE   Fortaleza R$ 10  ·  Região Metropolitana R$ 20  ·  Retirada grátis")
c.drawCentredString(CX, yb-60, "PAGAMENTO   Pix  mikiescookies@gmail.com")
c.setFillColor(BORDO); c.setFont(SANS_B, 9.5)
c.drawCentredString(CX, yb-79, "mikies.com.br   ·   WhatsApp (85) 92008-0270   ·   @mikiescookies")
# fecho boleado (mini onda caramelo)
draw_wave(CX-90, CX+90, 44, 2, 26, CARAMEL, 1.1)

c.showPage(); c.save()
print("PDF salvo:", OUT)
