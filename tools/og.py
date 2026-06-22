#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Imagem de compartilhamento (OG) — bordô + creme oficiais, com ilustração da marca."""
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

W, H = 1200, 630
BORDO = HexColor('#630E19'); CREME = HexColor('#ECE1CC')
SANS = 'Helvetica'; SANS_B = 'Helvetica-Bold'; SERIF_I = 'Times-Italic'
OUT = "tools/og-mikies.pdf"

c = canvas.Canvas(OUT, pagesize=(W, H))
c.setFillColor(BORDO); c.rect(0, 0, W, H, fill=1, stroke=0)
c.setStrokeColor(CREME); c.setLineWidth(2); c.rect(26, 26, W-52, H-52, fill=0, stroke=1)

# ilustração da marca (versão creme) à esquerda
img = ImageReader("images/ill-logo-cream.png"); iw, ih = img.getSize()
lh = 420; lw = lh*iw/ih
c.drawImage(img, 150, (H-lh)/2, width=lw, height=lh, mask='auto')

# texto à direita
cx = 640 + (W-60-640)/2


def spaced(txt, font, size, y, tracking, color=CREME):
    c.setFont(font, size); c.setFillColor(color)
    total = sum(c.stringWidth(ch, font, size) + tracking for ch in txt) - tracking
    x = cx - total/2
    for ch in txt:
        c.drawString(x, y, ch); x += c.stringWidth(ch, font, size) + tracking


spaced("MIKIES", SANS_B, 60, 372, 6)
c.setStrokeColor(CREME); c.setLineWidth(1); c.line(cx-80, 350, cx+80, 350)
spaced("COOKIES ARTESANAIS  ·  FORTALEZA, CE", SANS, 15, 322, 2)
c.setFillColor(CREME); c.setFont(SERIF_I, 26)
c.drawCentredString(cx, 278, "one bite to love it all.")
c.setFont(SANS_B, 18); c.drawCentredString(cx, 245, "mikies.com.br")

c.showPage(); c.save()

import fitz
doc = fitz.open(OUT)
doc[0].get_pixmap(dpi=72).save("/tmp/og.png")
Image.open("/tmp/og.png").convert("RGB").save("images/og-mikies.jpg", quality=86, optimize=True)
print("og ok")
