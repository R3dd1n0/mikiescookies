#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mockup da imagem de PEDIDO CONFIRMADO — identidade do cardápio (arco + verde/creme/bordô).
Gera um PNG de referência para recriar o template de Slides."""
import math
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = 600, 740

GREEN   = HexColor('#630E19'); GREEN_D = HexColor('#A85F22')
BORDO   = HexColor('#630E19'); CARAMEL = HexColor('#C8813A'); CARAMEL_D = HexColor('#A85F22')
INK     = HexColor('#2A0A10'); MUTED   = HexColor('#6E5A52'); CREAM = HexColor('#ECE1CC')
SERIF, SERIF_I, SERIF_B = 'Times-Roman', 'Times-Italic', 'Times-Bold'
SANS, SANS_B = 'Helvetica', 'Helvetica-Bold'

LOGO = "images/ill-logo-cream.png"
OUT  = "tools/confirmacao-mock.pdf"

NUM, NOME = "1", "Mariana Marinho"
ENTREGA, DATA = "Reg. Metropolitana", "21/06/2026"
ITENS = "Mikies Pocket — 2× Chocolate ao Leite, 2× Ninho, 2× Red Velvet, 1× Black, 1× Morango, 2× Matcha (10 pacotes)"
OCASIAO = "Formatura"
SUBTOTAL, FRETE, TOTAL = "133,00", "25,00", "158,00"
PIX = "mikiescookies@gmail.com"

c = canvas.Canvas(OUT, pagesize=(W, H))
CX = W/2
PX0, PX1 = 26, W-26
PT, ARCH = H-20, 120
YSH, YGREEN = PT-ARCH, PT-176


def wave_pts(x1, x2, y, amp, wl):
    n = max(2, int(abs(x2-x1)/4))
    return [(x1+(x2-x1)*i/n, y+amp*math.sin((x1+(x2-x1)*i/n)/wl*2*math.pi)) for i in range(n+1)]


def draw_wave(x1, x2, y, amp, wl, color, width):
    pts = wave_pts(x1, x2, y, amp, wl)
    p = c.beginPath(); p.moveTo(*pts[0])
    for pt in pts[1:]:
        p.lineTo(*pt)
    c.setStrokeColor(color); c.setLineWidth(width); c.setLineCap(1); c.drawPath(p, stroke=1, fill=0)


def greencap():
    p = c.beginPath(); p.moveTo(PX0, YGREEN); p.lineTo(PX0, YSH)
    p.curveTo(PX0, YSH+ARCH*0.55, CX-(CX-PX0)*0.52, PT, CX, PT)
    p.curveTo(CX+(PX1-CX)*0.52, PT, PX1, YSH+ARCH*0.55, PX1, YSH)
    p.lineTo(PX1, YGREEN)
    for x, y in wave_pts(PX1, PX0, YGREEN, 6, 150):
        p.lineTo(x, y)
    p.close(); return p


def wrap(text, font, size, maxw):
    out, line = [], ""
    for w in text.split(" "):
        t = (line+" "+w).strip()
        if c.stringWidth(t, font, size) <= maxw:
            line = t
        else:
            out.append(line); line = w
    out.append(line); return out


def check(cx, cy, r):
    c.setFillColor(GREEN_D); c.circle(cx, cy, r, fill=1, stroke=0)
    c.setStrokeColor(CREAM); c.setLineWidth(2.2); c.setLineCap(1)
    p = c.beginPath(); p.moveTo(cx-r*0.45, cy); p.lineTo(cx-r*0.1, cy-r*0.4); p.lineTo(cx+r*0.5, cy+r*0.4)
    c.drawPath(p, stroke=1, fill=0)


# fundo + arco
c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(GREEN); c.drawPath(greencap(), fill=1, stroke=0)
img = ImageReader(LOGO); iw, ih = img.getSize(); lh = 96; lw = lh*iw/ih
c.drawImage(img, CX-lw/2, PT-16-lh, width=lw, height=lh, mask='auto')
c.setFillColor(CREAM); c.setFont(SANS, 9)
c.drawCentredString(CX, YGREEN+18, "C O O K I E S   A R T E S A N A I S   ·   F O R T A L E Z A")

# confirmado + nº
y = YGREEN-30
check(CX-92, y+4, 8)
c.setFillColor(BORDO); c.setFont(SANS_B, 13); c.drawString(CX-78, y, "PEDIDO CONFIRMADO")
c.setFillColor(BORDO); c.setFont(SERIF_I, 19); c.drawCentredString(CX, y-26, f"Nº {NUM}")


def label(x, y, txt):
    c.setFillColor(CARAMEL_D); c.setFont(SANS_B, 8.5); c.drawString(x, y, txt)


MX = 48
y = y-58
label(MX, y, "SEUS DADOS")
c.setFont(SANS, 10.5)
for k, v in [("Nome", NOME), ("Entrega", ENTREGA), ("Data", DATA)]:
    y -= 17
    c.setFillColor(MUTED); c.drawString(MX, y, f"{k}")
    c.setFillColor(INK); c.drawString(MX+66, y, v)

y -= 24
draw_wave(MX, W-MX, y, 2, 38, CARAMEL, 1)
y -= 18
label(MX, y, "SEU PEDIDO")
y -= 16
c.setFillColor(INK); c.setFont(SERIF, 11.5)
for ln in wrap(ITENS, SERIF, 11.5, W-2*MX):
    c.drawString(MX, y, ln); y -= 15
y -= 4
c.setFillColor(BORDO); c.setFont(SERIF_I, 12); c.drawCentredString(CX, y, f"* {OCASIAO} *")

y -= 26
draw_wave(MX, W-MX, y, 2, 38, CARAMEL, 1)
y -= 22
c.setFont(SANS, 10.5); c.setFillColor(MUTED)
c.drawString(MX, y, "Subtotal"); c.setFillColor(INK); c.drawRightString(W-MX, y, f"R$ {SUBTOTAL}")
y -= 17
c.setFillColor(MUTED); c.drawString(MX, y, "Frete"); c.setFillColor(INK); c.drawRightString(W-MX, y, f"R$ {FRETE}")
y -= 26
c.setFillColor(BORDO); c.setFont(SERIF_B, 17); c.drawString(MX, y, "TOTAL")
c.drawRightString(W-MX, y, f"R$ {TOTAL}")

# pix
y -= 30
draw_wave(MX, W-MX, y, 2.4, 40, GREEN, 1.2)
y -= 22
c.setFillColor(CARAMEL_D); c.setFont(SANS_B, 9); c.drawCentredString(CX, y, "C H A V E   P I X")
y -= 22
c.setFillColor(BORDO); c.setFont(SERIF_B, 16); c.drawCentredString(CX, y, PIX)
y -= 16
c.setFillColor(MUTED); c.setFont(SANS, 8.5); c.drawCentredString(CX, y, "Envie o comprovante após o pagamento")

# rodapé
c.setFillColor(BORDO); c.setFont(SANS_B, 9)
c.drawCentredString(CX, 30, "mikies.com.br   ·   @mikiescookies")
draw_wave(CX-80, CX+80, 18, 1.6, 24, CARAMEL, 1)

c.showPage(); c.save()
print("ok", OUT)
