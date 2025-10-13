/**
 * Advanced Security Testing - Authorization
 * Comprehensive security tests for authorization and access control
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { McpServer } from '../../src/server.js';
import '../utils/custom-matchers.js';

describe('Authorization Security Tests', () => {
  let server;
  let testUsers;
  let testResources;

  beforeAll(async () => {
    server = new McpServer({
      environment: 'test',
      security: {
        enableRBAC: true,
        enableABAC: true,
        strictPermissions: true
      }
    });
    
    await server.initialize();
    
    // Set up test users with different roles and permissions
    testUsers = {
      admin: {
        id: 'admin_001',
        role: 'admin',
        permissions: [
          'read:all', 'write:all', 'delete:all',
          'admin:users', 'admin:system', 'admin:security'
        ]
      },
      manager: {
        id: 'manager_001',
        role: 'manager', 
        permissions: [
          'read:manufacturing', 'write:manufacturing',
          'read:financial', 'write:financial',
          'read:inventory', 'write:inventory'
        ]
      },
      operator: {
        id: 'operator_001',
        role: 'operator',
        permissions: [
          'read:manufacturing', 'write:quality',
          'read:inventory'
        ]
      },
      viewer: {
        id: 'viewer_001',
        role: 'viewer',
        permissions: ['read:basic']
      },
      contractor: {
        id: 'contractor_001',
        role: 'contractor',
        permissions: ['read:projects'],
        attributes: {
          department: 'external',
          clearance_level: 'basic',
          project_access: ['PROJECT-001', 'PROJECT-002']
        }
      }
    };

    testResources = {
      financial_reports: {
        id: 'financial_001',
        type: 'financial_report',
        sensitivity: 'confidential',
        owner: 'manager_001',
        department: 'finance'
      },
      manufacturing_data: {
        id: 'manufacturing_001',
        type: 'manufacturing_data',
        sensitivity: 'internal',
        owner: 'operator_001',
        department: 'manufacturing'
      },
      system_config: {
        id: 'system_001',
        type: 'system_configuration',
        sensitivity: 'restricted',
        owner: 'admin_001',
        department: 'it'
      },
      project_data: {
        id: 'project_001',
        type: 'project_data',
        sensitivity: 'internal',
        project_id: 'PROJECT-001',
        department: 'engineering'
      }
    };
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  beforeEach(async () => {
    await server.resetAuthorizationState();
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should enforce role-based permissions correctly', async () => {
      const testCases = [
        {
          user: testUsers.admin,
          resource: testResources.system_config,
          action: 'read',
          expected: true
        },
        {
          user: testUsers.admin,
          resource: testResources.financial_reports,
          action: 'write',
          expected: true
        },
        {
          user: testUsers.manager,
          resource: testResources.financial_reports,
          action: 'read',
          expected: true
        },
        {
          user: testUsers.manager,
          resource: testResources.system_config,
          action: 'read',
          expected: false
        },
        {
          user: testUsers.operator,
          resource: testResources.manufacturing_data,
          action: 'read',
          expected: true
        },
        {
          user: testUsers.operator,
          resource: testResources.financial_reports,
          action: 'read',
          expected: false
        },
        {
          user: testUsers.viewer,
          resource: testResources.manufacturing_data,
          action: 'write',
          expected: false
        },
        {
          user: testUsers.viewer,
          resource: testResources.manufacturing_data,
          action: 'read',
          expected: false // Viewer only has basic read access
        }
      ];

      for (const testCase of testCases) {
        const authorizationResponse = await server.callTool('auth_check_permission', {
          user_id: testCase.user.id,
          resource_id: testCase.resource.id,
          action: testCase.action,
          context: {
            resource_type: testCase.resource.type,
            user_role: testCase.user.role
          }
        });

        expect(authorizationResponse).toBeValidMcpToolResponse();
        expect(authorizationResponse.data.authorized).toBe(testCase.expected);

        if (!testCase.expected) {
          expect(authorizationResponse.data).toHaveProperty('reason');
          expect(authorizationResponse.data.reason).toMatch(/permission|role|access/i);
        }
      }
    });

    it('should prevent privilege escalation attempts', async () => {
      // Attempt to access admin functions as manager
      const escalationAttempts = [
        {
          user: testUsers.manager,
          action: 'admin:create_user',
          resource: 'system'
        },
        {
          user: testUsers.operator,
          action: 'admin:modify_permissions',
          resource: 'system'
        },
        {
          user: testUsers.viewer,
          action: 'write:financial',
          resource: testResources.financial_reports.id
        }
      ];

      for (const attempt of escalationAttempts) {
        const escalationResponse = await server.callTool('auth_check_permission', {
          user_id: attempt.user.id,
          resource_id: attempt.resource,
          action: attempt.action
        });

        expect(escalationResponse.data.authorized).toBe(false);
        expect(escalationResponse.data.security_violation).toBe(true);
        expect(escalationResponse.data.violation_type).toBe('privilege_escalation');
      }
    });

    it('should handle role inheritance properly', async () => {
      // Create hierarchical roles
      const hierarchyTest = await server.callTool('auth_create_role_hierarchy', {
        roles: {
          'super_admin': {
            inherits: ['admin'],
            additional_permissions: ['system:emergency_access']
          },
          'admin': {
            inherits: ['manager'],
            additional_permissions: ['admin:users', 'admin:system']
          },
          'manager': {
            inherits: ['operator'],
            additional_permissions: ['write:financial', 'read:reports']
          },
          'operator': {
            inherits: ['viewer'],
            additional_permissions: ['write:quality', 'read:manufacturing']
          },
          'viewer': {
            inherits: [],
            additional_permissions: ['read:basic']
          }
        }
      });

      expect(hierarchyTest).toBeValidMcpToolResponse();

      // Test that manager inherits operator permissions
      const inheritanceTest = await server.callTool('auth_check_permission', {
        user_id: testUsers.manager.id,
        resource_id: testResources.manufacturing_data.id,
        action: 'read', // Should inherit from operator
        check_inheritance: true
      });

      expect(inheritanceTest.data.authorized).toBe(true);
      expect(inheritanceTest.data.permission_source).toBe('inherited');
    });

    it('should implement time-based access controls', async () => {
      // Create temporary elevated permissions
      const temporaryAccessResponse = await server.callTool('auth_grant_temporary_access', {
        user_id: testUsers.operator.id,
        resource_id: testResources.financial_reports.id,
        action: 'read',
        duration_minutes: 1,
        reason: 'Emergency financial review'
      });

      expect(temporaryAccessResponse).toBeValidMcpToolResponse();
      expect(temporaryAccessResponse.data.granted).toBe(true);

      // Should have access temporarily
      const temporaryCheck = await server.callTool('auth_check_permission', {
        user_id: testUsers.operator.id,
        resource_id: testResources.financial_reports.id,
        action: 'read'
      });

      expect(temporaryCheck.data.authorized).toBe(true);
      expect(temporaryCheck.data.access_type).toBe('temporary');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 65000)); // 65 seconds

      // Should no longer have access
      const expiredCheck = await server.callTool('auth_check_permission', {
        user_id: testUsers.operator.id,
        resource_id: testResources.financial_reports.id,
        action: 'read'
      });

      expect(expiredCheck.data.authorized).toBe(false);
    }, 70000); // Extended timeout for expiration test
  });

  describe('Attribute-Based Access Control (ABAC)', () => {
    it('should enforce attribute-based policies', async () => {
      // Test department-based access
      const departmentAccessTest = await server.callTool('auth_check_permission', {
        user_id: testUsers.contractor.id,
        resource_id: testResources.project_data.id,
        action: 'read',
        context: {
          user_attributes: testUsers.contractor.attributes,
          resource_attributes: {
            project_id: 'PROJECT-001',
            department: 'engineering'
          }
        }
      });

      expect(departmentAccessTest.data.authorized).toBe(true);
      expect(departmentAccessTest.data.policy_matched).toBe('project_access_policy');

      // Test access to unauthorized project
      const unauthorizedProjectTest = await server.callTool('auth_check_permission', {
        user_id: testUsers.contractor.id,
        resource_id: 'project_003',
        action: 'read',
        context: {
          user_attributes: testUsers.contractor.attributes,
          resource_attributes: {
            project_id: 'PROJECT-003',
            department: 'engineering'
          }
        }
      });

      expect(unauthorizedProjectTest.data.authorized).toBe(false);
      expect(unauthorizedProjectTest.data.reason).toMatch(/project access/i);
    });

    it('should handle complex attribute combinations', async () => {
      // Create complex policy with multiple attributes
      const complexPolicyResponse = await server.callTool('auth_create_abac_policy', {
        name: 'sensitive_financial_access',
        effect: 'allow',
        condition: {
          and: [
            { 'user.role': { in: ['manager', 'admin'] } },
            { 'user.department': { equals: 'finance' } },
            { 'resource.sensitivity': { not_equals: 'restricted' } },
            { 'context.time': { between: ['09:00', '17:00'] } },
            { 'context.location': { in: ['office', 'secure_remote'] } }
          ]
        },
        resources: ['financial_reports', 'budgets', 'forecasts'],
        actions: ['read', 'write']
      });

      expect(complexPolicyResponse).toBeValidMcpToolResponse();

      // Test policy evaluation with various attribute combinations
      const policyTests = [
        {
          user_attributes: {
            role: 'manager',
            department: 'finance'
          },
          resource_attributes: {
            type: 'financial_reports',
            sensitivity: 'confidential'
          },
          context: {
            time: '14:30',
            location: 'office'
          },
          expected: true
        },
        {
          user_attributes: {
            role: 'manager',
            department: 'manufacturing' // Wrong department
          },
          resource_attributes: {
            type: 'financial_reports',
            sensitivity: 'confidential'
          },
          context: {
            time: '14:30',
            location: 'office'
          },
          expected: false
        },
        {
          user_attributes: {
            role: 'manager',
            department: 'finance'
          },
          resource_attributes: {
            type: 'financial_reports',
            sensitivity: 'restricted' // Too sensitive
          },
          context: {
            time: '14:30',
            location: 'office'
          },
          expected: false
        }
      ];

      for (const test of policyTests) {
        const evaluationResponse = await server.callTool('auth_evaluate_abac_policy', {
          policy_name: 'sensitive_financial_access',
          user_attributes: test.user_attributes,
          resource_attributes: test.resource_attributes,
          context: test.context,
          action: 'read'
        });

        expect(evaluationResponse.data.authorized).toBe(test.expected);
      }
    });

    it('should implement dynamic attribute evaluation', async () => {
      // Test time-based access
      const timeBasedPolicy = await server.callTool('auth_create_abac_policy', {
        name: 'business_hours_only',
        effect: 'allow',
        condition: {
          and: [
            { 'context.current_time': { between: ['08:00', '18:00'] } },
            { 'context.day_of_week': { not_in: ['saturday', 'sunday'] } }
          ]
        },
        resources: ['manufacturing_data'],
        actions: ['write']
      });

      // Simulate different times
      const currentTime = new Date();
      const businessHour = new Date(currentTime);
      businessHour.setHours(14, 0, 0, 0); // 2 PM

      const afterHours = new Date(currentTime);
      afterHours.setHours(22, 0, 0, 0); // 10 PM

      const businessHourTest = await server.callTool('auth_evaluate_abac_policy', {
        policy_name: 'business_hours_only',
        user_attributes: { role: 'operator' },
        resource_attributes: { type: 'manufacturing_data' },
        context: {
          current_time: businessHour.toTimeString().slice(0, 5),
          day_of_week: 'tuesday'
        },
        action: 'write'
      });

      const afterHoursTest = await server.callTool('auth_evaluate_abac_policy', {
        policy_name: 'business_hours_only',
        user_attributes: { role: 'operator' },
        resource_attributes: { type: 'manufacturing_data' },
        context: {
          current_time: afterHours.toTimeString().slice(0, 5),
          day_of_week: 'tuesday'
        },
        action: 'write'
      });

      expect(businessHourTest.data.authorized).toBe(true);
      expect(afterHoursTest.data.authorized).toBe(false);
    });
  });

  describe('Resource-Level Authorization', () => {
    it('should enforce resource ownership controls', async () => {
      // Test owner access
      const ownerAccessTest = await server.callTool('auth_check_resource_access', {
        user_id: testUsers.manager.id,
        resource_id: testResources.financial_reports.id,
        action: 'write',
        check_ownership: true
      });

      expect(ownerAccessTest.data.authorized).toBe(true);
      expect(ownerAccessTest.data.access_reason).toBe('owner');

      // Test non-owner access
      const nonOwnerAccessTest = await server.callTool('auth_check_resource_access', {
        user_id: testUsers.operator.id,
        resource_id: testResources.financial_reports.id,
        action: 'write',
        check_ownership: true
      });

      expect(nonOwnerAccessTest.data.authorized).toBe(false);
      expect(nonOwnerAccessTest.data.reason).toMatch(/ownership|permission/i);
    });

    it('should implement resource sharing controls', async () => {
      // Share resource with specific user
      const shareResponse = await server.callTool('auth_share_resource', {
        resource_id: testResources.manufacturing_data.id,
        owner_id: testUsers.operator.id,
        share_with: testUsers.manager.id,
        permissions: ['read'],
        expires_at: '2024-12-31T23:59:59Z'
      });

      expect(shareResponse).toBeValidMcpToolResponse();
      expect(shareResponse.data.shared).toBe(true);

      // Test shared access
      const sharedAccessTest = await server.callTool('auth_check_resource_access', {
        user_id: testUsers.manager.id,
        resource_id: testResources.manufacturing_data.id,
        action: 'read'
      });

      expect(sharedAccessTest.data.authorized).toBe(true);
      expect(sharedAccessTest.data.access_reason).toBe('shared');

      // Test unauthorized action (write not shared)
      const unauthorizedActionTest = await server.callTool('auth_check_resource_access', {
        user_id: testUsers.manager.id,
        resource_id: testResources.manufacturing_data.id,
        action: 'write'
      });

      expect(unauthorizedActionTest.data.authorized).toBe(false);
    });

    it('should handle resource inheritance and hierarchies', async () => {
      // Create resource hierarchy
      const hierarchyResponse = await server.callTool('auth_create_resource_hierarchy', {
        parent: 'financial_department',
        children: [
          testResources.financial_reports.id,
          'budget_001',
          'forecast_001'
        ]
      });

      expect(hierarchyResponse).toBeValidMcpToolResponse();

      // Grant access to parent resource
      const parentAccessResponse = await server.callTool('auth_grant_resource_access', {
        user_id: testUsers.manager.id,
        resource_id: 'financial_department',
        permissions: ['read', 'write'],
        inheritance: true
      });

      expect(parentAccessResponse.data.granted).toBe(true);

      // Test inherited access to child resource
      const inheritedAccessTest = await server.callTool('auth_check_resource_access', {
        user_id: testUsers.manager.id,
        resource_id: testResources.financial_reports.id,
        action: 'read',
        check_inheritance: true
      });

      expect(inheritedAccessTest.data.authorized).toBe(true);
      expect(inheritedAccessTest.data.access_reason).toBe('inherited');
    });
  });

  describe('API Endpoint Authorization', () => {
    it('should protect API endpoints based on permissions', async () => {
      const endpointTests = [
        {
          endpoint: '/api/admin/users',
          method: 'GET',
          user: testUsers.admin,
          expected: true
        },
        {
          endpoint: '/api/admin/users',
          method: 'GET',
          user: testUsers.manager,
          expected: false
        },
        {
          endpoint: '/api/manufacturing/data',
          method: 'GET',
          user: testUsers.operator,
          expected: true
        },
        {
          endpoint: '/api/manufacturing/data',
          method: 'POST',
          user: testUsers.viewer,
          expected: false
        },
        {
          endpoint: '/api/financial/reports',
          method: 'GET',
          user: testUsers.manager,
          expected: true
        },
        {
          endpoint: '/api/financial/reports',
          method: 'DELETE',
          user: testUsers.operator,
          expected: false
        }
      ];

      for (const test of endpointTests) {
        const endpointAuthResponse = await server.callTool('auth_check_endpoint_access', {
          user_id: test.user.id,
          endpoint: test.endpoint,
          method: test.method
        });

        expect(endpointAuthResponse.data.authorized).toBe(test.expected);

        if (!test.expected) {
          expect(endpointAuthResponse.data).toHaveProperty('required_permission');
        }
      }
    });

    it('should implement rate limiting per user role', async () => {
      // Set different rate limits for different roles
      const rateLimitConfig = await server.callTool('auth_configure_rate_limits', {
        limits: {
          admin: { requests: 1000, window: 60000 },
          manager: { requests: 500, window: 60000 },
          operator: { requests: 200, window: 60000 },
          viewer: { requests: 100, window: 60000 }
        }
      });

      expect(rateLimitConfig).toBeValidMcpToolResponse();

      // Test rate limiting for viewer role
      const requests = Array.from({ length: 150 }, () =>
        server.callTool('auth_check_rate_limit', {
          user_id: testUsers.viewer.id,
          endpoint: '/api/basic/data'
        })
      );

      const results = await Promise.allSettled(requests);
      const allowedRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.data.allowed === true
      );
      const rateLimitedRequests = results.filter(r => 
        r.status === 'fulfilled' && r.value.data.rate_limited === true
      );

      expect(allowedRequests.length).toBeLessThanOrEqual(100);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });

    it('should validate API parameter access', async () => {
      // Test parameter-level authorization
      const parameterTests = [
        {
          user: testUsers.manager,
          endpoint: '/api/financial/reports',
          parameters: { include_sensitive: true },
          expected: true
        },
        {
          user: testUsers.operator,
          endpoint: '/api/financial/reports',
          parameters: { include_sensitive: true },
          expected: false
        },
        {
          user: testUsers.viewer,
          endpoint: '/api/manufacturing/data',
          parameters: { include_costs: true },
          expected: false
        }
      ];

      for (const test of parameterTests) {
        const parameterAuthResponse = await server.callTool('auth_check_parameter_access', {
          user_id: test.user.id,
          endpoint: test.endpoint,
          parameters: test.parameters
        });

        expect(parameterAuthResponse.data.authorized).toBe(test.expected);

        if (!test.expected) {
          expect(parameterAuthResponse.data).toHaveProperty('restricted_parameters');
        }
      }
    });
  });

  describe('Cross-System Authorization', () => {
    it('should maintain consistent permissions across integrated systems', async () => {
      // Test Xero access based on user permissions
      const xeroAccessTest = await server.callTool('auth_check_external_system_access', {
        user_id: testUsers.manager.id,
        system: 'xero',
        operation: 'read_financial_reports'
      });

      expect(xeroAccessTest.data.authorized).toBe(true);

      // Test unauthorized Xero access
      const unauthorizedXeroTest = await server.callTool('auth_check_external_system_access', {
        user_id: testUsers.operator.id,
        system: 'xero',
        operation: 'modify_chart_of_accounts'
      });

      expect(unauthorizedXeroTest.data.authorized).toBe(false);

      // Test Shopify access
      const shopifyAccessTest = await server.callTool('auth_check_external_system_access', {
        user_id: testUsers.operator.id,
        system: 'shopify',
        operation: 'read_inventory_levels'
      });

      expect(shopifyAccessTest.data.authorized).toBe(true);
    });

    it('should implement federated authorization', async () => {
      // Test authorization with external identity provider
      const federatedAuthTest = await server.callTool('auth_federated_authorization', {
        external_token: 'external_jwt_token',
        system: 'azure_ad',
        resource: testResources.financial_reports.id,
        action: 'read'
      });

      expect(federatedAuthTest).toBeValidMcpToolResponse();
      expect(federatedAuthTest.data).toHaveProperty('authorized');
      expect(federatedAuthTest.data).toHaveProperty('mapped_permissions');
    });

    it('should handle authorization policy synchronization', async () => {
      // Sync authorization policies with external systems
      const policySyncResponse = await server.callTool('auth_sync_external_policies', {
        systems: ['xero', 'shopify', 'unleashed'],
        sync_type: 'incremental'
      });

      expect(policySyncResponse).toBeValidMcpToolResponse();
      expect(policySyncResponse.data).toHaveProperty('sync_results');
      expect(policySyncResponse.data.sync_results).toHaveProperty('policies_synced');
      expect(policySyncResponse.data.sync_results).toHaveProperty('conflicts');
    });
  });

  describe('Authorization Audit and Monitoring', () => {
    it('should log all authorization decisions', async () => {
      // Perform several authorization checks
      await server.callTool('auth_check_permission', {
        user_id: testUsers.manager.id,
        resource_id: testResources.financial_reports.id,
        action: 'read'
      });

      await server.callTool('auth_check_permission', {
        user_id: testUsers.operator.id,
        resource_id: testResources.system_config.id,
        action: 'write'
      });

      // Retrieve audit logs
      const auditLogsResponse = await server.callTool('auth_get_audit_logs', {
        time_range: {
          start: new Date(Date.now() - 60000).toISOString(), // Last minute
          end: new Date().toISOString()
        },
        event_types: ['authorization_check', 'permission_denied']
      });

      expect(auditLogsResponse).toBeValidMcpToolResponse();
      expect(auditLogsResponse.data.logs).toBeInstanceOf(Array);
      expect(auditLogsResponse.data.logs.length).toBeGreaterThan(0);

      // Verify log structure
      const log = auditLogsResponse.data.logs[0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('user_id');
      expect(log).toHaveProperty('resource_id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('decision');
      expect(log).toHaveProperty('reason');
    });

    it('should detect authorization anomalies', async () => {
      // Generate abnormal access patterns
      const anomalousRequests = Array.from({ length: 20 }, () =>
        server.callTool('auth_check_permission', {
          user_id: testUsers.viewer.id,
          resource_id: testResources.system_config.id,
          action: 'admin'
        })
      );

      await Promise.allSettled(anomalousRequests);

      // Check for anomaly detection
      const anomalyResponse = await server.callTool('auth_detect_anomalies', {
        user_id: testUsers.viewer.id,
        time_window: 60000 // Last minute
      });

      expect(anomalyResponse).toBeValidMcpToolResponse();
      expect(anomalyResponse.data.anomalies_detected).toBe(true);
      expect(anomalyResponse.data.anomaly_types).toContain('privilege_escalation_attempts');
    });

    it('should generate authorization compliance reports', async () => {
      const complianceReport = await server.callTool('auth_generate_compliance_report', {
        report_type: 'access_control_matrix',
        time_period: '30_days',
        include_violations: true
      });

      expect(complianceReport).toBeValidMcpToolResponse();
      expect(complianceReport.data).toHaveProperty('access_matrix');
      expect(complianceReport.data).toHaveProperty('policy_violations');
      expect(complianceReport.data).toHaveProperty('recommendations');
      expect(complianceReport.data.access_matrix).toBeInstanceOf(Array);
    });
  });
});