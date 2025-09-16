# Render API Environment Variables Setup - Fixed Version
# Adds variables one by one to avoid JSON issues

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RENDER API VARIABLE CONFIGURATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$RENDER_API_KEY = "rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

# Service IDs from the API response
$services = @{
    "development" = "srv-d344tve3jp1c73fips80"
    "testing" = "srv-d344tve3jp1c73fips90"
    "production" = "srv-d344tve3jp1c73fips7g"
}

# All variables to add
$variables = @(
    @{key="NODE_ENV"; dev="development"; test="test"; prod="production"},
    @{key="PORT"; value="3000"},
    @{key="DATABASE_URL"; value="postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"},
    @{key="VITE_CLERK_PUBLISHABLE_KEY"; value="pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"},
    @{key="CLERK_SECRET_KEY"; value="sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"},
    @{key="CLERK_WEBHOOK_SECRET"; value="whsec_iTUcbgzS5P6zJlXWQkc4zGHnw8yLGt9j"},
    @{key="XERO_CLIENT_ID"; value="9C0CAB921C134476A249E48BBECB8C4B"},
    @{key="XERO_CLIENT_SECRET"; value="f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"},
    @{key="XERO_REDIRECT_URI"; value="https://sentia-manufacturing-dashboard.onrender.com/api/xero/callback"},
    @{key="SHOPIFY_UK_API_KEY"; value="7a30cd84e7a106b852c8e0fb789de10e"},
    @{key="SHOPIFY_UK_SECRET"; value="8b2d61745c506970c70d8c892f5f977e"},
    @{key="SHOPIFY_UK_ACCESS_TOKEN"; value="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"},
    @{key="SHOPIFY_UK_SHOP_URL"; value="sentiaspirits.myshopify.com"},
    @{key="SHOPIFY_USA_API_KEY"; value="83b8903fd8b509ef8bf93d1dbcd6079c"},
    @{key="SHOPIFY_USA_SECRET"; value="d01260e58adb00198cddddd1bd9a9490"},
    @{key="SHOPIFY_USA_ACCESS_TOKEN"; value="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"},
    @{key="SHOPIFY_USA_SHOP_URL"; value="us-sentiaspirits.myshopify.com"},
    @{key="UNLEASHED_API_ID"; value="d5313df6-db35-430c-a69e-ae27dffe0c5a"},
    @{key="UNLEASHED_API_KEY"; value="2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="},
    @{key="UNLEASHED_API_URL"; value="https://api.unleashedsoftware.com"},
    @{key="OPENAI_API_KEY"; value="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"},
    @{key="ANTHROPIC_API_KEY"; value="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"},
    @{key="MICROSOFT_CLIENT_ID"; value="c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"},
    @{key="MICROSOFT_CLIENT_SECRET"; value="peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"},
    @{key="MICROSOFT_TENANT_ID"; value="common"},
    @{key="MCP_SERVER_URL"; value="https://sentia-mcp-server.onrender.com"},
    @{key="AUTO_SYNC_ENABLED"; value="true"},
    @{key="LOG_LEVEL"; value="info"},
    @{key="VITE_API_BASE_URL"; value="https://sentia-manufacturing-dashboard.onrender.com/api"},
    @{key="VITE_APP_TITLE"; value="Sentia Manufacturing Dashboard"},
    @{key="VITE_APP_VERSION"; value="1.0.0"},
    @{key="CORS_ORIGINS"; value="https://sentia-manufacturing-dashboard.onrender.com"}
)

function Set-RenderEnvVar {
    param(
        [string]$ServiceId,
        [string]$Key,
        [string]$Value
    )
    
    $headers = @{
        "Authorization" = "Bearer $RENDER_API_KEY"
        "Accept" = "application/json"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        "key" = $Key
        "value" = $Value
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/env-vars" -Headers $headers -Method Post -Body $body
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            # Variable already exists, try to update it
            try {
                $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/env-vars/$Key" -Headers $headers -Method Put -Body $body
                return $true
            } catch {
                Write-Host "    Failed to update $Key : $_" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "    Failed to add $Key : $_" -ForegroundColor Red
            return $false
        }
    }
}

# Process each environment
foreach ($env in @("development", "testing", "production")) {
    Write-Host "`nConfiguring $env environment..." -ForegroundColor Yellow
    $serviceId = $services[$env]
    
    if (-not $serviceId) {
        Write-Host "  Service ID not found for $env" -ForegroundColor Red
        continue
    }
    
    Write-Host "  Service ID: $serviceId" -ForegroundColor Cyan
    $success = 0
    $failed = 0
    
    foreach ($var in $variables) {
        $key = $var.key
        $value = $var.value
        
        # Handle environment-specific values
        if ($var.ContainsKey($env.Substring(0,3))) {
            $value = $var[$env.Substring(0,3)]
        } elseif ($var.ContainsKey($env)) {
            $value = $var[$env]
        }
        
        if ($value) {
            Write-Host "  Setting $key..." -NoNewline
            if (Set-RenderEnvVar -ServiceId $serviceId -Key $key -Value $value) {
                Write-Host " OK" -ForegroundColor Green
                $success++
            } else {
                Write-Host " FAILED" -ForegroundColor Red
                $failed++
            }
        }
    }
    
    Write-Host "  Summary: $success added/updated, $failed failed" -ForegroundColor Cyan
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nTrigger new deployments from Render Dashboard to apply changes." -ForegroundColor Yellow
Write-Host "Services will be available at:" -ForegroundColor Cyan
Write-Host "  https://sentia-manufacturing-development.onrender.com" -ForegroundColor White
Write-Host "  https://sentia-manufacturing-testing.onrender.com" -ForegroundColor White
Write-Host "  https://sentia-manufacturing-production.onrender.com" -ForegroundColor White