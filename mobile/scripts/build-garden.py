"""Convert the supplied SVG into offline React Native SVG data (no DOM/SMIL)."""
from pathlib import Path
import xml.etree.ElementTree as ET
import json, subprocess
root = Path(__file__).resolve().parent.parent
svg = ET.parse(root / 'assets/garden/source.svg').getroot()
paths = []
rename = {'stroke-width':'strokeWidth', 'stroke-linecap':'strokeLinecap', 'stroke-linejoin':'strokeLinejoin', 'fill-rule':'fillRule', 'stroke-dasharray':'strokeDasharray', 'stroke-dashoffset':'strokeDashoffset'}
numeric = {'cx','cy','r','rx','ry','opacity','strokeWidth','strokeDashoffset'}
def convert(el):
    tag = el.tag.split('}')[-1]
    if tag not in ['g','path','circle','ellipse']: return None
    props = {}
    for k,v in el.attrib.items():
        if k.startswith('data-') or k.startswith('aria-') or k == 'pathLength': continue
        k = rename.get(k,k)
        props[k] = float(v) if k in numeric else v
    node = {'tag':tag, 'props':props}
    children = [n for child in el if (n := convert(child)) is not None]
    if children: node['children'] = children
    if 'data-kind' in el.attrib:
        node['track'] = {k.replace('data-',''):float(v) if k != 'data-kind' else v for k,v in el.attrib.items() if k.startswith('data-') and k != 'data-key'}
        if tag == 'path': paths.append(node)
    return node
nodes = [n for child in svg if (n := convert(child)) is not None]
lengths = json.loads(subprocess.check_output(['node','-e', "const {svgPathProperties}=require('svg-path-properties');let s='';process.stdin.on('data',c=>s+=c).on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(s).map(d=>new svgPathProperties(d).getTotalLength()))));"],input=json.dumps([n['props']['d'] for n in paths]).encode(),cwd=root))
for node, length in zip(paths,lengths):
    # react-native-svg does not implement SVG pathLength normalization on native.
    node['track']['length'] = length
    node['props']['strokeDasharray'] = [length,length]
    node['props']['strokeDashoffset'] = length
(root/'src/gardenArtwork.json').write_text(json.dumps(nodes,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'Garden converted: {len(paths)} drawn paths; native lengths baked in.')
