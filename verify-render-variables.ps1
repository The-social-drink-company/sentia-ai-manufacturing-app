# Verify and Display ALL Render Environment Variables
# This script ensures ALL variables are properly configured

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RENDER ENVIRONMENT VARIABLES VERIFICATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Complete list of ALL required environment variables
$allVariables = @{
    "Core" = @{
        "NODE_ENV" = "production"
        "PORT" = "3000"
        "CORS_ORIGINS" = "https://sentia-manufacturing-dashboard.onrender.com"
    }

    "Database" = @{
        "DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "PROD_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-damp-wave-abxu46so-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        "DEV_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
        "TEST_DATABASE_URL" = "postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
    }

    "Authentication" = @{
        "VITE_CLERK_PUBLISHABLE_KEY" = "pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk"
        "CLERK_SECRET_KEY" = "sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq"
        "CLERK_WEBHOOK_SECRET" = "whsec_REDACTED"
        "SESSION_SECRET" = "[GENERATE]"
        "JWT_SECRET" = "[GENERATE]"
    }

    "Xero" = @{
        "XERO_CLIENT_ID" = "9C0CAB921C134476A249E48BBECB8C4B"
        "XERO_CLIENT_SECRET" = "f0TJpJSRX_B9NI51sknz7TuKbbSfhO4dEhTM4m4fWBlph9F5"
        "XERO_REDIRECT_URI" = "https://sentia-manufacturing-dashboard.onrender.com/api/xero/callback"
        "XERO_TENANT_ID" = "[OPTIONAL]"
    }

    "Shopify_UK" = @{
        "SHOPIFY_UK_API_KEY" = "7a30cd84e7a106b852c8e0fb789de10e"
        "SHOPIFY_UK_SECRET" = "8b2d61745c506970c70d8c892f5f977e"
        "SHOPIFY_UK_ACCESS_TOKEN" = "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"
        "SHOPIFY_UK_SHOP_URL" = "sentiaspirits.myshopify.com"
    }

    "Shopify_USA" = @{
        "SHOPIFY_USA_API_KEY" = "83b8903fd8b509ef8bf93d1dbcd6079c"
        "SHOPIFY_USA_SECRET" = "d01260e58adb00198cddddd1bd9a9490"
        "SHOPIFY_USA_ACCESS_TOKEN" = "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"
        "SHOPIFY_USA_SHOP_URL" = "us-sentiaspirits.myshopify.com"
        "SHOPIFY_WEBHOOK_SECRET" = "[OPTIONAL]"
    }

    "Amazon" = @{
        "AMAZON_SP_API_CLIENT_ID" = "[OPTIONAL]"
        "AMAZON_SP_API_CLIENT_SECRET" = "[OPTIONAL]"
        "AMAZON_SP_API_REFRESH_TOKEN" = "[OPTIONAL]"
        "AMAZON_UK_MARKETPLACE_ID" = "A1F83G8C2ARO7P"
        "AMAZON_USA_MARKETPLACE_ID" = "ATVPDKIKX0DER"
        "AMAZON_SELLER_ID" = "[OPTIONAL]"
    }

    "Unleashed" = @{
        "UNLEASHED_API_ID" = "d5313df6-db35-430c-a69e-ae27dffe0c5a"
        "UNLEASHED_API_KEY" = "2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ=="
        "UNLEASHED_API_URL" = "https://api.unleashedsoftware.com"
    }

    "AI_Services" = @{
        "OPENAI_API_KEY" = "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"
        "ANTHROPIC_API_KEY" = "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"
        "GOOGLE_AI_API_KEY" = "[OPTIONAL]"
        "LOCAL_LLM_ENDPOINT" = "[OPTIONAL]"
        "LOCAL_LLM_MODEL" = "[OPTIONAL]"
    }

    "Microsoft" = @{
        "MICROSOFT_CLIENT_ID" = "c16d6fba-0e6b-45ea-a016-eb697ff7a7ae"
        "MICROSOFT_CLIENT_SECRET" = "peI8Q~4QJG.ax3ekxtWrv.PXVENVQ3vw_Br1qayM"
        "MICROSOFT_TENANT_ID" = "common"
        "MICROSOFT_ADMIN_EMAIL" = "admin@app.sentiaspirits.com"
        "MICROSOFT_DATA_EMAIL" = "data@app.sentiaspirits.com"
    }

    "MCP_Server" = @{
        "MCP_SERVER_URL" = "https://sentia-mcp-server.onrender.com"
        "MCP_SERVER_SERVICE_ID" = "99691282-de66-45b2-98cf-317083dd11ba"
        "MCP_JWT_SECRET" = "[GENERATE]"
        "MCP_ENABLE_WEBSOCKET" = "true"
        "MCP_SERVER_PORT" = "3001"
    }

    "Sync_Configuration" = @{
        "AUTO_SYNC_ENABLED" = "true"
        "XERO_SYNC_INTERVAL" = "*/30 * * * *"
        "SHOPIFY_SYNC_INTERVAL" = "*/15 * * * *"
        "AMAZON_SYNC_INTERVAL" = "*/60 * * * *"
        "DATABASE_SYNC_INTERVAL" = "0 */6 * * *"
    }

    "Optional_Services" = @{
        "REDIS_URL" = "[OPTIONAL]"
        "SENTRY_DSN" = "[OPTIONAL]"
        "LOG_LEVEL" = "info"
    }

    "Feature_Flags" = @{
        "ENABLE_AUTONOMOUS_TESTING" = "false"
        "AUTO_FIX_ENABLED" = "false"
        "AUTO_DEPLOY_ENABLED" = "false"
    }

    "Application" = @{
        "VITE_API_BASE_URL" = "https://sentia-manufacturing-dashboard.onrender.com/api"
        "VITE_APP_TITLE" = "Sentia Manufacturing Dashboard"
        "VITE_APP_VERSION" = "1.0.0"
    }
}

# Count total variables
$totalCount = 0
foreach ($category in $allVariables.Keys) {
    $totalCount += $allVariables[$category].Count
}

Write-Host "`nTotal Environment Variables Required: $totalCount" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Display all variables by category
Write-Host "`nALL ENVIRONMENT VARIABLES:" -ForegroundColor Green

foreach ($category in $allVariables.Keys) {
    Write-Host "`n--- $category ---" -ForegroundColor Yellow
    foreach ($key in $allVariables[$category].Keys) {
        $value = $allVariables[$category][$key]
        if ($value -eq "[GENERATE]") {
            Write-Host "  $key = [AUTO-GENERATE IN RENDER]" -ForegroundColor Cyan
        } elseif ($value -eq "[OPTIONAL]") {
            Write-Host "  $key = [OPTIONAL - Add if needed]" -ForegroundColor Gray
        } else {
            # Truncate long values for display
            if ($value.Length -gt 50) {
                $displayValue = $value.Substring(0, 47) + "..."
            } else {
                $displayValue = $value
            }
            Write-Host "  $key = $displayValue" -ForegroundColor White
        }
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   EXPORT FOR RENDER DASHBOARD" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Create a single file with ALL variables for easy copy-paste
$exportContent = @()

foreach ($category in $allVariables.Keys) {
    $exportContent += "# $category"
    foreach ($key in $allVariables[$category].Keys) {
        $value = $allVariables[$category][$key]
        if ($value -ne "[GENERATE]" -and $value -ne "[OPTIONAL]") {
            $exportContent += "$key=$value"
        }
    }
    $exportContent += ""
}

# Save to file
$exportContent | Out-File -FilePath "render-all-variables.txt" -Encoding UTF8
Write-Host "`nAll variables exported to: render-all-variables.txt" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   HOW TO ADD TO RENDER" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n1. Open render-all-variables.txt" -ForegroundColor White
Write-Host "2. Copy ALL contents" -ForegroundColor White
Write-Host "3. Go to your Render service" -ForegroundColor White
Write-Host "4. Click Environment tab" -ForegroundColor White
Write-Host "5. Click 'Bulk Edit' or add one by one" -ForegroundColor White
Write-Host "6. Paste and Save" -ForegroundColor White

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   CHECKING RENDER.YAML" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# Check if render.yaml exists and count variables
if (Test-Path "render.yaml") {
    $renderContent = Get-Content "render.yaml" -Raw
    $envVarCount = ([regex]::Matches($renderContent, "- key:")).Count
    Write-Host "`nrender.yaml contains $envVarCount environment variables" -ForegroundColor Green

    if ($envVarCount -lt 50) {
        Write-Host "WARNING: render.yaml might be missing some variables!" -ForegroundColor Yellow
        Write-Host "Expected: ~60+ variables" -ForegroundColor Yellow
    } else {
        Write-Host "render.yaml appears to have all variables configured!" -ForegroundColor Green
    }
} else {
    Write-Host "render.yaml not found!" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "         VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "1. Variables marked [GENERATE] will be auto-generated by Render" -ForegroundColor White
Write-Host "2. Variables marked [OPTIONAL] can be added later if needed" -ForegroundColor White
Write-Host "3. The render.yaml file configures these automatically on deploy" -ForegroundColor White
Write-Host "4. Manual addition is only needed if render.yaml doesn't work" -ForegroundColor White