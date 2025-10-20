from pathlib import Path

def apply_replacements(root: Path, replacements):
    if not root.exists():
        return
    for path in root.rglob('*'):
        if not path.is_file() or path.is_symlink():
            continue
        try:
            data = path.read_text(encoding='utf-8')
        except Exception:
            continue
        original = data
        for old, new in replacements:
            data = data.replace(old, new)
        data = data.replace('Capliquify', 'CapLiquify')
        if data != original:
            path.write_text(data, encoding='utf-8')

replacements = [
    ('Sentia Manufacturing MCP Server', 'CapLiquify MCP Server'),
    ('CapLiquify Manufacturing Platform', 'CapLiquify Manufacturing Platform'),
    ('Sentia Manufacturing', 'CapLiquify Platform'),
]

dirs = [
    Path('services'),
    Path('api'),
    Path('config'),
    Path('scripts'),
    Path('context'),
    Path('docs'),
    Path('analysis'),
    Path('bmad'),
    Path('prisma'),
    Path('sentia-mcp-server'),
]

for directory in dirs:
    apply_replacements(directory, replacements)

