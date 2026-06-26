#!/bin/bash

# ION DEX Deployment & Environment Validator
# Version: 1.0.0-Stable

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}          ION DEX PRODUCTION DEPLOYMENT             ${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Dependency Audit
echo -e "\n${CYAN}[1/4] Auditing System Dependencies...${NC}"
check_dep() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ ERROR: $1 is not installed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 detected.${NC}"
}

check_dep go
check_dep docker
check_dep docker-compose

# 2. Binary Compilation
echo -e "\n${CYAN}[2/4] Compiling ION Sniper Kernel...${NC}"
go build -o ion cmd/ion/main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Binary compiled successfully: ./ion${NC}"
else
    echo -e "${RED}❌ Compilation failed. Check internal/ router or execution logs.${NC}"
    exit 1
fi

# 3. Infrastructure Launch
echo -e "\n${CYAN}[3/4] Orchestrating Infrastructure...${NC}"
docker-compose up -d
sleep 2

# 4. Connectivity Handshake
echo -e "\n${CYAN}[4/4] Verifying Connectivity...${NC}"
if ! docker exec ion-dex-redis-1 redis-cli ping | grep -q "PONG"; then
    echo -e "${RED}❌ Infrastructure Handshake Failed: Redis unreachable.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Redis Bus Active (Port 6379)${NC}"
fi

echo -e "\n${GREEN}🚀 DEPLOYMENT LATCHED.${NC}"
echo -e "Run ${CYAN}./ion run --dry-run${NC} to perform a pre-flight system scan."
echo -e "${CYAN}====================================================${NC}"