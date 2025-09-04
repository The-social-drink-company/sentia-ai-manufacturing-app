## Documentation Change Checklist

### Type of Change
- [ ] New documentation
- [ ] Update existing documentation
- [ ] Fix documentation error
- [ ] API documentation update
- [ ] Release notes

### Documentation Metadata
**All documentation must include the following frontmatter:**

- [ ] `owner`: [engineering|finance|operations|admin|support]
- [ ] `lastReviewed`: YYYY-MM-DD (today's date)
- [ ] `role`: [CFO|Manager|Operator|Admin|Developer]
- [ ] `stage`: [beta|ga|deprecated]

### Quality Checks
- [ ] Spell check passed
- [ ] Grammar check passed (Vale)
- [ ] All links verified
- [ ] Screenshots updated (if applicable)
- [ ] Code examples tested
- [ ] MDX components render correctly

### Governance
- [ ] Owner field matches team responsibility
- [ ] Last reviewed date is current
- [ ] Appropriate role badge added
- [ ] Compliance requirements noted (if applicable)

### For API Documentation
- [ ] OpenAPI spec updated
- [ ] Request/response examples provided
- [ ] Authentication requirements documented
- [ ] Rate limits specified
- [ ] Error codes listed

### For Guides
- [ ] Prerequisites clearly stated
- [ ] Step-by-step instructions provided
- [ ] Troubleshooting section included
- [ ] Related documentation linked
- [ ] "What the board cares about" section (CFO guides)

### Screenshots & Media
- [ ] Screenshots follow naming convention: `<area>__<page>__<state>.png`
- [ ] Alt text provided for all images
- [ ] File sizes optimized (<500KB per image)
- [ ] Sensitive data redacted

### Review Requirements
- [ ] Technical review (for API/developer docs)
- [ ] Business review (for CFO/manager guides)
- [ ] Legal review (for compliance docs)

### Testing
- [ ] Documentation builds successfully
- [ ] Search index updated
- [ ] Navigation works correctly
- [ ] Mobile responsive

### Release Notes Entry
```markdown
docs: [brief description of changes]
```

### Additional Context
<!-- Add any additional context about the documentation changes here -->

---

**Note**: This PR template is specifically for documentation changes. For code changes, use the default PR template.