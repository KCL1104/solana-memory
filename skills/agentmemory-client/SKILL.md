# AgentMemory REST API Skill

**Skill ID**: `agentmemory-api`  
**Version**: 1.0.0  
**Purpose**: REST API for AI agents to store, retrieve, and manage persistent memory on Solana

---

## Overview

This REST API provides a simple HTTP interface for AI agents to interact with AgentMemory Protocol. Instead of directly managing Solana blockchain interactions, agents can use familiar HTTP requests.

**Base URL**: `http://localhost:3001` (local) or your deployed endpoint

---

## Quick Start

### 1. Start the API Server

```bash
cd api/
npm install
npm run dev
```

### 2. Health Check

```bash
curl http://localhost:3001/health
```

### 3. Create a Vault

```bash
curl -X POST http://localhost:3001/api/v1/vaults \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your_solana_public_key"
  }'
```

### 4. Store a Memory

```bash
curl -X POST http://localhost:3001/api/v1/memories \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": "vault_address_from_step_3",
    "key": "user_preferences",
    "content": "encrypted_content_here",
    "tags": ["preferences"]
  }'
```

---

## API Endpoints

### Vaults

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/vaults` | Create a new vault |
| `GET` | `/api/v1/vaults` | List vaults for owner |
| `GET` | `/api/v1/vaults/:id` | Get vault details |

### Memories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/memories` | Store a memory |
| `GET` | `/api/v1/memories` | Retrieve memories |
| `DELETE` | `/api/v1/memories/:key` | Delete a memory |

---

## Usage Examples for Agents

### Python Agent

```python
import requests

BASE_URL = "http://localhost:3001"

class AgentMemoryClient:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.vault_id = None
    
    def create_vault(self, owner_public_key: str):
        """Create a new memory vault"""
        response = requests.post(
            f"{self.base_url}/api/v1/vaults",
            json={"owner": owner_public_key}
        )
        data = response.json()
        if data["success"]:
            self.vault_id = data["vault"]["id"]
        return data
    
    def store_memory(self, key: str, content: str, tags: list = None):
        """Store encrypted memory"""
        response = requests.post(
            f"{self.base_url}/api/v1/memories",
            json={
                "vaultId": self.vault_id,
                "key": key,
                "content": content,
                "tags": tags or []
            }
        )
        return response.json()
    
    def get_memories(self, key: str = None, tags: list = None):
        """Retrieve memories"""
        params = {"vaultId": self.vault_id}
        if key:
            params["key"] = key
        if tags:
            params["tags"] = ",".join(tags)
        
        response = requests.get(
            f"{self.base_url}/api/v1/memories",
            params=params
        )
        return response.json()

# Usage
client = AgentMemoryClient()
client.create_vault("your_solana_pubkey")
client.store_memory("user_name", "encrypted:Alice", ["profile"])
result = client.get_memories(key="user_name")
```

### JavaScript/TypeScript Agent

```typescript
class AgentMemoryClient {
  private baseUrl: string;
  private vaultId: string | null = null;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async createVault(owner: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/vaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner })
    });
    const data = await response.json();
    if (data.success) {
      this.vaultId = data.vault.id;
    }
    return data;
  }

  async storeMemory(
    key: string,
    content: string,
    tags?: string[],
    metadata?: Record<string, any>
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vaultId: this.vaultId,
        key,
        content,
        tags,
        metadata
      })
    });
    return response.json();
  }

  async getMemories(filters?: {
    key?: string;
    tags?: string[];
    limit?: number;
  }): Promise<any> {
    const params = new URLSearchParams({ vaultId: this.vaultId! });
    if (filters?.key) params.append('key', filters.key);
    if (filters?.tags) params.append('tags', filters.tags.join(','));
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(
      `${this.baseUrl}/api/v1/memories?${params}`
    );
    return response.json();
  }
}

// Usage
const client = new AgentMemoryClient();
await client.createVault('your_solana_pubkey');
await client.storeMemory('preferences', 'encrypted:data', ['user']);
const memories = await client.getMemories({ tags: ['user'] });
```

### cURL (Any Language)

```bash
# Create vault
VAULT=$(curl -s -X POST http://localhost:3001/api/v1/vaults \
  -H "Content-Type: application/json" \
  -d '{"owner": "your_pubkey"}' | jq -r '.vault.id')

# Store memory
curl -X POST http://localhost:3001/api/v1/memories \
  -H "Content-Type: application/json" \
  -d "{
    \"vaultId\": \"$VAULT\",
    \"key\": \"greeting\",
    \"content\": \"encrypted:Hello World\",
    \"tags\": [\"test\"]
  }"

# Retrieve
curl "http://localhost:3001/api/v1/memories?vaultId=$VAULT&key=greeting"
```

---

## Common Workflows

### Session Persistence

```python
# On agent startup
session = client.get_memories(key="session_state")
if session["count"] > 0:
    current_session = decrypt(session["memories"][0]["content"])
else:
    current_session = {"started": time.now(), "messages": 0}

# On shutdown
client.store_memory(
    key="session_state",
    content=encrypt(current_session),
    tags=["session"]
)
```

### User Profile Management

```python
def update_user_profile(user_id: str, updates: dict):
    key = f"user:{user_id}"
    
    # Get existing
    existing = client.get_memories(key=key)
    profile = {}
    if existing["count"] > 0:
        profile = decrypt(existing["memories"][0]["content"])
    
    # Merge
    profile.update(updates)
    profile["lastUpdated"] = time.now()
    
    # Store
    client.store_memory(
        key=key,
        content=encrypt(profile),
        tags=["user_profile", f"user:{user_id}"]
    )
    return profile
```

### Knowledge Base

```python
def learn(topic: str, content: str):
    client.store_memory(
        key=f"knowledge:{topic}:{time.now()}",
        content=encrypt({"topic": topic, "content": content}),
        tags=["knowledge", topic]
    )

def recall(topic: str):
    return client.get_memories(tags=["knowledge", topic])
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Human readable message",
  "details": {} // Optional additional info
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing params)
- `404` - Not Found
- `500` - Server Error

---

## Security Notes

1. **Client-Side Encryption** — Content should be encrypted before sending to API
2. **HTTPS in Production** — Always use HTTPS for production deployments
3. **Authentication** — Consider adding API keys for production use
4. **Rate Limiting** — Built-in rate limiting available via environment variables

---

## Deployment

### Local Development
```bash
cd api/
npm install
npm run dev
```

### Production (Render/Railway)
```bash
npm install
npm run build
npm start
```

**Environment Variables:**
- `PORT` - Server port (default: 3001)
- `SOLANA_NETWORK` - devnet or mainnet
- `SOLANA_RPC_URL` - RPC endpoint
- `AGENTMEMORY_PROGRAM_ID` - Solana program ID

---

## Resources

- **API Code**: `/api/` directory in this repo
- **SDK**: `../src/` for direct Solana integration
- **Live Demo**: Frontend at `../app/`
- **GitHub**: https://github.com/KCL1104/solana-memory

---

*Built for the Colosseum Agent Hackathon 2026*
