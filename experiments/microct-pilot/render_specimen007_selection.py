"""Compact raw-image evidence sheet, with disagreement explicitly visible."""
import gzip
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from PIL import Image,ImageDraw,ImageFont
OUT=ROOT/'output/specimen007-crown'

def volume(name):
    b=(OUT/name).read_bytes().split(b'\n\n',1)[1]
    return np.frombuffer(gzip.decompress(b),np.uint8).reshape((335,320,300))

raw=volume('raw-native-10um.nrrd');stable=volume('six-variant-agreement-10um.nrrd')
uncertain=volume('variant-disagreement-10um.nrrd')
sheet=Image.new('RGB',(1060,885),'#f1f4f3');draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
small=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',17)
title=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',27)
draw.text((26,14),'007 标本：冠方局部原图与分割对照',font=title,fill='#193e37')
for c,z in enumerate([1247,1350,1434]):
    x=26+c*346;k=z-1100
    draw.text((x,65),f'源切片 {z}',font=font,fill='#193e37')
    gray=(np.clip(raw[k].astype(float)/90,0,1)*255).astype(np.uint8)
    rgb=np.repeat(gray[...,None],3,axis=2)
    overlay=rgb.copy();overlay[uncertain[k]>0]=[220,144,47];overlay[stable[k]>0]=[36,178,146]
    sheet.paste(Image.fromarray(rgb),(x,100));sheet.paste(Image.fromarray(overlay),(x,465))
    draw.line((x+15,400,x+65,400),fill='white',width=3)
    draw.text((x+13,376),'约 0.5 mm',font=small,fill='white')
draw.text((26,433),'上：未经滤波原图（统一显示灰度窗）　下：六种分割的共同区域与分歧',font=small,fill='#193e37')
draw.rectangle((26,812,41,827),fill=(36,178,146));draw.text((51,803),'共同覆盖',font=font,fill='#193e37')
draw.rectangle((208,812,223,827),fill=(220,144,47));draw.text((233,803),'存在分歧，不视为已确认细节',font=font,fill='#193e37')
draw.text((26,848),'仅为局部候选；尚未重建完整髓腔。参数一致不等于医学真值。',font=small,fill='#516963')
sheet.save(OUT/'selection-summary.png')
