#!/bin/bash
# Render Database Deployment Script (Bash/Linux/Mac)
# Deploys all three PostgreSQL databases to Render

echo "========================================"
echo "RENDER DATABASE DEPLOYMENT"
echo "========================================"
echo ""

# Render API Key
export RENDER_API_KEY="rnd_mYUAytWRkb2Pj5GJROqNYubYt25J"

echo "Creating PostgreSQL Databases on Render..."
echo ""

# Function to create database
create_database() {
    local name=$1
    local db_name=$2
    local user=$3
    local plan=$4
    local region=$5

    echo "----------------------------------------"
    echo "Creating: $name"
    echo "Plan: $plan"
    echo "Region: $region"
    echo ""

    response=$(curl -s -X POST https://api.render.com/v1/services \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"postgres\",
            \"name\": \"$name\",
            \"plan\": \"$plan\",
            \"region\": \"$region\",
            \"databaseName\": \"$db_name\",
            \"databaseUser\": \"$user\",
            \"ipAllowList\": []
        }")

    if echo "$response" | grep -q "\"id\":"; then
        echo "✓ Database created successfully!"
        echo ""
    else
        echo "✗ Failed to create database"
        echo "Response: $response"
        echo ""
    fi
}

# Create all three databases
create_database "sentia-db-development" "sentia_manufacturing_dev" "sentia_dev_user" "free" "oregon"
create_database "sentia-db-testing" "sentia_manufacturing_test" "sentia_test_user" "free" "oregon"
create_database "sentia-db-production" "sentia_manufacturing_prod" "sentia_prod_user" "starter" "oregon"

echo "========================================"
echo "DATABASE DEPLOYMENT SUMMARY"
echo "========================================"
echo ""
echo "Expected databases:"
echo "1. sentia-db-development (free)"
echo "2. sentia-db-testing (free)"
echo "3. sentia-db-production (starter - $7/month)"
echo ""
echo "Next steps:"
echo "1. Verify databases in Render Dashboard"
echo "2. Wait for databases to be available (2-3 minutes)"
echo "3. Deploy web services using render.yaml"
echo "4. Services will auto-connect to databases"
echo ""
echo "Dashboard: https://dashboard.render.com/services"