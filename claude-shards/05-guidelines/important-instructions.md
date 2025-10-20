# Important Instructions

**Last Updated**: October 20, 2025
**Category**: Guidelines
**Related Shards**: [../04-deployment/critical-deployment-rules.md](../04-deployment/critical-deployment-rules.md)

## Performance and Testing

**See**: `context/performance-testing.md` for optimization guidelines including:
- Build performance metrics
- Memory management strategies
- Testing infrastructure setup
- API integration status

## 🚨 Critical Rules

### GIT DEPLOYMENT RULE

**MANDATORY**: Claude must NEVER automatically commit, push, or create pull requests to `test` or `production` branches without explicit user instruction. Only work in `main` branch unless specifically told otherwise.

### Development Standards

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) unless explicitly requested

### Code Style

- IMPORTANT: DO NOT ADD ***ANY*** COMMENTS unless asked
- Follow existing code conventions in the codebase
- Use existing libraries and utilities
- Check package.json before assuming libraries are available

### Security

- Never introduce code that exposes or logs secrets and keys
- Never commit secrets or keys to the repository
- Always follow security best practices

---

[← Previous: Security](./security.md) | [Back to Main →](../../CLAUDE.md)