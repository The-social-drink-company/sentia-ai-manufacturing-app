# Admin User Setup Instructions

## New Admin Users Added to System

The following admin users have been added to the Sentia Manufacturing Dashboard system:

### 1. Daniel Kenny

- **Email**: daniel.kenny@sentiaspirits.com
- **Password**: Ui$4j#AnxPSVpnSQ
- **Role**: Administrator (full access)
- **Status**: Active
- **MFA**: Enabled (recommended for security)

### 2. Paul Roberts

- **Email**: paul.roberts@sentiaspirits.com
- **Password**: tgyZiI1%ME7jt391
- **Role**: Administrator (full access)
- **Status**: Active
- **MFA**: Enabled (recommended for security)

### 3. David Orren

- **Email**: david.orren@gabalabs.com
- **Password**: DQ%66t^UzQXjVuIU
- **Role**: Administrator (full access)
- **Status**: Active
- **MFA**: Enabled (recommended for security)

## Setup Instructions

### In Code (Already Completed)

✅ Users have been added to the AdminUsers component mock data
✅ All users configured with admin role and active status
✅ MFA enabled by default for security

### Clerk Authentication Dashboard Setup Required

To complete the user setup, you need to add these users to your Clerk dashboard:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.dev
2. **Navigate to Users section**
3. **Create each user manually** with the emails above
4. **Set temporary passwords** (users will be prompted to change on first login)
5. **Enable MFA** for each admin user
6. **Assign admin role/permissions** in Clerk's role management

### Alternative: User Invitation Method

Instead of manual creation, you can:

1. Use the "Create User" button in the Admin panel (`/admin`)
2. Send invitations to each email address
3. Users will receive email invitations with setup instructions
4. They can set their own passwords and enable MFA

## Security Notes

⚠️ **Important Security Considerations**:

- These passwords are temporary and should be changed on first login
- MFA should be enabled for all admin accounts
- Regular password rotation recommended
- Consider using SSO integration for enterprise security
- Monitor admin user access through audit logs

## Admin Panel Access

Once configured, these users will have access to:

- Full Admin Panel at `/admin`
- User Management at `/admin/users`
- System Configuration
- API Management
- Integration Settings
- FX Configuration
- Feature Flags Management

## Testing Admin Access

After setup, test each user can:

1. ✅ Log in successfully with provided credentials
2. ✅ Access Admin Panel without restrictions
3. ✅ View and manage all system users
4. ✅ Configure system settings
5. ✅ Access FinanceFlo-specific features (lead times, multi-currency)

---

**Note**: This setup provides immediate admin access for the FinanceFlo project stakeholders while maintaining enterprise security standards.
