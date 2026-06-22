#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cardápio Mikies Cookies — 1 página, painel em arco, traço artesanal."""
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = A4

GREEN   = HexColor('#97A572')
GREEN_D = HexColor('#566036')
INK     = HexColor('#211F18')
MUTED   = HexColor('#5E5C50')
CREAM   = HexColor('#F7F2E7')
CREAM_2 = HexColor('#FBF8F0')

SERIF, SERIF_I, SERIF_B = 'Times-Roman', 'Times-Italic', 'Times-Bold'
SANS, SANS_B = 'Helvetica', 'Helvetica-Bold'

LOGO = "images/marca-mikies.jpg"
OUT  = "cardapio-mikies.pdf"

EMBALAGENS = [
    ("Mikies Mimo",     "R$ 59,90",          "40 cookies · 300 g · até 3 sabores"),
    ("Mikies Dip",      "R$ 64,90",          "30 cookies · 225 g · até 3 sabores\nacompanha nutela + caramelo salgado"),
    ("Mikies Jewel",    "R$ 39,90",          "24 cookies · 180 g · 1 sabor"),
    ("Mikies to Share", "R$ 25,90",          "20 cookies · 150 g · 1 sabor"),
    ("Mikies Pocket",   "R$ 12,90 / pacote", "6 cookies/pacote · 40 g · 1 sabor · mín. 10 pacotes"),
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

# geometria do painel em arco
PX0, PX1 = 38, W-38
PB, PT   = 40, H-34
CX       = W/2
RAD      = 30          # cantos inferiores arredondados
ARCH     = 168         # altura do arco
YSH      = PT-ARCH     # "ombro" onde o arco começa
YGREEN   = PT-250      # base (ondulada) da tampa verde


def wave_pts(x1, x2, y, amp, wl):
    n = max(2, int(abs(x2-x1)/4))
    return [(x1+(x2-x1)*i/n, y+amp*math.sin((x1+(x2-x1)*i/n)/wl*2*math.pi)) for i in range(n+1)]


def panel_path():
    p = c.beginPath()
    p.moveTo(PX0, PB+RAD)
    p.lineTo(PX0, YSH)
    p.curveTo(PX0, YSH+ARCH*0.55, CX-(CX-PX0)*0.52, PT, CX, PT)          # arco esquerdo
    p.curveTo(CX+(PX1-CX)*0.52, PT, PX1, YSH+ARCH*0.55, PX1, YSH)        # arco direito
    p.lineTo(PX1, PB+RAD)
    p.curveTo(PX1, PB+RAD*0.45, PX1-RAD*0.45, PB, PX1-RAD, PB)           # canto inf. dir.
    p.lineTo(PX0+RAD, PB)
    p.curveTo(PX0+RAD*0.45, PB, PX0, PB+RAD*0.45, PX0, PB+RAD)           # canto inf. esq.
    p.close()
    return p


def greencap_path():
    p = c.beginPath()
    p.moveTo(PX0, YGREEN)
    p.lineTo(PX0, YSH)
    p.curveTo(PX0, YSH+ARCH*0.55, CX-(CX-PX0)*0.52, PT, CX, PT)
    p.curveTo(CX+(PX1-CX)*0.52, PT, PX1, YSH+ARCH*0.55, PX1, YSH)
    p.lineTo(PX1, YGREEN)
    for x, y in wave_pts(PX1, PX0, YGREEN, 7, 150):                      # base ondulada
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


# ── fundo + painel ──
c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(CREAM_2); c.drawPath(panel_path(), fill=1, stroke=0)
c.setFillColor(GREEN);   c.drawPath(greencap_path(), fill=1, stroke=0)
draw_wave(PX0, PX1, YGREEN, 7, 150, CREAM_2, 1.4)           # realça a ondulação verde/creme
c.setStrokeColor(INK); c.setLineWidth(1.6); c.setLineJoin(1)
c.drawPath(panel_path(), fill=0, stroke=1)                 # contorno do arco

# ── tampa verde: logo + tagline ──
img = ImageReader(LOGO); iw, ih = img.getSize()
lw = 150; lh = lw*ih/iw
c.drawImage(img, CX-lw/2, PT-40-lh, width=lw, height=lh, mask=None)
c.setFillColor(CREAM); c.setFont(SERIF_I, 15)
c.drawCentredString(CX, YGREEN+30, "one bite to love it all.")
draw_wave(CX-52, CX+52, YGREEN+18, 1.4, 16, CREAM, 1)

# ── colunas ──
def title(x, y, txt):
    c.setFillColor(INK); c.setFont(SERIF_I, 18); c.drawString(x, y, txt)
    w = c.stringWidth(txt, SERIF_I, 18)
    draw_wave(x, x+w, y-7, 1.5, 13, GREEN, 1.2)


LX, LW = 70, 205
RX, RW = 312, 221
y0 = YGREEN-40

title(LX, y0, "as embalagens")
y = y0-26
for nome, preco, desc in EMBALAGENS:
    c.setFont(SANS_B, 9); c.setFillColor(GREEN_D); c.drawString(LX, y, preco)
    c.setFont(SERIF_B, 12.5); c.setFillColor(INK); c.drawString(LX, y-15, nome)
    c.setFont(SANS, 7.8); c.setFillColor(MUTED); dy = y-27
    for ln in wrap(desc, SANS, 7.8, LW):
        c.drawString(LX, dy, ln); dy -= 10
    y = dy-11
c.setFont(SERIF_I, 8.6); c.setFillColor(GREEN_D)
c.drawString(LX, y, "Matcha tem acréscimo por embalagem (R$ 2 a R$ 5).")

title(RX, y0, "os sabores")
yr = y0-26
for nome, desc, premium in SABORES:
    c.setFont(SERIF_B, 12.5); c.setFillColor(INK); c.drawString(RX, yr, nome)
    if premium:
        wn = c.stringWidth(nome, SERIF_B, 12.5)
        c.setFont(SERIF_I, 8.5); c.setFillColor(GREEN_D); c.drawString(RX+wn+6, yr, "premium")
    c.setFont(SANS, 7.8); c.setFillColor(MUTED)
    c.drawString(RX, yr-11, desc)
    yr -= 33

# ── rodapé dentro do painel (sem faixa dura) ──
yb = 150
draw_wave(96, W-96, yb, 2.4, 40, GREEN, 1.2)
c.setFillColor(GREEN_D); c.setFont(SERIF_I, 12)
c.drawCentredString(CX, yb-26, "Feito à mão, em pequenas fornadas")
c.setFillColor(MUTED); c.setFont(SANS, 8)
c.drawCentredString(CX, yb-44, "FRETE   Fortaleza R$ 10  ·  Região Metropolitana R$ 20  ·  Retirada grátis")
c.drawCentredString(CX, yb-57, "PAGAMENTO   Pix  mikiescookies@gmail.com")
c.setFillColor(INK); c.setFont(SANS_B, 8.4)
c.drawCentredString(CX, yb-74, "mikies.com.br   ·   WhatsApp (85) 92008-0270   ·   @mikiescookies")

c.showPage(); c.save()
print("PDF salvo:", OUT)
