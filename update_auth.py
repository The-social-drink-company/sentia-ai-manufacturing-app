from pathlib import Path
path = Path('src/providers/AuthProvider.jsx')
text = path.read_text()
text = text.replace('const AuthContext = createContext(null)\n\nconst shouldForceMock', "const AuthContext = createContext(null)\n\nconst isBrowser = typeof window !== 'undefined' and typeof window.localStorage !== 'undefined'\n\nconst shouldForceMock")
text = text.replace('function loadStoredUser() {\n  try {', "function loadStoredUser() {\n  if (!isBrowser):\n    return None\n\n  try {")
