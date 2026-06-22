#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Imagem de compartilhamento (OG) do site — 1200x630, identidade da marca."""
import math
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = 1200, 630
GREEN = HexColor('#97A572'); CREAM = HexColor('#FBF4E8'); BORDO = HexColor('#6B0F2A')
SERIF_I = 'Times-Italic'; SANS = 'Helvetica'
LOGO = "images/marca-mikies.jpg"
OUT = "tools/og-mikies.pdf"

c = canvas.Canvas(OUT, pagesize=(W, H))
c.setFillColor(GREEN); c.rect(0, 0, W, H, fill=1, stroke=0)

# moldura fina creme
c.setStrokeColor(CREAM); c.setLineWidth(2); c.rect(26, 26, W-52, H-52, fill=0, stroke=1)

# logo à esquerda (fundo casa com o verde)
img = ImageReader(LOGO); iw, ih = img.getSize()
lh = 430; lw = lh*iw/ih
c.drawImage(img, 110, (H-lh)/2, width=lw, height=lh, mask=None)

# texto à direita
cx = 620 + (W-60-620)/2
c.setFillColor(CREAM); c.setFont(SERIF_I, 46)
c.drawCentredString(cx, 352, "one bite to love it all.")
c.setLineWidth(1); c.setStrokeColor(CREAM); c.line(cx-70, 330, cx+70, 330)


def spaced(txt, font, size, y, tracking):
    c.setFont(font, size)
    total = sum(c.stringWidth(ch, font, size) + tracking for ch in txt) - tracking
    x = cx - total/2
    for ch in txt:
        c.drawString(x, y, ch); x += c.stringWidth(ch, font, size) + tracking


c.setFillColor(CREAM)
spaced("COOKIES ARTESANAIS  ·  FORTALEZA, CE", SANS, 16, 300, 2)
c.setFont(SERIF_I, 30); c.drawCentredString(cx, 250, "mikies.com.br")

c.showPage(); c.save()
print("ok", OUT)
