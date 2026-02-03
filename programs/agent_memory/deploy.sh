#!/bin/bash
# AgentMemory Devnet Deployment Script
# Usage: ./deploy.sh [program_id]

set -e

echo "======================================"
echo "  AgentMemory Devnet Deployment"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    if ! command -v solana &> /dev/null; then
        echo -e "${RED}Error: Solana CLI not found${NC}"
        echo "Install from: https://docs.solana.com/cli/install"
        exit 1
    fi
    echo "✓ Solana CLI found"
    
    if ! command -v anchor &> /dev/null; then
        echo -e "${RED}Error: Anchor not found${NC}"
        echo "Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
        exit 1
    fi
    echo "✓ Anchor found"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js not found${NC}"
        exit 1
    fi
    echo "✓ Node.js found"
}

# Setup environment
setup_env() {
    echo -e "\n${YELLOW}Setting up environment...${NC}"
    
    # Ensure we're on devnet
    solana config set --url devnet > /dev/null 2>&1
    echo "✓ Configured for devnet"
    
    # Check wallet
    if [ ! -f ~/.config/solana/devnet-wallet.json ]; then
        echo "Creating new devnet wallet..."
        solana-keygen new --outfile ~/.config/solana/devnet-wallet.json --no-bip39-passphrase
    fi
    
    # Set wallet
    solana config set --keypair ~/.config/solana/devnet-wallet.json > /dev/null 2>&1
    
    WALLET_ADDRESS=$(solana address)
    echo "✓ Wallet: $WALLET_ADDRESS"
    
    # Check balance
    BALANCE=$(solana balance 2>/dev/null || echo "0")
    echo "  Balance: $BALANCE SOL"
    
    if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
        echo -e "${YELLOW}Requesting airdrop...${NC}"
        solana airdrop 2
        sleep 2
        BALANCE=$(solana balance)
        echo "  New balance: $BALANCE SOL"
    fi
}

# Generate program keypair
generate_keypair() {
    echo -e "\n${YELLOW}Generating program keypair...${NC}"
    
    mkdir -p target/deploy
    
    if [ ! -f target/deploy/agent_memory-keypair.json ]; then
        solana-keygen new --outfile target/deploy/agent_memory-keypair.json --force --no-bip39-passphrase > /dev/null 2>&1
    fi
    
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    echo "✓ Program ID: $PROGRAM_ID"
}

# Update configuration files
update_config() {
    echo -e "\n${YELLOW}Updating configuration files...${NC}"
    
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    
    # Update lib.rs
    sed -i.bak "s/declare_id!(\"[^\"]*\")/declare_id!(\"$PROGRAM_ID\")/" src/lib.rs
    rm -f src/lib.rs.bak
    echo "✓ Updated src/lib.rs"
    
    # Update Anchor.toml
    if [ -f Anchor.toml ]; then
        sed -i.bak "s/agent_memory = \"[^\"]*\"/agent_memory = \"$PROGRAM_ID\"/" Anchor.toml
        rm -f Anchor.toml.bak
        echo "✓ Updated Anchor.toml"
    fi
    
    # Update IDL
    if [ -f idl.json ]; then
        # Add metadata.address if not present
        if ! grep -q '"address"' idl.json; then
            jq --arg addr "$PROGRAM_ID" '. + {metadata: {address: $addr}}' idl.json > idl.json.tmp
            mv idl.json.tmp idl.json
        else
            jq --arg addr "$PROGRAM_ID" '.metadata.address = $addr' idl.json > idl.json.tmp
            mv idl.json.tmp idl.json
        fi
        echo "✓ Updated idl.json"
    fi
}

# Build program
build_program() {
    echo -e "\n${YELLOW}Building program...${NC}"
    
    anchor build 2>&1 | tee build.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${RED}Build failed! Check build.log${NC}"
        exit 1
    fi
    
    echo "✓ Build successful"
}

# Deploy program
deploy_program() {
    echo -e "\n${YELLOW}Deploying to devnet...${NC}"
    
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    
    anchor deploy --provider.cluster devnet 2>&1 | tee deploy.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo -e "${RED}Deployment failed! Check deploy.log${NC}"
        exit 1
    fi
    
    echo "✓ Deployed successfully"
}

# Update frontend config
update_frontend() {
    echo -e "\n${YELLOW}Updating frontend configuration...${NC}"
    
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    
    cat > ../../app/.env.local << EOF
# AgentMemory Configuration
NEXT_PUBLIC_AGENT_MEMORY_PROGRAM_ID=$PROGRAM_ID
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=devnet
EOF
    
    echo "✓ Created app/.env.local"
}

# Verify deployment
verify_deployment() {
    echo -e "\n${YELLOW}Verifying deployment...${NC}"
    
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    
    # Check if program exists
    ACCOUNT_INFO=$(solana account $PROGRAM_ID --url devnet 2>&1)
    
    if echo "$ACCOUNT_INFO" | grep -q "executable: true"; then
        echo -e "${GREEN}✓ Program verified on devnet${NC}"
        echo ""
        echo "View on explorer:"
        echo "https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
    else
        echo -e "${RED}Warning: Program not found on devnet${NC}"
    fi
}

# Print summary
print_summary() {
    PROGRAM_ID=$(solana address -k target/deploy/agent_memory-keypair.json)
    
    echo ""
    echo "======================================"
    echo -e "  ${GREEN}Deployment Complete!${NC}"
    echo "======================================"
    echo ""
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "Next steps:"
    echo "  1. cd ../../app"
    echo "  2. npm install"
    echo "  3. npm run dev"
    echo ""
    echo "Explorer:"
    echo "  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
    echo ""
}

# Main
cd "$(dirname "$0")"

check_prerequisites
setup_env
generate_keypair
update_config
build_program
deploy_program
update_frontend
verify_deployment
print_summary
