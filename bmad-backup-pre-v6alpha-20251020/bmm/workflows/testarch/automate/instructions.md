# TestArch Automate Workflow - Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmm/workflows/testarch/automate/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow execution</critical>

<workflow>

<step n="1" goal="Load configuration and determine automation mode">
<action>Load the workflow configuration from workflow.yaml</action>
<action>Resolve all config_source variables and paths</action>
<action>Load recommended input documents to understand project context:
  - {project-root}/context/development-standards.md
  - {project-root}/context/security-guidelines.md
  - {project-root}/BMAD-METHOD-V6A-IMPLEMENTATION.md
  - {project-root}/CLAUDE.md
</action>

<ask>Which automation mode do you want to run?
  1. **quick** - Fast unit tests only (~2 min)
  2. **standard** - Unit + integration tests (~5 min)
  3. **full** - All tests + architecture validation (~15 min)
  4. **ci_cd** - Complete suite with coverage reports (~20 min)

Select mode [1-4]:
</ask>

<action>Store the selected automation_mode for use in subsequent steps</action>
<action>Create output directory if it doesn't exist: {test_output_folder}</action>
</step>

<step n="2" goal="Analyze current codebase state">
<action>Scan the project structure to identify:
  - All test files in {test_directory}
  - All source files in {src_directory}, {server_directory}, {services_directory}
  - Configuration files (package.json, vite.config.js, vitest.config.js)
  - Test framework setup and dependencies
</action>

<action>Generate a baseline report showing:
  - Total files vs files with tests
  - Estimated test coverage areas
  - Known testing gaps from BMAD documentation
</action>

<action>Display summary to {user_name}:
  - Total source files: X
  - Total test files: Y
  - Coverage ratio: Z%
  - Critical gaps identified: [list]
</action>
</step>

<step n="3" goal="Run automated tests" if="automation_mode != 'architecture-only'">
<action>Based on selected mode, execute appropriate test suites:</action>

<check if="automation_mode == 'quick'">
  <action>Run unit tests only: `pnpm vitest run --reporter=verbose`</action>
</check>

<check if="automation_mode == 'standard'">
  <action>Run unit tests: `pnpm vitest run --reporter=verbose`</action>
  <action>Run integration tests if they exist</action>
</check>

<check if="automation_mode == 'full' or automation_mode == 'ci_cd'">
  <action>Run complete test suite: `pnpm vitest run --coverage --reporter=verbose`</action>
  <action>Run E2E tests if configured: `pnpm playwright test`</action>
  <action>Generate coverage report</action>
</check>

<action>Capture test results including:
  - Total tests executed
  - Passed/Failed/Skipped counts
  - Execution time
  - Any error messages or stack traces
</action>

<action>Parse test output and identify:
  - ✅ All passing tests
  - ❌ Failed tests with reasons
  - ⚠️ Skipped or pending tests
  - 🐌 Slow tests (>1s execution time)
</action>
</step>

<step n="4" goal="Validate architecture compliance">
<action>Perform architecture validation checks based on rules defined in workflow.yaml</action>

<substep n="4a" goal="Check for mock data violations">
<action>Search production code for mock data patterns:
  - Hard-coded sample data
  - Math.random() in production files
  - faker.js usage outside test files
  - Commented "TODO: replace with real data"
</action>
<action>Report any violations found with file paths and line numbers</action>
</substep>

<substep n="4b" goal="Validate API error handling">
<action>Scan all API service files in {services_directory} and {server_directory}</action>
<action>Check that each API call has:
  - try/catch blocks or .catch() handlers
  - Proper error logging
  - User-facing error messages
  - No exposed stack traces in production
</action>
<action>List any services missing proper error handling</action>
</substep>

<substep n="4c" goal="Check TypeScript/JSDoc compliance">
<action>Verify that all source files have proper type definitions:
  - .ts/.tsx files use TypeScript types
  - .js/.jsx files have JSDoc comments for functions
  - Exported functions have documented parameters and return types
</action>
<action>Report files missing type documentation</action>
</substep>

<substep n="4d" goal="Validate external integration fallbacks">
<action>Check external integration services (Xero, Shopify, Amazon SP-API, Unleashed)</action>
<action>Ensure each integration has:
  - Graceful fallback when API is unavailable
  - Proper timeout handling
  - Rate limiting compliance
  - Authentication error handling
</action>
<action>Report any integrations missing fallback mechanisms</action>
</substep>
</step>

<step n="5" goal="Generate comprehensive test report">
<action>Compile all test results and architecture validation findings into a comprehensive report</action>

<action>Structure the report with these sections:

## Test Execution Summary
- Date: {date}
- Mode: {{automation_mode}}
- Duration: {{total_execution_time}}
- Overall Status: ✅ PASS / ❌ FAIL

## Test Results
### Unit Tests
- Total: {{unit_test_count}}
- Passed: {{unit_passed}}
- Failed: {{unit_failed}}
- Skipped: {{unit_skipped}}

### Integration Tests
- Total: {{integration_test_count}}
- Passed: {{integration_passed}}
- Failed: {{integration_failed}}

### E2E Tests (if run)
- Total: {{e2e_test_count}}
- Passed: {{e2e_passed}}
- Failed: {{e2e_failed}}

## Architecture Validation
### Mock Data Compliance
- Violations Found: {{mock_data_violations_count}}
- Files Affected: [list]

### API Error Handling
- Services Checked: {{services_checked}}
- Services Compliant: {{services_compliant}}
- Services Needing Fixes: [list]

### Type Documentation
- Files Checked: {{files_checked}}
- Files Compliant: {{files_with_types}}
- Files Missing Types: [list]

### External Integration Fallbacks
- Integrations Checked: [Xero, Shopify, Amazon, Unleashed]
- Compliant: [list]
- Needs Fallback Logic: [list]

## Coverage Report (if run)
- Overall Coverage: {{coverage_percentage}}%
- Lines Covered: {{lines_covered}} / {{total_lines}}
- Branches Covered: {{branches_covered}} / {{total_branches}}
- Functions Covered: {{functions_covered}} / {{total_functions}}

## Failed Tests Details
[For each failed test, include:
  - Test name
  - File path
  - Error message
  - Stack trace
  - Recommended fix
]

## Recommended Actions
[Prioritized list of fixes needed based on:
  1. Critical: Security issues, production bugs
  2. High: Missing error handling, type safety
  3. Medium: Coverage gaps, architecture violations
  4. Low: Code quality improvements
]

## Next Steps
[Specific actionable items for {user_name}]
</action>

<action>Write the report to: {test_report_file}</action>
<action>Display report summary to {user_name}</action>
</step>

<step n="6" goal="Generate coverage report" if="automation_mode == 'ci_cd'">
<action>Create detailed coverage analysis report</action>
<action>Identify critical uncovered code paths:
  - User authentication flows
  - Financial calculations
  - Data validation logic
  - API integration points
</action>
<action>Write coverage report to: {coverage_report_file}</action>
</step>

<step n="7" goal="Update BMAD documentation with findings">
<action>Update {project-root}/BMAD_UPDATE_QUEUE.md with any new gaps discovered</action>
<action>If architecture violations found, add tasks to BMAD stories backlog</action>
<action>Update {project-root}/BMAD-METHOD-V6A-IMPLEMENTATION.md metrics:
  - Test coverage percentage
  - Architecture compliance status
  - Number of mock data violations remaining
</action>
</step>

<step n="8" goal="Provide summary and recommendations">
<action>Display final summary to {user_name} in {communication_language}:</action>

<action>
**TestArch Automation Complete**

📊 **Test Execution**: {{overall_status}}
- Tests Run: {{total_tests}}
- Pass Rate: {{pass_percentage}}%
- Duration: {{execution_time}}

🏗️ **Architecture Compliance**: {{architecture_status}}
- Mock Data: {{mock_data_status}}
- Error Handling: {{error_handling_status}}
- Type Safety: {{type_safety_status}}
- API Fallbacks: {{fallback_status}}

📈 **Coverage**: {{coverage_percentage}}%

📝 **Reports Generated**:
- Test Report: {test_report_file}
- Coverage Report: {coverage_report_file} (if run)

🎯 **Priority Actions**:
[Top 3-5 critical actions needed]

✅ **Ready for**:
- [ ] Code review
- [ ] Deployment to test environment
- [ ] Production deployment (if all green)
</action>

<ask>Do you want to:
  1. View detailed failed test analysis
  2. Generate BMAD stories for fixing issues
  3. Re-run tests after fixes
  4. Exit workflow

Select option [1-4]:
</ask>

<check if="user_response == '2'">
  <action>For each critical issue found, generate a BMAD story using:
    bmad sm create-story --title "Fix [issue]" --priority high
  </action>
  <action>Add stories to backlog in {project-root}/bmad/stories/</action>
</check>

<check if="user_response == '3'">
  <goto step="3">Re-run tests</goto>
</check>
</step>

</workflow>
