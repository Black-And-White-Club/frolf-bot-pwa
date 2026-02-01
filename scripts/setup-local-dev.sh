#!/bin/bash

# 🎯 Frolf Bot Local Development Setup Script
# This script helps you get started with local development

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   🥏 Frolf Bot - Local Dev Setup         ║"
echo "╔═══════════════════════════════════════════╗"
echo -e "${NC}"

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
else
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    echo "Creating from template..."
    cp .env.local.template .env.local
    echo -e "${GREEN}✓ Created .env.local${NC}"
    echo -e "${RED}⚠ Please edit .env.local and add your Discord dev app credentials${NC}"
    echo ""
fi

# Check if node_modules exists
if [ -d node_modules ]; then
    echo -e "${GREEN}✓ node_modules exists${NC}"
else
    echo -e "${YELLOW}⚠ Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Create a Discord Dev Application:"
echo -e "   ${BLUE}https://discord.com/developers/applications${NC}"
echo "   See: DISCORD_DEV_APP_CHECKLIST.md"
echo ""
echo "2. Configure .env.local with your dev app credentials"
echo ""
echo "3. Start local infrastructure:"
echo -e "   ${GREEN}docker-compose -f docker-compose.dev.yml up -d${NC}"
echo ""
echo "4. Start the dev server:"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "5. (Optional) Check service health:"
echo -e "   ${GREEN}./scripts/health-check.sh${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📖 Full documentation: ${BLUE}LOCAL_DEV_SETUP.md${NC}"
echo ""
