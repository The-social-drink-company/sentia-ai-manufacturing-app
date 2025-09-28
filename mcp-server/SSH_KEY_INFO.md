# MCP Server SSH Key Information

## SSH Key Generated Successfully

### Key Details
- **Type**: ED25519 (most secure and efficient)
- **Location**: `~/.ssh/mcp_server_key` (private key)
- **Public Key Location**: `~/.ssh/mcp_server_key.pub`
- **Comment**: mcp-server@sentia-manufacturing

### Public Key (Add this to your server)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPh/LJC8YepvDJsEJBotiSeBcZ4nGFzr97H9uv+G2UO5 mcp-server@sentia-manufacturing
```

### How to Use

#### 1. For Render Deployment
- Go to Render Dashboard > Environment Groups or Service Settings
- Add the public key to authorized_keys or deployment keys
- Use the private key for CI/CD authentication

#### 2. For GitHub Repository Access
- Go to GitHub > Settings > Deploy Keys
- Add the public key above
- Enable "Allow write access" if needed

#### 3. For Direct Server Access
```bash
# Connect using the key
ssh -i ~/.ssh/mcp_server_key user@your-server.com

# Add to SSH config for easier access
echo "Host mcp-server
    HostName your-server.com
    User your-username
    IdentityFile ~/.ssh/mcp_server_key" >> ~/.ssh/config
```

#### 4. For Automated Deployments
```bash
# Set up SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/mcp_server_key
```

### Security Notes
- **NEVER share the private key** (`mcp_server_key`)
- **Only share the public key** (`mcp_server_key.pub`)
- Keep private key permissions secure: `chmod 600 ~/.ssh/mcp_server_key`
- Consider adding a passphrase for extra security

### Key Fingerprint
```
SHA256:Iu26oakVK+qDnHoCMb5jNL0eUBLvXd88S2tPD3IasKs
```

Use this fingerprint to verify the key when connecting for the first time.