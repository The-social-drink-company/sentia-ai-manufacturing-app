# Code Review Guidelines

## Purpose

This document establishes enterprise-level code review standards for the Sentia Manufacturing Dashboard to ensure code quality, security, and maintainability.

## Review Process

### 1. Pre-Review Checklist (Author)

Before requesting a review:

- [ ] Code compiles without warnings
- [ ] All tests pass locally
- [ ] ESLint shows no errors
- [ ] PR template completed
- [ ] Self-review performed
- [ ] Branch is up-to-date with target

### 2. Review Timeline

| PR Type           | Target Response Time | Max Review Time |
| ----------------- | -------------------- | --------------- |
| Hotfix (Critical) | 30 minutes           | 1 hour          |
| Hotfix (High)     | 2 hours              | 4 hours         |
| Feature/Bugfix    | 4 hours              | 24 hours        |
| Documentation     | 24 hours             | 48 hours        |

### 3. Reviewer Responsibilities

#### Primary Reviewer

- Thorough code review
- Test functionality locally
- Verify requirements met
- Check for edge cases

#### Secondary Reviewer (Production PRs)

- Security review
- Performance impact assessment
- Breaking change evaluation
- Deployment risk assessment

## Review Criteria

### Code Quality

#### Structure & Design

- [ ] Code follows SOLID principles
- [ ] No code duplication (DRY)
- [ ] Clear separation of concerns
- [ ] Appropriate design patterns used
- [ ] Modular and reusable components

#### Readability

- [ ] Clear variable/function names
- [ ] Consistent naming conventions
- [ ] Adequate comments for complex logic
- [ ] No commented-out code
- [ ] No console.log statements

#### Best Practices

- [ ] Error handling implemented
- [ ] Input validation present
- [ ] Defensive programming used
- [ ] Resources properly cleaned up
- [ ] No magic numbers/strings

### Security Review

#### Authentication & Authorization

- [ ] Proper authentication checks
- [ ] Role-based access control enforced
- [ ] Session management secure
- [ ] JWT tokens handled safely

#### Data Security

- [ ] No hardcoded credentials
- [ ] Sensitive data encrypted
- [ ] SQL injection prevention
- [ ] XSS protection implemented
- [ ] CSRF tokens used

#### API Security

- [ ] Rate limiting considered
- [ ] Input sanitization
- [ ] Output encoding
- [ ] CORS configured properly

### Performance Review

#### Frontend Performance

- [ ] Lazy loading implemented
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] No memory leaks
- [ ] React re-renders minimized

#### Backend Performance

- [ ] Database queries optimized
- [ ] N+1 queries avoided
- [ ] Caching implemented where appropriate
- [ ] API response times acceptable
- [ ] Resource usage efficient

### Testing Review

#### Test Coverage

- [ ] Unit tests present
- [ ] Integration tests included
- [ ] Edge cases tested
- [ ] Error scenarios covered
- [ ] Coverage > 80% for critical code

#### Test Quality

- [ ] Tests are meaningful
- [ ] Tests are isolated
- [ ] Tests are deterministic
- [ ] Mock data realistic
- [ ] Tests follow AAA pattern

### Documentation Review

#### Code Documentation

- [ ] JSDoc for public functions
- [ ] Complex algorithms explained
- [ ] API endpoints documented
- [ ] Configuration documented

#### Project Documentation

- [ ] README updated if needed
- [ ] API docs updated
- [ ] Environment variables documented
- [ ] Breaking changes noted

## Review Comments

### Effective Comments

#### Good Examples

```
"Consider extracting this logic into a separate utility function for reusability"
"This could cause a race condition when multiple users update simultaneously"
"Using useMemo here would prevent unnecessary re-renders"
```

#### Poor Examples

```
"This is wrong"
"Bad code"
"Fix this"
```

### Comment Categories

Use prefixes to categorize comments:

- **[MUST]**: Blocking issue that must be fixed
- **[SHOULD]**: Strong recommendation
- **[CONSIDER]**: Suggestion for improvement
- **[QUESTION]**: Clarification needed
- **[PRAISE]**: Positive feedback

## Approval Criteria

### Can Approve

- All [MUST] items addressed
- No security vulnerabilities
- Tests passing
- Build successful
- Documentation complete

### Should Not Approve

- Failing tests
- Security issues present
- Breaking changes without migration plan
- Significant performance regression
- Missing critical documentation

## Special Scenarios

### Hotfix Reviews

For critical production issues:

1. Focus on the specific fix
2. Verify no additional changes
3. Ensure rollback possible
4. Fast-track approval process

### Large PRs

For PRs > 500 lines:

1. Consider splitting into smaller PRs
2. Review in multiple sessions
3. Focus on architecture first
4. Detail review second pass

### Breaking Changes

For breaking changes:

1. Migration plan required
2. Backward compatibility considered
3. Documentation updated
4. Stakeholders notified

## Tools & Automation

### Automated Checks

- ESLint for code style
- npm audit for security
- Jest for testing
- Bundle analyzer for size

### Review Tools

- GitHub PR interface
- VS Code GitHub Pull Requests extension
- Local checkout for testing

## Review Etiquette

### Do's

- Be constructive and specific
- Provide code examples
- Acknowledge good practices
- Ask questions when unsure
- Respond promptly

### Don'ts

- Make personal attacks
- Nitpick minor style issues
- Approve without reviewing
- Block without justification
- Ignore reviewer comments

## Escalation Process

If consensus cannot be reached:

1. **Technical Disagreement**: Tech lead makes final decision
2. **Business Impact**: Product owner consulted
3. **Security Concern**: Security team involved
4. **Performance Issue**: Performance testing required

## Metrics & Improvement

Track and review monthly:

- Average review time
- Number of review cycles
- Defect escape rate
- Review effectiveness

## Quick Reference

### Review Checklist

```markdown
## Code Review Checklist

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error handling appropriate

### Quality

- [ ] Follows coding standards
- [ ] No code duplication
- [ ] Well-structured

### Security

- [ ] No vulnerabilities introduced
- [ ] Authentication/authorization correct
- [ ] Input validation present

### Performance

- [ ] No performance regressions
- [ ] Efficient algorithms used
- [ ] Database queries optimized

### Testing

- [ ] Tests included and passing
- [ ] Edge cases tested
- [ ] Coverage adequate

### Documentation

- [ ] Code documented
- [ ] API docs updated
- [ ] README updated if needed
```

## Training Resources

- [Google's Code Review Guidelines](https://google.github.io/eng-practices/review/)
- [Best Practices for Code Review](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)
- Internal training sessions (monthly)

---

**Remember**: Code reviews are about improving code quality and sharing knowledge, not about finding fault. Be kind, be thorough, and be constructive.
