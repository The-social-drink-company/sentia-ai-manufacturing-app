# Pre-Deployment Verification

Perform comprehensive pre-deployment verification for the Sentia Manufacturing Dashboard.

## Tasks to Execute

1. **Environment Verification**
   - Check Node.js version (must be 18+)
   - Verify pnpm installation and version
   - Confirm git status and current branch
   - Verify we're on the development branch

2. **Dependency Check**
   - Run `pnpm install` to ensure all dependencies are current
   - Check for any outdated critical dependencies
   - Verify no security vulnerabilities with `pnpm audit`
   - List any peer dependency warnings

3. **Code Quality Checks**
   - Run `npm run lint` and report current error count
   - If errors exist, categorize them (critical vs warnings)
   - Check for any TypeScript errors if applicable

4. **Build Verification**
   - Run `npm run build` to ensure production build succeeds
   - Report build size and any warnings
   - Verify build output in dist/ directory

5. **Environment Variables**
   - Check that required environment variables are documented
   - Verify .env.template exists and is up to date
   - List any missing environment variables for Render deployment

6. **Git Status**
   - Check for uncommitted changes
   - Verify branch is up to date with origin
   - Show last 3 commits

## Output Format

Provide a structured report with:
- ✅ PASS or ❌ FAIL for each category
- Summary of any issues found
- Recommended actions if problems detected
- Overall deployment readiness score

Execute all checks and provide a comprehensive status report.
