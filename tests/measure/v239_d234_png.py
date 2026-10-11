import zlib,struct,sys
d=open(sys.argv[1],'rb').read();p=8;idat=b''
while p<len(d):
  n=struct.unpack('>I',d[p:p+4])[0];t=d[p+4:p+8];c=d[p+8:p+8+n];p+=12+n
  if t==b'IHDR':W,H,bd,ct=struct.unpack('>IIBB',c[:10])
  elif t==b'IDAT':idat+=c
raw=zlib.decompress(idat);bpp={2:3,6:4}[ct];st=W*bpp;rows=[];prev=bytearray(st);i=0
for y in range(H):
  f=raw[i];i+=1;line=bytearray(raw[i:i+st]);i+=st
  for x in range(st):
    a=line[x-bpp] if x>=bpp else 0;b=prev[x];c=prev[x-bpp] if x>=bpp else 0
    if f==1:line[x]=(line[x]+a)&255
    elif f==2:line[x]=(line[x]+b)&255
    elif f==3:line[x]=(line[x]+(a+b)//2)&255
    elif f==4:
      pp=a+b-c;pa,pb,pc=abs(pp-a),abs(pp-b),abs(pp-c);pr=a if pa<=pb and pa<=pc else (b if pb<=pc else c);line[x]=(line[x]+pr)&255
  rows.append(line);prev=line
  if y>700:break
def px(x,y):r=rows[y];return tuple(r[x*bpp:x*bpp+3])
print('size',W,H,'ct',ct)
def box(x0,x1,y0,y1,th):
  xs=[];ys=[]
  for y in range(y0,y1):
    for x in range(x0,x1):
      if sum(px(x,y))<th:xs.append(x);ys.append(y)
  return (min(xs),min(ys),max(xs),max(ys)) if xs else None
b=box(350,860,0,250,90);print('island px',b,'pt x,y,w,h',b[0]/3,b[1]/3,(b[2]-b[0]+1)/3,(b[3]-b[1]+1)/3)
print('left status px',box(0,400,0,200,300));print('right status px',box(850,1206,0,200,400))
for y in range(160,500):
  if any(sum(px(x,y))<300 for x in range(0,600)):print('first header ink y px',y,'pt',y/3);break
print('bg (5,5)',px(5,5),'bg (5,300)',px(5,300))
b=box(300,900,0,185,90);print('island2 px',b,'pt',b[0]/3,b[1]/3,(b[2]-b[0]+1)/3,(b[3]-b[1]+1)/3)
l=box(0,400,0,185,300);r=box(820,1206,0,185,400);print('left pt',[v/3 for v in l],'right pt',[v/3 for v in r])
