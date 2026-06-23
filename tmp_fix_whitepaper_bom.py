from pathlib import Path
p = Path(r'D:/openclaw-tools/ion-dex-nuke/docs/WHITEPAPER.md')
text = p.read_text(encoding='utf-8-sig')
p.write_text(text, encoding='utf-8', newline='\n')
print('rewritten', p)
