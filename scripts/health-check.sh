#!/bin/bash

# Local Development Environment Health Check
# Verifies all services are running and configured correctly

set -e

echo "🔍 Frolf Bot - Local Development Health Check"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

check_service() {
    local service_name=$1
    local check_command=$2
    local check_description=$3
    
    echo -n "Checking $service_name... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $check_description"
        return 0
    else
        echo -e "${RED}✗${NC} $check_description"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

echo "📦 Infrastructure Services"
echo "-------------------------"

# Check PostgreSQL
check_service "PostgreSQL" \
    "docker ps | grep -q postgres" \
    "Running on port 5432"

if docker ps | grep -q postgres; then
    check_service "PostgreSQL Connection" \
        "docker exec -it \$(docker ps -q -f name=postgres) pg_isready -U local" \
        "Accepting connections"
fi

# Check NATS
check_service "NATS" \
    "docker ps | grep -q nats" \
    "Running on port 4222"

if docker ps | grep -q nats; then
    check_service "NATS Health" \
        "curl -s http://localhost:8222/healthz | grep -q ok" \
        "Health endpoint responding"
fi

echo ""
echo "🔧 Backend Services"
echo "------------------"

# Check Backend API
check_service "Backend API" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/health | grep -q 200" \
    "Health endpoint returning 200"

# Check if backend config exists
if [ -f "../frolf-bot/config.local.yaml" ]; then
    echo -e "${GREEN}✓${NC} Backend config.local.yaml exists"
else
    echo -e "${RED}✗${NC} Backend config.local.yaml not found"
    ALL_CHECKS_PASSED=false
fi

# Check if discord bot config exists
if [ -f "../discord-frolf-bot/config.local.yaml" ]; then
    echo -e "${GREEN}✓${NC} Discord bot config.local.yaml exists"
else
    echo -e "${RED}✗${NC} Discord bot config.local.yaml not found"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo "🌐 PWA Configuration"
echo "-------------------"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    
    # Check for required env vars
    if grep -q "DISCORD_CLIENT_ID=" .env.local && ! grep -q "DISCORD_CLIENT_ID=placeholder" .env.local; then
        echo -e "${GREEN}✓${NC} DISCORD_CLIENT_ID configured"
    else
        echo -e "${RED}✗${NC} DISCORD_CLIENT_ID not configured"
        ALL_CHECKS_PASSED=false
    fi
    
    if grep -q "DISCORD_CLIENT_SECRET=" .env.local && ! grep -q "DISCORD_CLIENT_SECRET=placeholder" .env.local; then
        echo -e "${GREEN}✓${NC} DISCORD_CLIENT_SECRET configured"
    else
        echo -e "${RED}✗${NC} DISCORD_CLIENT_SECRET not configured"
        ALL_CHECKS_PASSED=false
    fi
    
    if grep -q "AUTH_SECRET=" .env.local && ! grep -q "AUTH_SECRET=your" .env.local; then
        echo -e "${GREEN}✓${NC} AUTH_SECRET configured"
    else
        echo -e "${RED}✗${NC} AUTH_SECRET not configured"
        ALL_CHECKS_PASSED=false
    fi
else
    echo -e "${RED}✗${NC} .env.local not found"
    echo -e "${YELLOW}ℹ${NC}  Run: cp .env.example .env.local"
    ALL_CHECKS_PASSED=false
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Dependencies not installed"
    echo -e "${YELLOW}ℹ${NC}  Run: npm install"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo "🔌 Port Availability"
echo "-------------------"

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $port in use ($service)"
    else
        echo -e "${YELLOW}⚠${NC} Port $port not in use ($service not running?)"
    fi
}

check_port 5432 "PostgreSQL"
check_port 4222 "NATS"
check_port 8080 "Backend API"
check_port 8222 "NATS Monitoring"

echo ""
echo "=============================================="

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo "You're ready to develop! 🚀"
    echo ""
    echo "Next steps:"
    echo "  1. Start PWA: npm run dev"
    echo "  2. Open http://localhost:5173"
    echo "  3. Sign in with Discord"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed${NC}"
    echo ""
    echo "Please review the errors above and:"
    echo "  1. Ensure infrastructure is running: docker-compose -f docker-compose.dev.yml up -d"
    echo "  2. Configure environment: cp .env.example .env.local (and fill in values)"
    echo "  3. Start backend services (see LOCAL_DEV_SETUP.md)"
    echo ""
    echo "For detailed setup instructions, see:"
    echo "  - LOCAL_DEV_SETUP.md"
    echo "  - DISCORD_DEV_APP_CHECKLIST.md"
    echo ""
    exit 1
fi
