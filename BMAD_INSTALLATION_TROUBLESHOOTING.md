# BMAD Method Installation Troubleshooting

## Issue: Cannot Install BMAD CLI

If you're seeing errors like:
```
npm error code EEXIST
npm error path C:\npm-global\bmad.cmd
npm error EEXIST: file already exists
```

Or permission errors on Windows.

---

## Solution Options

### **Option 1: Use Manual Analysis Instead (RECOMMENDED)**

The BMAD Method can be applied manually without requiring the CLI installation.

📖 **Follow this guide instead**: [MANUAL_CODEBASE_ANALYSIS.md](MANUAL_CODEBASE_ANALYSIS.md)

**Advantages**:
- ✅ No installation required
- ✅ No permission issues
- ✅ Works perfectly on Windows
- ✅ Uses Claude Code directly
- ✅ More flexible and customizable
- ✅ Same results as CLI approach

**Time**: 6-10 hours with Claude Code's help (vs days doing it alone)

---

### **Option 2: Fix BMAD CLI Installation**

If the CLI package actually exists and you want to install it:

#### Windows PowerShell (Run as Administrator)

```powershell
# 1. Run PowerShell as Administrator
# Right-click PowerShell → "Run as Administrator"

# 2. Remove existing installation
npm uninstall -g bmad-method

# 3. Clear npm cache
npm cache clean --force

# 4. Remove leftover files
Remove-Item -Path "C:\npm-global\bmad.cmd" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\npm-global\bmad.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\npm-global\node_modules\bmad-method" -Recurse -Force -ErrorAction SilentlyContinue

# 5. Install fresh
npm install -g bmad-method --force

# 6. Verify
bmad --version
```

#### If Still Failing

The package might not be publicly available yet. The BMAD Method documentation exists at:
- https://github.com/bmad-code-org/BMAD-METHOD

But the npm package might still be in private development.

---

### **Option 3: Verify Package Exists**

Check if the package is actually available:

```bash
# Search npm registry
npm search bmad-method

# Or try to view package info
npm view bmad-method
```

If you get "npm ERR! 404 Not Found", the package isn't published yet.

---

## Recommendation

**Use the Manual Analysis Guide**: [MANUAL_CODEBASE_ANALYSIS.md](MANUAL_CODEBASE_ANALYSIS.md)

This guide:
1. Achieves the same goals as BMAD CLI
2. Uses Claude Code (already working)
3. No installation required
4. No Windows permission issues
5. More hands-on learning experience

---

## Quick Start with Manual Approach

```powershell
# 1. Create analysis directory
cd C:\Projects\The-social-drink-companysentia-ai-manufacturing-app\sentia-ai-manufacturing-app
mkdir analysis
mkdir analysis\stories

# 2. Open the manual guide
code MANUAL_CODEBASE_ANALYSIS.md

# 3. Ask Claude Code to start Phase 1
# In Claude Code chat window, say:
# "Let's start Phase 1 of the manual codebase analysis"
```

Claude Code will help you through each phase, doing most of the heavy lifting!

---

## Support

If you want to use the BMAD CLI approach and need the actual tool:
- Check: https://github.com/bmad-code-org/BMAD-METHOD
- File an issue if CLI isn't available
- Ask about installation instructions

---

**Bottom line**: You don't need the CLI to do the analysis. The manual approach with Claude Code works great! 🚀
