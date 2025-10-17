# Test User Scenarios for Sentia Manufacturing Dashboard

## Test User Accounts

### Development Environment Users

#### User 1: Admin User

- **Email**: admin.dev@sentia-test.com
- **Password**: AdminDev2025$ecure!
- **Role**: Admin
- **Purpose**: Test full admin capabilities
- **Test Scenarios**:
  - Full dashboard customization
  - User management in admin panel
  - System configuration changes
  - Data import/export operations
  - All financial reports access

#### User 2: Manager User

- **Email**: manager.dev@sentia-test.com
- **Password**: ManagerDev2025$ecure!
- **Role**: Manager
- **Purpose**: Test management features
- **Test Scenarios**:
  - Working capital management
  - What-if analysis scenarios
  - Production scheduling
  - Quality control approvals
  - Inventory optimization

#### User 3: Operator User

- **Email**: operator.dev@sentia-test.com
- **Password**: OperatorDev2025$ecure!
- **Role**: Operator
- **Purpose**: Test operational features
- **Test Scenarios**:
  - Production data entry
  - Quality inspections
  - Inventory adjustments
  - Batch production updates
  - Downtime reporting

#### User 4: Viewer User

- **Email**: viewer.dev@sentia-test.com
- **Password**: ViewerDev2025$ecure!
- **Role**: Viewer (default)
- **Purpose**: Test read-only access
- **Test Scenarios**:
  - Dashboard viewing only
  - No modification capabilities
  - Export/download restrictions
  - Limited navigation options

### Production Environment Users

#### User 1: Production Admin

- **Email**: admin.prod@sentia-test.com
- **Password**: AdminProd2025$ecure!
- **Role**: Admin
- **Purpose**: Production admin testing

#### User 2: Production Manager

- **Email**: manager.prod@sentia-test.com
- **Password**: ManagerProd2025$ecure!
- **Role**: Manager
- **Purpose**: Production management testing

## User Journey Test Scenarios

### Scenario 1: First-Time User Onboarding

**User**: New Viewer
**Duration**: 15 minutes

1. **Sign Up Process**
   - Navigate to homepage
   - Click "Get Started" or "Sign Up"
   - Enter email and password
   - Verify email (if required)
   - Complete profile setup

2. **Initial Dashboard Experience**
   - Auto-redirect to dashboard
   - View welcome tutorial (if available)
   - Explore default widgets
   - Try to modify layout (should fail)
   - Navigate through menu items

3. **Data Exploration**
   - Click on KPI cards
   - View detailed charts
   - Check tooltips and help text
   - Export data (if permitted)

**Success Criteria**:

- Sign-up completed < 2 minutes
- Dashboard loads < 3 seconds
- All widgets display data
- Navigation intuitive

### Scenario 2: Manager Daily Operations

**User**: Manager Role
**Duration**: 30 minutes

1. **Morning Dashboard Review**
   - Sign in with saved credentials
   - Review KPI strip for anomalies
   - Check production metrics
   - Review quality alerts

2. **Working Capital Analysis**
   - Navigate to Working Capital
   - Review cash flow projections
   - Analyze AR/AP aging
   - Export financial report

3. **What-If Scenario Planning**
   - Open What-If Analysis
   - Adjust production volume +20%
   - Modify inventory levels
   - Calculate impact on working capital
   - Save scenario for review

4. **Production Scheduling**
   - Review current schedule
   - Identify bottlenecks
   - Adjust resource allocation
   - Approve schedule changes

**Success Criteria**:

- All financial data current
- What-if calculations < 2 seconds
- Changes persist after save
- Reports export successfully

### Scenario 3: Operator Shift Activities

**User**: Operator Role
**Duration**: 20 minutes

1. **Shift Start**
   - Quick sign-in
   - Review assigned tasks
   - Check production targets
   - View quality standards

2. **Production Data Entry**
   - Log production batch
   - Enter quantity produced
   - Record quality metrics
   - Note any defects

3. **Inventory Update**
   - Adjust raw material usage
   - Update finished goods
   - Record waste/scrap
   - Submit for approval

4. **Incident Reporting**
   - Log equipment downtime
   - Document root cause
   - Estimate repair time
   - Alert maintenance team

**Success Criteria**:

- Data entry < 30 seconds per item
- Real-time updates visible
- Validation prevents errors
- Notifications sent immediately

### Scenario 4: Admin System Management

**User**: Admin Role
**Duration**: 45 minutes

1. **User Management**
   - Access admin panel
   - Create new user account
   - Assign manager role
   - Set permissions
   - Send welcome email

2. **System Configuration**
   - Modify alert thresholds
   - Update KPI targets
   - Configure sync intervals
   - Test API connections

3. **Data Import Operations**
   - Upload Excel file
   - Map columns to fields
   - Validate data quality
   - Execute import
   - Review import logs

4. **Audit & Compliance**
   - Generate audit report
   - Review user activities
   - Check data integrity
   - Export compliance docs

**Success Criteria**:

- User creation < 1 minute
- Import handles 10k+ records
- All APIs show connected
- Audit trail complete

### Scenario 5: Mobile User Access

**User**: Any Role
**Duration**: 10 minutes
**Device**: Mobile Phone/Tablet

1. **Mobile Sign-In**
   - Open mobile browser
   - Navigate to site
   - Sign in with touch/face ID
   - Verify responsive layout

2. **Dashboard Interaction**
   - Swipe through widgets
   - Pinch to zoom charts
   - Tap for details
   - Check touch targets

3. **Quick Actions**
   - Approve pending items
   - View notifications
   - Quick data entry
   - Emergency alerts

**Success Criteria**:

- Mobile layout responsive
- Touch targets > 44px
- Gestures work smoothly
- Performance acceptable

### Scenario 6: Cross-Department Collaboration

**Users**: Multiple Roles
**Duration**: 60 minutes

1. **Finance Team (Manager)**
   - Create budget forecast
   - Share with production
   - Set cost constraints
   - Request inventory data

2. **Production Team (Operator)**
   - Review budget limits
   - Adjust production plan
   - Update capacity model
   - Submit for approval

3. **Quality Team (Operator)**
   - Review production changes
   - Update inspection schedule
   - Flag potential issues
   - Coordinate with production

4. **Executive Review (Admin)**
   - Review all submissions
   - Analyze impact
   - Approve/reject changes
   - Communicate decisions

**Success Criteria**:

- Real-time data sync
- Notifications work
- Version control maintained
- Audit trail complete

## Performance Test Scenarios

### Load Testing

- **Concurrent Users**: 50
- **Actions per User**: 20
- **Duration**: 30 minutes
- **Success Metric**: <2s response time

### Stress Testing

- **Concurrent Users**: 100+
- **Heavy Operations**: Data imports, reports
- **Duration**: 15 minutes
- **Success Metric**: No crashes

### Endurance Testing

- **Concurrent Users**: 25
- **Duration**: 8 hours
- **Success Metric**: No memory leaks

## Edge Case Scenarios

### Scenario A: Session Recovery

1. User working on what-if analysis
2. Browser crashes/network fails
3. User returns to application
4. Work should be auto-saved
5. Session should resume

### Scenario B: Concurrent Editing

1. Two managers edit same data
2. System detects conflict
3. Shows merge options
4. Preserves both changes
5. Logs conflict resolution

### Scenario C: API Failure Handling

1. External service (Xero) fails
2. System shows cached data
3. Displays sync error badge
4. Queues updates for retry
5. Notifies when restored

### Scenario D: Large Data Operations

1. Import 50,000+ records
2. System chunks processing
3. Shows progress indicator
4. Allows cancel operation
5. Rolls back on error

## Authentication Edge Cases

### Password Reset Flow

1. Click "Forgot Password"
2. Enter email address
3. Receive reset email
4. Click reset link
5. Set new password
6. Auto-login with new password

### Multi-Factor Authentication

1. Enable MFA in settings
2. Scan QR code
3. Enter verification code
4. Save backup codes
5. Test login with MFA

### Single Sign-On (SSO)

1. Click "Sign in with Google/Microsoft"
2. Authenticate with provider
3. Auto-create account if new
4. Map roles from provider
5. Complete sign-in

## Acceptance Criteria

### Must Pass

- [ ] All user roles can sign in
- [ ] Dashboard loads for all users
- [ ] Role permissions enforced
- [ ] Data displays correctly
- [ ] Navigation works
- [ ] Responsive on all devices

### Should Pass

- [ ] Performance targets met
- [ ] Error handling graceful
- [ ] Offline mode works
- [ ] Exports functional
- [ ] Notifications delivered

### Nice to Have

- [ ] Keyboard shortcuts work
- [ ] Animations smooth
- [ ] Tutorial helpful
- [ ] Search instant
- [ ] Themes apply correctly

## Test Data Requirements

### Financial Data

- 12 months historical data
- Current month transactions
- Forecast next 6 months
- Multiple currencies

### Inventory Data

- 500+ SKUs
- Multiple warehouses
- Various stock levels
- Movement history

### Production Data

- 5 production lines
- 100+ batches
- Quality metrics
- Downtime records

### User Data

- 20+ test users
- All role types
- Various permissions
- Activity history

---

**Document Version**: 1.0  
**Last Updated**: September 2025  
**Next Review**: October 2025
