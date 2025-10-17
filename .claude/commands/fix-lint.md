# Fix ESLint Errors

Systematically identify and fix ESLint errors in the codebase.

## Objective

Reduce ESLint errors and warnings to improve code quality without breaking functionality.

## Process

### 1. Analysis Phase

Run lint and analyze errors:
```bash
npm run lint 2>&1 | tee lint-output.txt
```

Categorize errors by:
- **Critical**: Will cause runtime errors (e.g., undefined variables, React Hook violations)
- **High**: Bad practices that could cause bugs (e.g., unused imports, case declarations)
- **Medium**: Code quality issues (e.g., unused variables)
- **Low**: Style warnings (e.g., fast-refresh warnings)

Provide summary:
```
📊 Lint Error Analysis

Total Problems: X (Y errors, Z warnings)

Critical (fix immediately): X
- 'process' is not defined: X occurrences
- React Hooks violations: X occurrences

High (fix this session): X
- Unused imports: X occurrences
- Case declarations: X occurrences

Medium (can defer): X
- Unused variables: X occurrences

Low (warnings only): X
- Fast-refresh warnings: X occurrences
```

### 2. Systematic Fixing

**Fix in Priority Order:**

1. **Critical Errors First**
   - Fix `process` undefined errors (convert to `import.meta.env`)
   - Fix React Hooks violations
   - Fix undefined variable references

2. **High Priority Errors**
   - Remove unused imports
   - Fix case declarations in switch statements
   - Fix parsing errors

3. **Medium Priority Errors**
   - Remove unused variables (if safe)
   - Add ESLint disable comments for intentional unused vars
   - Fix exhaustive-deps warnings with careful analysis

4. **Low Priority Warnings**
   - Document but don't necessarily fix
   - These can be addressed in dedicated cleanup

### 3. Verification After Each Batch

After fixing each category:
```bash
npm run lint 2>&1 | grep "✖"
```

Show progress:
```
Progress Report:
- Started with: X problems
- Fixed: Y problems
- Remaining: Z problems
- Improvement: N%
```

## Safety Guidelines

1. **Never Break Functionality**
   - Test affected components after fixes
   - Don't remove code that appears unused but isn't
   - Be careful with useEffect dependencies

2. **Preserve Intentional Patterns**
   - Some unused params are intentional (e.g., placeholder functions)
   - Some eslint-disable comments are necessary
   - Server-side files need special handling

3. **Use Proper Patterns**
   - Prefix unused params with underscore: `_param`
   - Add `/* eslint-env node */` for server files
   - Use `// eslint-disable-next-line` sparingly with comments

## Auto-Fix

First try auto-fix for safe corrections:
```bash
npm run lint -- --fix
```

Report what was auto-fixed and what remains.

## Manual Fixes

For errors requiring manual intervention:
1. Show the error context
2. Explain the issue
3. Propose a fix
4. Apply the fix
5. Verify it works

## Output Format

```
🔧 ESLint Fix Session

📊 Initial State: X problems (Y errors, Z warnings)

✅ Fixed in This Session:
1. Critical Errors: X fixed
   - process.env → import.meta.env: X files
   - React Hooks violations: X files

2. High Priority: X fixed
   - Unused imports removed: X files
   - Case declarations: X files

3. Medium Priority: X fixed
   - Unused variables: X fixes

📊 Final State: X problems (Y errors, Z warnings)

📈 Improvement: N% (X problems fixed)

✅ All Changes Safe: No functionality broken

🔄 Next Steps:
- Commit these fixes
- Remaining X problems can be addressed later
- No blocking issues remain
```

## Commit Message Template

After successful fixes, provide:
```
fix: resolve N ESLint errors (X→Y problems)

Major ESLint fixes:
- Fixed X critical errors
- Removed Y unused imports
- Fixed Z code quality issues

Results:
- Before: X problems (Y errors, Z warnings)
- After: A problems (B errors, C warnings)
- Fixed: N errors (M% improvement)
```

Execute the lint fix process systematically and safely.
