# SimTrace End-to-End Test Script (PowerShell)
# Tests the deployed frontend and backend

$ErrorActionPreference = "Stop"

$FrontendUrl = $env:FRONTEND_URL ?? "https://simtrace-final.vercel.app"
$BackendUrl = $env:BACKEND_URL ?? "https://simtrace-backend.onrender.com"

Write-Host "=========================================="
Write-Host "SimTrace End-to-End Test"
Write-Host "=========================================="
Write-Host "Frontend: $FrontendUrl"
Write-Host "Backend: $BackendUrl"
Write-Host "=========================================="
Write-Host ""

# Test counter
$Passed = 0
$Failed = 0

# Function to run test
function Run-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    Write-Host -NoNewline "Testing: $TestName... "
    
    try {
        & $TestCommand | Out-Null
        Write-Host "PASSED" -ForegroundColor Green
        $script:Passed++
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        $script:Failed++
    }
}

# ============================================
# BACKEND HEALTH CHECKS
# ============================================
Write-Host "Backend Health Checks"
Write-Host "----------------------"

Run-Test "Backend is accessible" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $response.StatusCode -eq 200
}

Run-Test "Backend returns uptime" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content.uptime -ne $null
}

Run-Test "Backend returns environment" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content.environment -ne $null
}

Run-Test "Backend returns services status" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content.services -ne $null
}

Run-Test "Billing plans endpoint" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/billing/plans" -UseBasicParsing
    $response.StatusCode -eq 200
}

Run-Test "Billing plans has data" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/billing/plans" -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content.plans -ne $null
}

Write-Host ""

# ============================================
# FRONTEND ACCESSIBILITY
# ============================================
Write-Host "Frontend Accessibility"
Write-Host "----------------------"

Run-Test "Frontend is accessible" {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
    $response.StatusCode -eq 200
}

Run-Test "Frontend returns HTML" {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
    $response.Content -match "<!DOCTYPE html>"
}

Write-Host ""

# ============================================
# API ENDPOINT TESTS
# ============================================
Write-Host "API Endpoint Tests"
Write-Host "------------------"

Run-Test "404 handling" {
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/non-existent" -UseBasicParsing
        $false
    }
    catch {
        $_.Exception.Response.StatusCode.Value__ -eq 404
    }
}

Run-Test "CORS headers present" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $response.Headers["Access-Control-Allow-Credentials"] -ne $null
}

Run-Test "Security headers present" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $response.Headers["X-Content-Type-Options"] -ne $null
}

Run-Test "Rate limit headers present" {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $response.Headers["ratelimit-limit"] -ne $null
}

Write-Host ""

# ============================================
# PERFORMANCE TESTS
# ============================================
Write-Host "Performance Tests"
Write-Host "-----------------"

Run-Test "Backend response time < 5s" {
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -UseBasicParsing
    $duration = (Get-Date) - $startTime
    $duration.TotalSeconds -lt 5
}

Run-Test "Frontend response time < 3s" {
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
    $duration = (Get-Date) - $startTime
    $duration.TotalSeconds -lt 3
}

Write-Host ""

# ============================================
# SUMMARY
# ============================================
Write-Host "=========================================="
Write-Host "Test Summary"
Write-Host "=========================================="
Write-Host "Total Tests: $($Passed + $Failed)"
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host "=========================================="

if ($Failed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "Some tests failed. Please check the logs." -ForegroundColor Red
    exit 1
}
