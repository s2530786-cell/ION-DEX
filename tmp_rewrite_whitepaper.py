from pathlib import Path
from subprocess import run
from datetime import datetime
p = Path(r'D:/openclaw-tools/ion-dex-nuke/docs/WHITEPAPER.md')
orig = p.read_bytes()
print('before_bom', orig.startswith(bytes([0xEF,0xBB,0xBF])), 'size', len(orig), 'mtime', datetime.fromtimestamp(p.stat().st_mtime).isoformat())
text = p.read_text(encoding='utf-8-sig')
p.write_text(text, encoding='utf-8', newline='\n')
new = p.read_bytes()
print('after_bom', new.startswith(bytes([0xEF,0xBB,0xBF])), 'size', len(new), 'mtime', datetime.fromtimestamp(p.stat().st_mtime).isoformat())
