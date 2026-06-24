#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cardápio Mikies — 1 página, identidade oficial (bordô + creme), arco boleado.
Ilustração e wordmark da marca; links clicáveis (site, WhatsApp, Instagram)."""
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = A4

BORDO   = HexColor('#630E19')   # vinho oficial
CREME   = HexColor('#ECE1CC')   # creme oficial
PAGE    = HexColor('#F4ECDA')   # creme claro de fundo
INK     = HexColor('#2A0A10')
MUTED   = HexColor('#6E5A52')
CARAMEL = HexColor('#C8813A'); CARAMEL_D = HexColor('#A85F22')

SERIF_I = 'Times-Italic'
SANS, SANS_B = 'Helvetica', 'Helvetica-Bold'   # substituto geométrico da Futura

ILUSTRA = "images/ill-logo-cream.png"
OUT = "cardapio-mikies.pdf"

EMBALAGENS = [
    ("Mikies Mimo",     "R$ 59,90",          "40 cookies · 300 g · até 3 sabores",
     "Potinho de acrílico cheio de charme, pra presentear."),
    ("Mikies Dip",      "R$ 64,90",          "30 cookies · 225 g · até 3 sabores",
     "Com molhos pra mergulhar: nutela e caramelo salgado."),
    ("Mikies Jewel",    "R$ 39,90",          "24 cookies · 180 g · 1 sabor",
     "Lata-presente de um sabor só. Linda de presentear."),
    ("Mikies to Share", "R$ 25,90",          "20 cookies · 150 g · 1 sabor",
     "Pra levar na bolsa e dividir (ou não) e ser feliz."),
    ("Mikies Pocket",   "R$ 12,90 / pacote", "6 cookies/pacote · 40 g · mín. 10",
     "A versão mini, em saquinhos individuais."),
]
SABORES = [
    ("Chocolate ao Leite", "Massa tradicional com gotas de chocolate ao leite.", False),
    ("Ninho",              "Massa cremosa de leite Ninho, docinha na medida.", False),
    ("Red Velvet",         "Massa red incrível com gotas de chocolate branco.", False),
    ("Black",              "Cacau black com gotas de choco ao leite e amargo.", False),
    ("Morango",            "Choco branco com um toque de morango (rosinha!).", False),
    ("Matcha",             "Matcha com chocolate branco; levemente amarga.", True),
]

WA_URL, IG_URL, SITE_URL = "https://wa.me/5585997954846", "https://instagram.com/mikiescookies", "https://mikies.com.br"

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Cardápio — Mikies Cookies")

PX0, PX1 = 36, W-36
CX = W/2
PT, ARCH = H-30, 158
YSH = PT-ARCH
YCAP = PT-232


def wave_pts(x1, x2, y, amp, wl):
    n = max(2, int(abs(x2-x1)/4))
    return [(x1+(x2-x1)*i/n, y+amp*math.sin((x1+(x2-x1)*i/n)/wl*2*math.pi)) for i in range(n+1)]


def cap_path():
    p = c.beginPath()
    p.moveTo(PX0, YCAP); p.lineTo(PX0, YSH)
    p.curveTo(PX0, YSH+ARCH*0.55, CX-(CX-PX0)*0.52, PT, CX, PT)
    p.curveTo(CX+(PX1-CX)*0.52, PT, PX1, YSH+ARCH*0.55, PX1, YSH)
    p.lineTo(PX1, YCAP)
    for x, y in wave_pts(PX1, PX0, YCAP, 8, 150):
        p.lineTo(x, y)
    p.close(); return p


def draw_wave(x1, x2, y, amp, wl, color, width):
    pts = wave_pts(x1, x2, y, amp, wl)
    p = c.beginPath(); p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    c.setStrokeColor(color); c.setLineWidth(width); c.setLineCap(1); c.drawPath(p, stroke=1, fill=0)


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


def spaced(txt, font, size, y, tracking, color):
    c.setFont(font, size); c.setFillColor(color)
    total = sum(c.stringWidth(ch, font, size) + tracking for ch in txt) - tracking
    x = CX - total/2
    for ch in txt:
        c.drawString(x, y, ch); x += c.stringWidth(ch, font, size) + tracking


# fundo + tampa bordô em arco
c.setFillColor(PAGE); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(BORDO); c.drawPath(cap_path(), fill=1, stroke=0)

# ilustração + wordmark + tagline na tampa
img = ImageReader(ILUSTRA); iw, ih = img.getSize()
lh = 104; lw = lh*iw/ih
c.drawImage(img, CX-lw/2, PT-22-lh, width=lw, height=lh, mask='auto')
spaced("MIKIES", SANS_B, 21, YCAP+44, 5, CREME)
c.setFillColor(CREME); c.setFont(SERIF_I, 14); c.drawCentredString(CX, YCAP+24, "one bite to love it all.")
draw_wave(CX-52, CX+52, YCAP+13, 1.4, 16, CREME, 1)


def title(x, y, txt):
    c.setFillColor(BORDO); c.setFont(SERIF_I, 22); c.drawString(x, y, txt)
    draw_wave(x, x+c.stringWidth(txt, SERIF_I, 22), y-8, 1.8, 14, CARAMEL, 1.4)


LX, LW = 54, 240
RX, RW = 318, W-40-318
y0 = YCAP-44

title(LX, y0, "as embalagens")
y = y0-30
for nome, preco, meta, desc in EMBALAGENS:
    c.setFont(SANS_B, 10); c.setFillColor(CARAMEL_D); c.drawString(LX, y, preco)
    c.setFont('Times-Bold', 13.5); c.setFillColor(INK); c.drawString(LX, y-15, nome)
    c.setFont(SANS, 7.6); c.setFillColor(MUTED); c.drawString(LX, y-27, meta)
    c.setFont(SERIF_I, 8.8); c.setFillColor(BORDO); dy = y-39
    for ln in wrap(desc, SERIF_I, 8.8, LW):
        c.drawString(LX, dy, ln); dy -= 10.5
    y = dy-13
c.setFont(SERIF_I, 8.8); c.setFillColor(BORDO)
c.drawString(LX, y, "Matcha tem acréscimo por embalagem (R$ 2 a R$ 5).")

title(RX, y0, "os sabores")
yr = y0-30
for nome, desc, premium in SABORES:
    c.setFont('Times-Bold', 13.5); c.setFillColor(INK); c.drawString(RX, yr, nome)
    if premium:
        c.setFont(SERIF_I, 9); c.setFillColor(BORDO)
        c.drawString(RX+c.stringWidth(nome, 'Times-Bold', 13.5)+7, yr, "premium")
    c.setFont(SANS, 8.6); c.setFillColor(MUTED)
    for i, ln in enumerate(wrap(desc, SANS, 8.6, RW)):
        c.drawString(RX, yr-12-i*10.5, ln)
    yr -= 37

# rodapé
yb = 140
draw_wave(92, W-92, yb, 2.6, 42, BORDO, 1.3)
c.setFillColor(BORDO); c.setFont(SERIF_I, 13.5)
c.drawCentredString(CX, yb-27, "Feito à mão, em pequenas fornadas")
c.setFillColor(MUTED); c.setFont(SANS, 9)
c.drawCentredString(CX, yb-46, "FRETE   Fortaleza R$ 15  ·  Região Metropolitana R$ 25  ·  Retirada grátis")
c.drawCentredString(CX, yb-60, "PAGAMENTO   Pix  mikiescookies@gmail.com")

font, size, yl = SANS_B, 9.5, yb-80
parts = [("mikies.com.br", SITE_URL), ("     ·     ", None),
         ("WhatsApp (85) 92008-0270", WA_URL), ("     ·     ", None),
         ("@mikiescookies", IG_URL)]
total = sum(c.stringWidth(t, font, size) for t, _ in parts)
x = CX-total/2; c.setFont(font, size)
for text, url in parts:
    w = c.stringWidth(text, font, size)
    c.setFillColor(BORDO); c.drawString(x, yl, text)
    if url:
        c.setStrokeColor(CARAMEL); c.setLineWidth(0.7); c.line(x, yl-2.5, x+w, yl-2.5)
        c.linkURL(url, (x, yl-4, x+w, yl+11), relative=0)
    x += w
draw_wave(CX-90, CX+90, 44, 2, 26, CARAMEL, 1.1)

c.showPage(); c.save()
print("PDF salvo:", OUT)
