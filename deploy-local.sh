#!/bin/bash

# AgentMemory Protocol - Devnet Deployment Script
# Usage: ./deploy-local.sh [options]
#
# Options:
#   --skip-build      Skip the build step
#   --new-keypair     Generate a new program keypair
#   --verify-only     Only run verification checks
#   --help            Show this help message

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROGRAM_NAME="agent_memory"
PROGRAM_PATH="programs/${PROGRAM_NAME}"
TARGET_PATH="target/deploy"
IDL_PATH="app/src/idl"
CLUSTER="devnet"
RPC_URL="https://api.devnet.solana.com"

# Parse arguments
SKIP_BUILD=false
NEW_KEYPAIR=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --new-keypair)
      NEW_KEYPAIR=true
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: ./deploy-local.sh [options]"
      echo ""
      echo "Options:"
      echo "  --skip-build      Skip the build step"
      echo "  --new-keypair     Generate a new program keypair"
      echo "  --verify-only     Only run verification checks"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check Solana CLI
  if ! command -v solana &> /dev/null; then
    print_error "Solana CLI not found. Please install it first."
    echo "  curl -sSfL https://release.solana.com/v1.18.0/install | sh"
    exit 1
  fi
  print_success "Solana CLI: $(solana --version)"
  
  # Check Anchor
  if ! command -v anchor &> /dev/null; then
    print_error "Anchor not found. Please install it first."
    echo "  cargo install --git https://github.com/coral-xyz/anchor avm --locked"
    echo "  avm install 0.30.1"
    echo "  avm use 0.30.1"
    exit 1
  fi
  print_success "Anchor: $(anchor --version)"
  
  # Check Rust
  if ! command -v rustc &> /dev/null; then
    print_error "Rust not found. Please install it first."
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
  fi
  print_success "Rust: $(rustc --version)"
  
  # Check Node.js (for frontend)
  if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Frontend configuration will be skipped."
  else
    print_success "Node.js: $(node --version)"
  fi
}

# Setup Solana configuration
setup_solana() {
  print_header "Configuring Solana"
  
  # Set to devnet
  solana config set --url ${RPC_URL} > /dev/null 2>&1
  print_success "Set RPC to ${CLUSTER}: ${RPC_URL}"
  
  # Get wallet address
  WALLET_ADDRESS=$(solana address)
  print_info "Wallet: ${WALLET_ADDRESS}"
  
  # Check balance
  BALANCE=$(solana balance | awk '{print $1}')
  print_info "Balance: ${BALANCE} SOL"
  
  if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
    print_warning "Low balance. Requesting airdrop..."
    solana airdrop 2 || print_warning "Airdrop failed. Please use https://faucet.solana.com/"
    BALANCE=$(solana balance | awk '{print $1}')
    print_info "New balance: ${BALANCE} SOL"
  fi
  
  if (( $(echo "$BALANCE < 0.1" | bc -l) )); then
    print_error "Insufficient balance for deployment. Need at least 0.1 SOL."
    echo "Get devnet SOL from: https://faucet.solana.com/"
    exit 1
  fi
}

# Generate new keypair if requested
generate_keypair() {
  if [ "$NEW_KEYPAIR" = true ]; then
    print_header "Generating New Program Keypair"
    
    # Backup old keypair if exists
    if [ -f "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" ]; then
      BACKUP_NAME="${TARGET_PATH}/${PROGRAM_NAME}-keypair-$(date +%Y%m%d-%H%M%S).json"
      cp "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" "$BACKUP_NAME"
      print_info "Backed up old keypair to: $BACKUP_NAME"
    fi
    
    # Generate new keypair
    solana-keygen new --outfile "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" --force --no-bip39-passphrase
    print_success "Generated new program keypair"
  fi
  
  # Ensure keypair exists
  if [ ! -f "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" ]; then
    print_info "No keypair found. Generating..."
    solana-keygen new --outfile "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" --force --no-bip39-passphrase
  fi
  
  # Get program ID
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  print_info "Program ID: ${PROGRAM_ID}"
}

# Update program ID in source files
update_program_id() {
  print_header "Updating Program ID"
  
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  
  # Update lib.rs
  if grep -q "declare_id!" "${PROGRAM_PATH}/src/lib.rs"; then
    sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"${PROGRAM_ID}\")/" "${PROGRAM_PATH}/src/lib.rs"
    rm -f "${PROGRAM_PATH}/src/lib.rs.bak"
    print_success "Updated programs/${PROGRAM_NAME}/src/lib.rs"
  fi
  
  # Update Anchor.toml
  if [ -f "Anchor.toml" ]; then
    # Check if devnet section exists
    if grep -q "\[programs.devnet\]" Anchor.toml; then
      sed -i.bak "s/\[programs.devnet\]/[programs.devnet]/" Anchor.toml
      sed -i.bak "/\[programs.devnet\]/,/\[/{s/${PROGRAM_NAME} = \".*\"/${PROGRAM_NAME} = \"${PROGRAM_ID}\"/}" Anchor.toml
    else
      # Add devnet section
      echo "" >> Anchor.toml
      echo "[programs.devnet]" >> Anchor.toml
      echo "${PROGRAM_NAME} = \"${PROGRAM_ID}\"" >> Anchor.toml
    fi
    rm -f Anchor.toml.bak
    print_success "Updated Anchor.toml"
  fi
  
  # Update IDL file
  if [ -f "${IDL_PATH}/${PROGRAM_NAME}.json" ]; then
    # Use Python or jq if available, otherwise manual update
    if command -v jq &> /dev/null; then
      jq --arg pid "$PROGRAM_ID" '.metadata.address = $pid' "${IDL_PATH}/${PROGRAM_NAME}.json" > "${IDL_PATH}/${PROGRAM_NAME}.json.tmp"
      mv "${IDL_PATH}/${PROGRAM_NAME}.json.tmp" "${IDL_PATH}/${PROGRAM_NAME}.json"
      print_success "Updated ${IDL_PATH}/${PROGRAM_NAME}.json"
    else
      print_warning "jq not found. Please manually update metadata.address in ${IDL_PATH}/${PROGRAM_NAME}.json"
    fi
  fi
  
  print_success "Program ID updated: ${PROGRAM_ID}"
}

# Build the program
build_program() {
  print_header "Building Program"
  
  if [ "$SKIP_BUILD" = false ]; then
    anchor build
    print_success "Build completed"
  else
    print_info "Skipping build (--skip-build)"
  fi
  
  # Verify build output
  if [ ! -f "${TARGET_PATH}/${PROGRAM_NAME}.so" ]; then
    print_error "Build failed: ${TARGET_PATH}/${PROGRAM_NAME}.so not found"
    exit 1
  fi
  
  print_success "Program binary: ${TARGET_PATH}/${PROGRAM_NAME}.so"
  ls -lh "${TARGET_PATH}/${PROGRAM_NAME}.so"
}

# Deploy to devnet
deploy_program() {
  print_header "Deploying to Devnet"
  
  print_info "Deploying ${PROGRAM_NAME}..."
  print_info "This may take 30-60 seconds..."
  
  # Run deployment
  anchor deploy --provider.cluster ${CLUSTER} --program-keypair "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json" 2>&1 | tee deploy_output.log
  
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Deployment successful!"
    
    # Extract and display program info
    PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
    print_info "Program ID: ${PROGRAM_ID}"
    
    # Get transaction signature from output
    SIGNATURE=$(grep -oP 'Signature: \K[a-zA-Z0-9]+' deploy_output.log || echo "N/A")
    if [ "$SIGNATURE" != "N/A" ]; then
      print_info "Transaction: https://explorer.solana.com/tx/${SIGNATURE}?cluster=devnet"
    fi
    
    rm -f deploy_output.log
  else
    print_error "Deployment failed!"
    rm -f deploy_output.log
    exit 1
  fi
}

# Update frontend configuration
update_frontend() {
  print_header "Updating Frontend Configuration"
  
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  
  # Ensure IDL directory exists
  mkdir -p "${IDL_PATH}"
  
  # Copy IDL to frontend
  if [ -f "target/idl/${PROGRAM_NAME}.json" ]; then
    cp "target/idl/${PROGRAM_NAME}.json" "${IDL_PATH}/${PROGRAM_NAME}.json"
    print_success "Copied IDL to ${IDL_PATH}/${PROGRAM_NAME}.json"
  fi
  
  # Update program ID in frontend config if exists
  if [ -f "app/src/config.ts" ]; then
    sed -i.bak "s/PROGRAM_ID = \".*\"/PROGRAM_ID = \"${PROGRAM_ID}\"/" "app/src/config.ts"
    rm -f "app/src/config.ts.bak"
    print_success "Updated app/src/config.ts"
  fi
  
  if [ -f "app/src/constants.ts" ]; then
    sed -i.bak "s/PROGRAM_ID = \".*\"/PROGRAM_ID = \"${PROGRAM_ID}\"/" "app/src/constants.ts"
    rm -f "app/src/constants.ts.bak"
    print_success "Updated app/src/constants.ts"
  fi
  
  # Create/update .env file
  cat > app/.env.local << EOF
# Solana Configuration
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_SOLANA_RPC_URL=${RPC_URL}
REACT_APP_PROGRAM_ID=${PROGRAM_ID}

# Generated by deploy-local.sh on $(date)
EOF
  print_success "Created app/.env.local"
}

# Verify deployment
verify_deployment() {
  print_header "Verifying Deployment"
  
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  
  print_info "Checking program account..."
  solana program show "${PROGRAM_ID}" || {
    print_error "Program not found on-chain!"
    return 1
  }
  
  print_info "Checking IDL..."
  anchor idl fetch "${PROGRAM_ID}" --provider.cluster ${CLUSTER} > /dev/null 2>&1 && {
    print_success "IDL verified"
  } || {
    print_warning "IDL not found or not verified"
  }
  
  # Check on explorer
  print_info "View on Explorer:"
  echo "  https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
  
  return 0
}

# Run tests
run_tests() {
  print_header "Running Tests"
  
  if [ -d "tests" ] && [ "$(ls -A tests)" ]; then
    print_info "Running test suite..."
    anchor test --skip-build --provider.cluster ${CLUSTER} 2>&1 | tail -20 || {
      print_warning "Some tests failed. Check output above."
    }
  else
    print_info "No tests found, skipping"
  fi
}

# Save deployment info
save_deployment_info() {
  print_header "Saving Deployment Info"
  
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  WALLET_ADDRESS=$(solana address)
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  cat > deployment-info.json << EOF
{
  "programName": "${PROGRAM_NAME}",
  "programId": "${PROGRAM_ID}",
  "network": "${CLUSTER}",
  "rpcUrl": "${RPC_URL}",
  "deployedAt": "${TIMESTAMP}",
  "deployedBy": "${WALLET_ADDRESS}",
  "version": "0.1.0",
  "idlPath": "${IDL_PATH}/${PROGRAM_NAME}.json",
  "programPath": "${TARGET_PATH}/${PROGRAM_NAME}.so",
  "explorerUrl": "https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
}
EOF
  
  print_success "Saved deployment-info.json"
}

# Main execution
main() {
  echo -e "${GREEN}"
  cat << "EOF"
    _                      __  __                                     
   / \   _ __   __ _ _ __ |  \/  | ___ _ __ ___  _ __ ___   ___ _ __ 
  / _ \ | '_ \ / _` | '_ \| |\/| |/ _ \ '_ ` _ \| '_ ` _ \ / _ \ '__|
 / ___ \| | | | (_| | | | | |  | |  __/ | | | | | | | | | |  __/ |   
/_/   \_\_| |_|\__,_|_| |_|_|  |_|\___|_| |_| |_|_| |_| |_|\___|_|   
                                                                     
EOF
  echo -e "${NC}"
  
  if [ "$VERIFY_ONLY" = true ]; then
    verify_deployment
    exit 0
  fi
  
  # Execute deployment steps
  check_prerequisites
  setup_solana
  generate_keypair
  update_program_id
  build_program
  deploy_program
  update_frontend
  verify_deployment
  run_tests
  save_deployment_info
  
  # Summary
  print_header "Deployment Complete! 🎉"
  
  PROGRAM_ID=$(solana address -k "${TARGET_PATH}/${PROGRAM_NAME}-keypair.json")
  
  echo -e "${GREEN}Program deployed successfully!${NC}"
  echo ""
  echo -e "${BLUE}Program ID:${NC}      ${PROGRAM_ID}"
  echo -e "${BLUE}Network:${NC}         ${CLUSTER}"
  echo -e "${BLUE}Explorer:${NC}        https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
  echo -e "${BLUE}IDL Location:${NC}    ${IDL_PATH}/${PROGRAM_NAME}.json"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "  1. Verify on Solana Explorer (link above)"
  echo "  2. Update your frontend .env with the new Program ID"
  echo "  3. Test the deployed program with: anchor test"
  echo "  4. Read VERIFICATION.md for detailed verification steps"
  echo ""
  echo -e "${GREEN}Happy building on Solana! 🚀${NC}"
}

# Run main function
main
