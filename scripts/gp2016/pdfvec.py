import re, zlib, sys

def parse_pdf(path):
    data = open(path, 'rb').read()
    objects = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj(.*?)endobj', data, re.S):
        objects[int(m.group(1))] = m.group(3)
    km = re.search(rb'/Kids\s*\[(.*?)\]', data, re.S)
    kids = [int(x) for x in re.findall(rb'(\d+)\s+0\s+R', km.group(1))] if km else []
    pages = []
    for num in kids:
        if num in objects and b'/Type/Page' in objects[num]:
            pages.append((num, objects[num]))
    return objects, pages

def get_stream(body):
    mm = re.search(rb'stream\r?\n(.*?)endstream', body, re.S)
    if not mm: return None
    raw = mm.group(1)
    head = body.split(b'stream')[0]
    if b'FlateDecode' in head:
        return zlib.decompress(raw)
    return raw

def get_resources(objects, body, inherited=None):
    m = re.search(rb'/Resources\s*<<(.*?)>>', body, re.S)
    if not m:
        m = re.search(rb'/Resources\s*(\d+)\s+0\s+R', body)
        if m and int(m.group(1)) in objects:
            return get_resources(objects, objects[int(m.group(1))])
        return {}
    res = m.group(1)
    xo = {}
    xm = re.search(rb'/XObject\s*<<(.*?)>>', res, re.S)
    if xm:
        for mm in re.finditer(rb'/([A-Za-z0-9_.]+)\s+(\d+)\s+0\s+R', xm.group(1)):
            xo[mm.group(1)] = int(mm.group(2))
    return {'xobjects': xo}

def tokenize(content):
    tokens = []
    i = 0
    n = len(content)
    while i < n:
        c = content[i:i+1]
        if c in b' \t\r\n':
            i += 1; continue
        if c == b'%':
            j = content.find(b'\n', i)
            i = (j + 1) if j != -1 else n
            continue
        if c == b'(':
            j = i + 1; depth = 1
            while j < n and depth:
                if content[j:j+1] == b'\\': j += 2; continue
                if content[j:j+1] == b'(': depth += 1
                elif content[j:j+1] == b')': depth -= 1
                j += 1
            i = j; continue
        if c == b'<':
            if content[i+1:i+2] == b'<':
                tokens.append(b'<<'); i += 2; continue
            j = content.find(b'>', i)
            i = (j + 1) if j != -1 else n; continue
        if c in b'/[]':
            tokens.append(c); i += 1; continue
        if c == b'B' and i+1 < n and content[i+1:i+2] == b'T':
            tokens.append(b'BT'); i += 2; continue
        if c == b'E' and i+1 < n and content[i+1:i+2] == b'T':
            tokens.append(b'ET'); i += 2; continue
        if c == b'T' and i+1 < n and content[i+1:i+2] in (b'j',b'J',b'd',b'f',b'*',b'D',b'c',b'm',b'z',b'w'):
            tokens.append(b'T'+content[i+1:i+2]); i += 2; continue
        if c == b'r' and i+1 < n and content[i+1:i+2] == b'e':
            tokens.append(b're'); i += 2; continue
        if c == b'c' and i+1 < n and content[i+1:i+2] == b'm':
            tokens.append(b'cm'); i += 2; continue
        if c == b'g' and i+1 < n and content[i+1:i+2] == b's':
            tokens.append(b'gs'); i += 2; continue
        if c == b'B' and i+1 < n and content[i+1:i+2] == b'*':
            tokens.append(b'B*'); i += 2; continue
        if c == b'W' and i+1 < n and content[i+1:i+2] == b'*':
            tokens.append(b'W*'); i += 2; continue
        if c.isdigit() or c in b'+-.':
            j = i
            while j < n and (content[j:j+1].isdigit() or content[j:j+1] in b'+-.'):
                j += 1
            tokens.append(float(content[i:j])); i = j; continue
        if c == b'B' and i+1 < n and content[i+1:i+2] == b'I':
            tokens.append(b'BI'); i += 2; continue
        if c == b'E' and i+1 < n and content[i+1:i+2] == b'I':
            tokens.append(b'EI'); i += 2; continue
        if c == b'I' and i+1 < n and content[i+1:i+2] == b'D':
            tokens.append(b'ID'); i += 2; continue
        tokens.append(c); i += 1
    return tokens

def mat_mul(a, b):
    return [
        a[0]*b[0]+a[1]*b[3], a[0]*b[1]+a[1]*b[4], a[0]*b[2]+a[1]*b[5]+a[2],
        a[3]*b[0]+a[4]*b[3], a[3]*b[1]+a[4]*b[4], a[3]*b[2]+a[4]*b[5]+a[5],
    ]

def apply(m, x, y):
    return (m[0]*x+m[1]*y+m[2], m[3]*x+m[4]*y+m[5])

class Interp:
    def __init__(self, objects):
        self.objects = objects
        self.segs = []

    def run(self, tokens, resources, ctm, depth=0):
        if depth > 6: return
        stack = [[ctm[:], 1.0]]
        path = []
        i, n = 0, len(tokens)
        def flush():
            nonlocal path
            if len(path) >= 2:
                ctm_, lw = stack[-1]
                for k in range(len(path)-1):
                    a, b = path[k], path[k+1]
                    p1 = apply(ctm_, a[0], a[1])
                    p2 = apply(ctm_, b[0], b[1])
                    self.segs.append((p1[0], p1[1], p2[0], p2[1], lw))
            path = []
        while i < n:
            t = tokens[i]
            if isinstance(t, float):
                nums = []
                j = i
                while j < n and isinstance(tokens[j], float):
                    nums.append(tokens[j]); j += 1
                op = tokens[j] if j < n else None
                i = j + 1
                if op == b'm' and len(nums) >= 2: path = [(nums[0], nums[1])]
                elif op == b'l' and len(nums) >= 2: path.append((nums[0], nums[1]))
                elif op == b'c' and len(nums) >= 6: path.append((nums[4], nums[5]))
                elif op == b'v' and len(nums) >= 4: path.append((nums[2], nums[3]))
                elif op == b'y' and len(nums) >= 4: path.append((nums[2], nums[3]))
                elif op == b'h':
                    if path: path.append(path[0])
                elif op == b're' and len(nums) >= 4:
                    x, y, w, h = nums[0], nums[1], nums[2], nums[3]
                    ctm_, lw = stack[-1]
                    p1 = apply(ctm_, x, y); p2 = apply(ctm_, x+w, y)
                    p3 = apply(ctm_, x+w, y+h); p4 = apply(ctm_, x, y+h)
                    for a, b in ((p1,p2),(p2,p3),(p3,p4),(p4,p1)):
                        self.segs.append((a[0],a[1],b[0],b[1],lw))
                    path = []
                elif op in (b'S', b's', b'B', b'B*', b'b', b'f', b'F', b'f*', b'n', b'W', b'W*'):
                    flush()
                elif op == b'cm' and len(nums) >= 6:
                    ctm_, lw = stack[-1]
                    stack[-1] = (mat_mul(ctm_, nums[:6]), lw)
                elif op == b'w' and len(nums) >= 1:
                    ctm_, lw = stack[-1]
                    stack[-1] = (ctm_, nums[0])
                elif op == b'Do':
                    pass
            else:
                if t in (b'S', b's', b'B', b'B*', b'b', b'f', b'F', b'f*', b'n', b'W', b'W*'):
                    flush()
                elif t == b'q':
                    ctm_, lw = stack[-1]
                    stack.append((ctm_[:], lw))
                elif t == b'Q':
                    if len(stack) > 1: stack.pop()
                elif t == b'BI':
                    j = i + 1
                    while j < n and tokens[j] != b'ID':
                        j += 1
                    j += 1
                    while j < n and tokens[j] != b'EI':
                        j += 1
                    i = j + 1
                    continue
                elif t == b'Do':
                    # name is previous token
                    name = tokens[i-1] if i > 0 else None
                    if isinstance(name, bytes) and name.startswith(b'/'):
                        ref = resources.get('xobjects', {}).get(name[1:].decode('latin-1'))
                        if ref and ref in self.objects:
                            body = self.objects[ref]
                            if b'/Subtype/Form' in body or b'/Subtype /Form' in body:
                                s = get_stream(body)
                                if s:
                                    mm = re.search(rb'/Matrix\s*\[([\d.\s-]+)\]', body)
                                    mvals = [float(v) for v in mm.group(1).split()] if mm else [1,0,0,1,0,0]
                                    subctm = mat_mul(stack[-1][0], mvals)
                                    subres = get_resources(self.objects, body)
                                    self.run(tokenize(s), subres, subctm, depth+1)
                            elif b'/Subtype/Image' in body or b'/Subtype /Image' in body:
                                pass
                i += 1
        return self.segs

if __name__ == '__main__':
    path = sys.argv[1]
    objects, pages = parse_pdf(path)
    interp = Interp(objects)
    print('pages:', len(pages))
    for idx, (num, body) in enumerate(pages):
        res = get_resources(objects, body)
        mm = re.search(rb'/Contents\s+(\d+)\s+0\s+R', body)
        refs = [int(mm.group(1))] if mm else []
        m2 = re.search(rb'/Contents\s*\[(.*?)\]', body, re.S)
        if m2:
            refs = [int(x) for x in re.findall(rb'(\d+)\s+0\s+R', m2.group(1))]
        before = len(interp.segs)
        for ref in refs:
            if ref in objects:
                s = get_stream(objects[ref])
                if s:
                    interp.run(tokenize(s), res, [1,0,0,0,1,0])
        print('page', idx, 'obj', num, 'streams', len(refs), 'segments', len(interp.segs) - before)
