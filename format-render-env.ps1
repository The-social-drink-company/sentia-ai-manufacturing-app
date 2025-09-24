# Simple Render Environment Variables Formatter

$jsonContent = Get-Content "render-env-complete.json" -Raw
$envData = $jsonContent | ConvertFrom-Json

# Development Environment
Write-Host "Creating render-env-development.txt..."
$devVars = @()
foreach ($prop in $envData.development.PSObject.Properties) {
    $devVars += "$($prop.Name)=$($prop.Value)"
}
$devVars -join "`n" | Out-File "render-env-development.txt" -Encoding UTF8

# Testing Environment
Write-Host "Creating render-env-testing.txt..."
$testVars = @()
foreach ($prop in $envData.testing.PSObject.Properties) {
    $testVars += "$($prop.Name)=$($prop.Value)"
}
$testVars -join "`n" | Out-File "render-env-testing.txt" -Encoding UTF8

# Production Environment
Write-Host "Creating render-env-production.txt..."
$prodVars = @()
foreach ($prop in $envData.production.PSObject.Properties) {
    $prodVars += "$($prop.Name)=$($prop.Value)"
}
$prodVars -join "`n" | Out-File "render-env-production.txt" -Encoding UTF8

# MCP Server
Write-Host "Creating render-env-mcp.txt..."
$mcpVars = @()
foreach ($prop in $envData.mcp_server.PSObject.Properties) {
    $mcpVars += "$($prop.Name)=$($prop.Value)"
}
$mcpVars -join "`n" | Out-File "render-env-mcp.txt" -Encoding UTF8

Write-Host "Done! Files created:"
Write-Host "- render-env-development.txt"
Write-Host "- render-env-testing.txt"
Write-Host "- render-env-production.txt"
Write-Host "- render-env-mcp.txt"