from pathlib import Path
text = Path('src/pages/Dashboard.jsx').read_text()
start = text.find(": '")
segment = text[start + 3:start + 6]
print([ord(ch) for ch in segment])
