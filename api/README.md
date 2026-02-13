# AgentMemory REST API

REST API server for AgentMemory Protocol — enabling AI agents to store persistent memory on Solana via HTTP.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Health
- `GET /health` — Server status

### Vaults
- `POST /api/v1/vaults` — Create vault
- `GET /api/v1/vaults` — List vaults
- `GET /api/v1/vaults/:id` — Get vault

### Memories
- `POST /api/v1/memories` — Store memory
- `GET /api/v1/memories` — Retrieve memories
- `DELETE /api/v1/memories/:key` — Delete memory

## Example Usage

```bash
# Create vault
curl -X POST http://localhost:3001/api/v1/vaults \
  -H "Content-Type: application/json" \
  -d '{"owner": "your_pubkey"}'

# Store memory
curl -X POST http://localhost:3001/api/v1/memories \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "vault_address",
    "key": "my_memory",
    "content": "encrypted_data",
    "tags": ["test"]
  }'
```

See `../skills/agentmemory-client/SKILL.md` for agent integration examples.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `SOLANA_NETWORK` | devnet | Network (devnet/mainnet) |
| `SOLANA_RPC_URL` | — | RPC endpoint |
| `AGENTMEMORY_PROGRAM_ID` | — | Solana program ID |

## Deployment

### Render/Railway
1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Docker (optional)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Architecture

```
api/
├── src/
│   ├── index.ts         # Express server
│   ├── routes/
│   │   ├── vaults.ts    # Vault endpoints
│   │   └── memories.ts  # Memory endpoints
│   └── types/           # TypeScript types
├── package.json
└── tsconfig.json
```

---

*Part of AgentMemory Protocol*
