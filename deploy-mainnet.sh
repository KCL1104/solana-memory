#!/bin/bash
# Mainnet Deployment Script for AgentMemory Protocol
# CRITICAL: Ensure you have sufficient SOL in the mainnet wallet before deploying

set -e

echo "=========================================="
echo "AgentMemory Protocol - Mainnet Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROGRAM_NAME="agent_memory"
MAINNET_PROGRAM_ID="Mem1oWL98HnWm9aN4rXY37EL4XgFj5Avq2zA26Zf9yq"
MAINNET_WALLET="~/.config/solana/mainnet-wallet.json"

echo -e "${YELLOW}Step 1: Verifying environment...${NC}"

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed${NC}"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Error: Anchor is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment verified${NC}"
echo ""

# Step 2: Configure for mainnet
echo -e "${YELLOW}Step 2: Configuring for mainnet...${NC}"
solana config set --url mainnet-beta
solana config set --keypair $MAINNET_WALLET

echo -e "${GREEN}✓ Mainnet configuration set${NC}"
echo ""

# Step 3: Check wallet balance
echo -e "${YELLOW}Step 3: Checking wallet balance...${NC}"
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Check if balance is sufficient (need at least 0.5 SOL)
BALANCE_NUM=$(echo $BALANCE | cut -d' ' -f1)
if (( $(echo "$BALANCE_NUM < 0.5" | bc -l) )); then
    echo -e "${RED}Error: Insufficient balance. Need at least 0.5 SOL for deployment${NC}"
    echo "Please fund your mainnet wallet: $(solana address)"
    exit 1
fi

echo -e "${GREEN}✓ Sufficient balance for deployment${NC}"
echo ""

# Step 4: Generate program keypair if not exists
echo -e "${YELLOW}Step 4: Preparing program keypair...${NC}"
KEYPAIR_PATH="programs/agent_memory/target/deploy/${PROGRAM_NAME}-keypair.json"

if [ ! -f "$KEYPAIR_PATH" ]; then
    echo "Generating new program keypair..."
    solana-keygen new --outfile "$KEYPAIR_PATH" --force
fi

PROGRAM_ID=$(solana address -k "$KEYPAIR_PATH")
echo "Program ID: $PROGRAM_ID"

echo -e "${GREEN}✓ Program keypair ready${NC}"
echo ""

# Step 5: Build the program
echo -e "${YELLOW}Step 5: Building program...${NC}"
cd programs/agent_memory
anchor build

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Step 6: Deploy to mainnet
echo -e "${YELLOW}Step 6: Deploying to mainnet...${NC}"
echo -e "${RED}WARNING: This will deploy to mainnet and cost real SOL!${NC}"
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

anchor deploy --provider.cluster mainnet --program-keypair "$KEYPAIR_PATH"

echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"
solana account $PROGRAM_ID --url mainnet-beta

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID"
echo ""
echo "Next steps:"
echo "1. Update documentation with mainnet program ID"
echo "2. Update frontend .env with mainnet configuration"
echo "3. Run tests on mainnet"
echo "4. Monitor deployment"
