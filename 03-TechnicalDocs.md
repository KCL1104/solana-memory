# ChainIntel AI - 技術文檔

## 目錄
1. [系統架構總覽](#系統架構總覽)
2. [核心組件](#核心組件)
3. [智能合約架構](#智能合約架構)
4. [API 文檔](#api-文檔)
5. [部署指南](#部署指南)
6. [安全考慮](#安全考慮)

---

## 系統架構總覽

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              應用層 (Application Layer)                       │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│   Web App    │   Mobile SDK │  Python SDK  │  Node.js SDK │  Enterprise API │
│   (React)    │   (iOS/And)  │   (PyPI)     │   (npm)      │   (REST/GraphQL)│
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              網關層 (Gateway Layer)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  API Gateway (Kong/AWS)  →  Rate Limiting  →  Auth (JWT + Wallet)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              協議層 (Protocol Layer)                          │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│  DataMarket  │ IntelEngine  │   Staking    │  Governance  │   Bridge        │
│  Protocol    │  Protocol    │   Contract   │     DAO      │  Protocol       │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              執行層 (Execution Layer)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  EVM L2 (Base/Sroll)  +  Solana  +  Celestia DA  +  Cosmos SDK Zones         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              存儲層 (Storage Layer)                           │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│     IPFS     │   Filecoin   │   Arweave    │   S3 (熱數據) │  Encrypted DB   │
│   (內容尋址)  │  (持久化存儲) │  (永久存儲)   │   (緩存)     │  (敏感數據)     │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              網絡層 (Network Layer)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│         P2P Data Mesh (libp2p)  +  Gossip Protocol  +  DHT Routing           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 數據流圖

```
數據提供者流程:
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  數據    │───▶│   數據預處理  │───▶│   質押 $INTEL │───▶│  發布數據    │
│  準備    │    │   (標準化)   │    │   (信譽擔保)  │    │  上鏈       │
└──────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                               │
┌─────────────────────────────────────────────────────────────────────────┐
│                           數據驗證流程                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  採樣驗證    │───▶│  ZK Proof    │───▶│  共識確認    │              │
│  │  (隨機節點)  │    │  (完整性)    │    │  (多簽)     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  數據上市    │
                        │  定價/拍賣   │
                        └──────────────┘

數據消費者流程:
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  搜索    │───▶│   質量評估   │───▶│   支付購買   │───▶│   獲取訪問   │
│  數據    │    │   (評分查看) │    │   ($INTEL)   │    │   (解密密鑰) │
└──────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                               │
                        ┌───────────────────────────────────────┘
                        ▼
               ┌────────────────┐
               │  AI 訓練/分析  │
               │  (本地或云端)  │
               └────────────────┘
```

---

## 核心組件

### 1. DataLayer - 數據存儲層

#### 1.1 架構設計

```typescript
interface DataLayerConfig {
  storageProviders: ('ipfs' | 'filecoin' | 'arweave' | 's3')[];
  redundancyLevel: number;        // 冗余副本數
  encryptionScheme: 'aes-256-gcm' | 'chacha20-poly1305';
  chunkSize: number;              // 分片大小 (默認 256KB)
}

interface DataPackage {
  id: string;                     // CID (Content Identifier)
  metadata: DataMetadata;
  chunks: DataChunk[];
  proof: ZKDataProof;
  accessControl: AccessPolicy;
}

interface DataMetadata {
  schema: DataSchema;
  timestamp: number;
  provider: Address;
  size: number;
  checksum: string;
  quality: QualityMetrics;
  category: DataCategory;
  tags: string[];
  license: LicenseType;
}
```

#### 1.2 存儲策略

| 數據類型 | 存儲方案 | 理由 |
|---------|---------|------|
| 小文件 (<1MB) | IPFS + 本地緩存 | 快速訪問 |
| 大文件 (>1MB) | Filecoin + IPFS | 經濟持久 |
| 永久存檔 | Arweave | 一次性付費永久存儲 |
| 熱數據 | S3-compatible | 低延遲訪問 |
| 敏感數據 | 加密後分散存儲 | 安全合規 |

### 2. IntelEngine - AI 處理引擎

#### 2.1 聯邦學習架構

```python
# 聯邦學習節點實現
class FederatedNode:
    def __init__(self, node_id: str, model_config: ModelConfig):
        self.node_id = node_id
        self.local_model = self._init_model(model_config)
        self.data_shard = LocalDataShard()
        self.zk_prover = ZKProver()
    
    def local_train(self, epochs: int) -> LocalUpdate:
        """本地訓練，數據不離開節點"""
        for epoch in range(epochs):
            self.local_model.train(self.data_shard)
        
        # 生成訓練證明
        proof = self.zk_prover.generate_proof(
            model_update=self.local_model.get_update(),
            data_commitment=self.data_shard.commitment
        )
        
        return LocalUpdate(
            node_id=self.node_id,
            model_delta=self.local_model.get_delta(),
            proof=proof,
            metrics=self.local_model.evaluate()
        )
    
    def secure_aggregation(self, updates: List[LocalUpdate]) -> GlobalModel:
        """安全聚合，使用 MPC"""
        # 使用 Shamir Secret Sharing
        aggregated = mpc_aggregate(updates)
        
        # 驗證所有證明
        for update in updates:
            assert self.zk_prover.verify(update.proof)
        
        return self.local_model.apply_update(aggregated)
```

#### 2.2 ZKML (零知識機器學習)

```rust
// Rust 實現 ZKML 證明生成
use ark_ff::Field;
use ark_snark::SNARK;

pub struct ZKMLCircuit<F: Field> {
    // 模型參數承諾
    model_commitment: Vec<F>,
    // 輸入數據承諾
    input_commitment: Vec<F>,
    // 輸出結果
    output: Vec<F>,
    // 激活函數電路
    activation_layers: Vec<ActivationLayer<F>>,
}

impl<F: Field> Circuit<F> for ZKMLCircuit<F> {
    fn synthesize<CS: ConstraintSystem<F>>(
        self,
        cs: &mut CS
    ) -> Result<(), SynthesisError> {
        // 構建神經網絡電路
        let mut current = self.input_commitment;
        
        for (i, layer) in self.activation_layers.iter().enumerate() {
            current = layer.apply(cs, &current, i)?;
        }
        
        // 約束輸出等於聲明值
        for (i, (c, o)) in current.iter().zip(self.output.iter()).enumerate() {
            cs.enforce(
                || format!("output_{}", i),
                |lc| lc + c,
                |lc| lc + CS::one(),
                |lc| lc + o,
            );
        }
        
        Ok(())
    }
}

pub fn generate_inference_proof(
    model: &Model,
    input: &Data,
    output: &Prediction,
) -> ZKProof {
    let circuit = ZKMLCircuit::new(model, input, output);
    Groth16::prove(&circuit, &proving_key).unwrap()
}
```

### 3. MarketHub - 數據市場協議

#### 3.1 智能合約架構

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DataMarketplace is ReentrancyGuard {
    
    // 數據列表結構
    struct DataListing {
        bytes32 dataId;
        address provider;
        uint256 price;
        PricingModel pricingModel;
        bytes32 metadataCID;
        bytes32 zkProofCID;
        uint256 stakeAmount;
        uint256 qualityScore;
        bool isActive;
        uint256 createdAt;
    }
    
    // 定價模型
    enum PricingModel {
        FIXED,          // 固定價格
        DYNAMIC,        // 動態定價 (基於供需)
        AUCTION,        // 拍賣
        SUBSCRIPTION    // 訂閱制
    }
    
    // 存儲
    mapping(bytes32 => DataListing) public listings;
    mapping(bytes32 => mapping(address => bool)) public accessRights;
    mapping(address => uint256) public providerRevenue;
    
    IERC20 public intelToken;
    address public treasury;
    uint256 public platformFee = 250; // 2.5% (basis points)
    
    // 事件
    event DataListed(bytes32 indexed dataId, address indexed provider, uint256 price);
    event DataPurchased(bytes32 indexed dataId, address indexed buyer, uint256 price);
    event QualityScored(bytes32 indexed dataId, uint256 newScore);
    
    // 列出數據
    function listData(
        bytes32 dataId,
        uint256 price,
        PricingModel model,
        bytes32 metadataCID,
        bytes32 zkProofCID,
        uint256 stakeAmount
    ) external {
        require(stakeAmount >= minStake, "Insufficient stake");
        require(intelToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake failed");
        
        listings[dataId] = DataListing({
            dataId: dataId,
            provider: msg.sender,
            price: price,
            pricingModel: model,
            metadataCID: metadataCID,
            zkProofCID: zkProofCID,
            stakeAmount: stakeAmount,
            qualityScore: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit DataListed(dataId, msg.sender, price);
    }
    
    // 購買數據
    function purchaseData(bytes32 dataId) external nonReentrant {
        DataListing storage listing = listings[dataId];
        require(listing.isActive, "Listing not active");
        
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 providerShare = listing.price - fee;
        
        // 轉賬
        require(intelToken.transferFrom(msg.sender, listing.provider, providerShare), "Payment failed");
        require(intelToken.transferFrom(msg.sender, treasury, fee), "Fee transfer failed");
        
        // 授予訪問權
        accessRights[dataId][msg.sender] = true;
        providerRevenue[listing.provider] += providerShare;
        
        emit DataPurchased(dataId, msg.sender, listing.price);
    }
    
    // 動態定價算法
    function calculateDynamicPrice(bytes32 dataId) public view returns (uint256) {
        DataListing storage listing = listings[dataId];
        require(listing.pricingModel == PricingModel.DYNAMIC, "Not dynamic pricing");
        
        // 基於供需和質量評分計算價格
        uint256 demand = getDemandFactor(dataId);
        uint256 quality = listing.qualityScore;
        uint256 basePrice = listing.price;
        
        // 價格 = 基礎價格 * (1 + 需求因子) * (質量加成)
        return basePrice * (100 + demand) * (100 + quality / 10) / 10000;
    }
}
```

---

## API 文檔

### REST API 端點

#### 基礎資訊

```
Base URL: https://api.chainintel.ai/v1
Authentication: Bearer Token (JWT) 或 Wallet Signature
Rate Limit: 1000 requests/minute (API Key), 100/minute (匿名)
Content-Type: application/json
```

#### 1. 數據發布 API

**POST /data/list**

發布新數據到市場。

**Request:**
```json
{
  "name": "Financial Market Dataset Q1 2024",
  "description": "High-frequency trading data with sentiment analysis",
  "category": "financial",
  "tags": ["trading", "sentiment", "real-time"],
  "schema": {
    "fields": [
      {"name": "timestamp", "type": "datetime"},
      {"name": "price", "type": "float"},
      {"name": "volume", "type": "integer"},
      {"name": "sentiment_score", "type": "float"}
    ]
  },
  "pricing": {
    "model": "fixed",
    "price": 500,
    "currency": "INTEL"
  },
  "data_files": [
    {
      "cid": "QmXxxxxx...",
      "size": 1073741824,
      "format": "parquet"
    }
  ],
  "sample_data_cid": "QmYyyyy...",
  "stake_amount": 10000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listing_id": "0x7a3f...8e2d",
    "data_id": "0x9b2c...1f4a",
    "status": "pending_verification",
    "estimated_verification_time": 180,
    "zk_proof_cid": "QmZzzzz...",
    "verification_tx_hash": "0xabc..."
  }
}
```

#### 2. 數據搜索 API

**GET /data/search**

搜索可用的數據集。

**Query Parameters:**
```
category: string (optional) - 數據類別
min_quality: number (optional) - 最低質量評分 (0-100)
max_price: number (optional) - 最高價格
format: string (optional) - 數據格式 (csv, json, parquet)
sort_by: string (optional) - 排序方式 (relevance, price, quality, date)
page: number (optional) - 頁碼，默認 1
limit: number (optional) - 每頁數量，默認 20
```

**Response:**
```json
{
  "total": 1543,
  "page": 1,
  "limit": 20,
  "results": [
    {
      "listing_id": "0x7a3f...8e2d",
      "name": "Financial Market Dataset Q1 2024",
      "provider": "0x1234...5678",
      "provider_reputation": 4.8,
      "price": 500,
      "currency": "INTEL",
      "quality_score": 94,
      "downloads": 342,
      "category": "financial",
      "size": 1073741824,
      "format": "parquet",
      "sample_preview": {
        "cid": "QmYyyyy...",
        "rows": 100
      },
      "updated_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

#### 3. 數據購買 API

**POST /data/purchase**

購買數據訪問權限。

**Request:**
```json
{
  "listing_id": "0x7a3f...8e2d",
  "payment_method": "intel_token",
  "license_type": "single_use"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchase_id": "0xdef...789",
    "transaction_hash": "0xfed...cba",
    "access_granted": true,
    "access_expires": null,
    "download_credentials": {
      "access_key": "AKIA...",
      "secret_key": "****",
      "session_token": "FwoGZXIvYXdzEBYaDG...",
      "expires_in": 3600
    },
    "data_endpoints": [
      {
        "protocol": "ipfs",
        "url": "https://ipfs.chainintel.ai/ipfs/QmXxxxxx..."
      },
      {
        "protocol": "s3",
        "url": "s3://chainintel-data/0x7a3f.../data.parquet"
      }
    ]
  }
}
```

#### 4. IntelEngine - AI 訓練 API

**POST /intel/train**

提交聯邦學習任務。

**Request:**
```json
{
  "task_name": "Sentiment Analysis Model v2",
  "model_config": {
    "architecture": "transformer",
    "base_model": "bert-base-uncased",
    "num_labels": 3
  },
  "training_config": {
    "epochs": 5,
    "batch_size": 32,
    "learning_rate": 2e-5,
    "federation_rounds": 10
  },
  "data_requirements": {
    "min_quality": 80,
    "categories": ["social_media", "news"],
    "min_samples": 10000,
    "required_fields": ["text", "label"]
  },
  "privacy_config": {
    "differential_privacy": true,
    "epsilon": 1.0,
    "secure_aggregation": true
  },
  "budget": {
    "max_intel": 50000,
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "task_id": "task_0x8f3e...2a1b",
  "status": "recruiting_nodes",
  "estimated_nodes": 50,
  "estimated_completion": "2024-03-20T15:00:00Z",
  "cost_estimate": {
    "intel_token": 35000,
    "breakdown": {
      "compute": 25000,
      "data_access": 8000,
      "verification": 2000
    }
  }
}
```

**WebSocket 實時更新:**
```
ws://api.chainintel.ai/v1/ws/tasks/{task_id}

消息類型:
- node_joined: 新節點加入訓練
- round_completed: 聯邦學習輪次完成
- model_updated: 模型更新可用
- task_completed: 任務完成
```

### SDK 使用示例

#### Python SDK

```python
from chainintel import ChainIntelClient

# 初始化客戶端
client = ChainIntelClient(
    api_key="your_api_key",
    private_key="your_wallet_private_key"
)

# 搜索數據
datasets = client.data.search(
    category="financial",
    min_quality=90,
    max_price=1000
)

for ds in datasets:
    print(f"{ds.name}: {ds.price} INTEL (Quality: {ds.quality_score})")

# 購買數據
purchase = client.data.purchase(
    listing_id=datasets[0].id,
    license_type="unlimited"
)

# 下載數據
import pandas as pd
data = client.data.download(purchase.download_url)
df = pd.read_parquet(data)

# 發起聯邦學習任務
task = client.intel.train(
    model_config={
        "architecture": "transformer",
        "base_model": "bert-base-uncased"
    },
    data_requirements={
        "categories": ["social_media"],
        "min_samples": 50000
    }
)

# 監聽訓練進度
for update in task.stream_updates():
    print(f"Round {update.round}: Loss = {update.metrics.loss:.4f}")
    if update.status == "completed":
        model = client.intel.download_model(task.id)
        model.save("my_model.pt")
```

#### JavaScript/TypeScript SDK

```typescript
import { ChainIntelClient } from '@chainintel/sdk';

const client = new ChainIntelClient({
  apiKey: process.env.CHAININTEL_API_KEY,
  wallet: window.ethereum, // 或 Node.js 中的私鑰
});

// 發布數據
async function publishDataset() {
  const listing = await client.data.publish({
    name: 'Web3 Social Graph Data',
    description: 'Decentralized social network connection data',
    files: [
      { path: './social_graph.parquet', cid: 'Qm...' }
    ],
    pricing: {
      model: 'subscription',
      monthlyPrice: 100,
      currency: 'INTEL'
    },
    stakeAmount: 5000
  });
  
  console.log(`Listed with ID: ${listing.id}`);
  
  // 等待驗證
  const verified = await client.waitForVerification(listing.id);
  console.log('Data verified and listed!');
}

// 實時質量評分監控
client.data.onQualityUpdate((dataId, newScore) => {
  console.log(`Data ${dataId} quality updated: ${newScore}`);
});

// 參與聯邦學習 (作為節點)
const node = await client.intel.joinFederation({
  computeCapacity: 'high',  // GPU 可用
  dataContribution: {
    categories: ['social_media'],
    approxSize: '100GB'
  }
});

node.onTask(async (task) => {
  console.log(`New training task: ${task.id}`);
  // SDK 自動處理本地訓練和證明生成
  await node.executeTask(task);
});
```

---

## 部署指南

### 系統要求

| 組件 | 最低配置 | 推薦配置 |
|------|---------|---------|
| 驗證者節點 | 8 CPU, 16GB RAM, 500GB SSD | 16 CPU, 32GB RAM, 1TB NVMe |
| 數據提供者節點 | 4 CPU, 8GB RAM, 2TB HDD | 8 CPU, 16GB RAM, 4TB HDD |
| IntelEngine 節點 | 8 CPU, 32GB RAM, 1TB SSD, GPU | 16 CPU, 64GB RAM, 2TB NVMe, A100 |
| 全節點 | 4 CPU, 8GB RAM, 200GB SSD | 8 CPU, 16GB RAM, 500GB SSD |

### Docker 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  chainintel-node:
    image: chainintel/node:latest
    container_name: chainintel-validator
    restart: unless-stopped
    ports:
      - "26656:26656"  # P2P
      - "26657:26657"  # RPC
      - "1317:1317"    # API
      - "9090:9090"    # gRPC
    volumes:
      - ./data:/root/.chainintel
      - ./config:/root/.chainintel/config
    environment:
      - CHAININTEL_MONIKER=my-validator-node
      - CHAININTEL_STAKE=1000000
      - CHAININTEL_NETWORK=mainnet
    command: >
      chainintel start
      --rpc.laddr=tcp://0.0.0.0:26657
      --api.address=tcp://0.0.0.0:1317
      
  ipfs-node:
    image: ipfs/kubo:latest
    container_name: chainintel-ipfs
    restart: unless-stopped
    ports:
      - "4001:4001"    # P2P
      - "5001:5001"    # API
      - "8080:8080"    # Gateway
    volumes:
      - ipfs-data:/data/ipfs
      - ipfs-staging:/export
    environment:
      - IPFS_PROFILE=server
      - IPFS_SWARM_KEY=/key/swarm.key
      
  intel-engine:
    image: chainintel/intel-engine:latest
    container_name: chainintel-intel
    restart: unless-stopped
    runtime: nvidia  # GPU 支持
    ports:
      - "8081:8081"
    volumes:
      - ./models:/app/models
      - ./training-data:/app/data
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - CHAININTEL_NODE_URL=http://chainintel-node:26657
      - FEDERATION_ENABLED=true
      
  monitoring:
    image: prom/prometheus:latest
    container_name: chainintel-prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
      
volumes:
  ipfs-data:
  ipfs-staging:
  prometheus-data:
```

### Kubernetes 部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: chainintel-validator
  namespace: chainintel
spec:
  serviceName: chainintel-validator
  replicas: 3
  selector:
    matchLabels:
      app: chainintel-validator
  template:
    metadata:
      labels:
        app: chainintel-validator
    spec:
      containers:
      - name: validator
        image: chainintel/node:v1.2.0
        ports:
        - containerPort: 26656
          name: p2p
        - containerPort: 26657
          name: rpc
        resources:
          requests:
            memory: "16Gi"
            cpu: "8"
          limits:
            memory: "32Gi"
            cpu: "16"
        volumeMounts:
        - name: data
          mountPath: /root/.chainintel
        - name: config
          mountPath: /root/.chainintel/config
        env:
        - name: CHAININTEL_MONIKER
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: CHAININTEL_STAKE
          value: "1000000"
        livenessProbe:
          httpGet:
            path: /health
            port: 26657
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 26657
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Ti
      storageClassName: fast-ssd
---
apiVersion: v1
kind: Service
metadata:
  name: chainintel-validator
  namespace: chainintel
spec:
  selector:
    app: chainintel-validator
  ports:
  - name: p2p
    port: 26656
    targetPort: 26656
  - name: rpc
    port: 26657
    targetPort: 26657
  clusterIP: None
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chainintel-validator-hpa
  namespace: chainintel
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: chainintel-validator
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 驗證者節點設置

```bash
#!/bin/bash
# setup-validator.sh

# 安裝依賴
sudo apt-get update
sudo apt-get install -y build-essential jq curl

# 下載 ChainIntel 二進制文件
curl -L https://github.com/chainintel/chainintel/releases/download/v1.0.0/chainintel-linux-amd64 -o chainintel
chmod +x chainintel
sudo mv chainintel /usr/local/bin/

# 初始化節點
chainintel init my-validator-node --chain-id chainintel-mainnet-1

# 下載創世文件
curl https://raw.githubusercontent.com/chainintel/mainnet/main/genesis.json > ~/.chainintel/config/genesis.json

# 配置節點
sed -i 's/seeds = ""/seeds = "seed1.chainintel.ai:26656,seed2.chainintel.ai:26656"/g' ~/.chainintel/config/config.toml
sed -i 's/persistent_peers = ""/persistent_peers = "peer1@x.x.x.x:26656,peer2@y.y.y.y:26656"/g' ~/.chainintel/config/config.toml

# 啟用狀態同步
sed -i 's/enable = false/enable = true/g' ~/.chainintel/config/config.toml
LATEST_HEIGHT=$(curl -s http://rpc.chainintel.ai:26657/block | jq -r .result.block.header.height)
BLOCK_HEIGHT=$((LATEST_HEIGHT - 1000))
TRUST_HASH=$(curl -s "http://rpc.chainintel.ai:26657/block?height=$BLOCK_HEIGHT" | jq -r .result.block_id.hash)

sed -i "s/trust_height = 0/trust_height = $BLOCK_HEIGHT/g" ~/.chainintel/config/config.toml
sed -i "s/trust_hash = \"\"/trust_hash = \"$TRUST_HASH\"/g" ~/.chainintel/config/config.toml

# 創建系統服務
sudo tee /etc/systemd/system/chainintel.service > /dev/null <<EOF
[Unit]
Description=ChainIntel Node
After=network-online.target

[Service]
User=$USER
ExecStart=/usr/local/bin/chainintel start
Restart=always
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chainintel

# 啟動節點
sudo systemctl start chainintel

# 監控同步狀態
watch -n 1 'curl -s localhost:26657/status | jq .result.sync_info'

# 創建驗證者 (同步完成後)
chainintel tx staking create-validator \
  --amount=1000000uintel \
  --pubkey=$(chainintel tendermint show-validator) \
  --moniker="my-validator-node" \
  --chain-id=chainintel-mainnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1000000" \
  --gas="auto" \
  --gas-adjustment=1.5 \
  --gas-prices="0.025uintel" \
  --from=mykey

echo "驗證者節點設置完成！"
```

---

## 安全考慮

### 1. 智能合約安全

- ✅ **多輪審計**: Trail of Bits, OpenZeppelin, CertiK
- ✅ **形式化驗證**: 關鍵邏輯使用 Certora 驗證
- ✅ **Bug Bounty**: Immunefi 上線 $500K 賞金計劃
- ✅ **時間鎖**: 合約升級 48 小時延遲
- ✅ **多簽控制**: 關鍵操作需要 3/5 多簽

### 2. 密碼學安全

```
加密方案:
├── 數據加密: AES-256-GCM
├── 密鑰交換: ECDH (Curve25519)
├── 簽名方案: ECDSA (secp256k1) + Ed25519
├── ZK 系統: Groth16 + PlonK
└── 哈希函數: Blake2b + Poseidon

密鑰管理:
├── 硬件安全模塊 (HSM) 存儲
├── 分片密鑰託管 (Shamir Secret Sharing)
├── 定期密鑰輪換
└── 緊急暫停機制
```

### 3. 網絡安全

- DDoS 防護: Cloudflare + 自定義速率限制
- 節點隔離: 驗證者節點使用專用網絡
- 入侵檢測: 24/7 監控和自動響應
- 零信任架構: 所有服務間通信 mTLS

### 4. 數據隱私

- 差分隱私: 聯邦學習中加入 DP-SGD
- 安全多方計算 (MPC): 敏感計算使用 MPC
- 數據最小化: 僅收集必要數據
- 審計日誌: 所有數據訪問記錄上鏈

---

## 附錄

### 環境變量參考

```bash
# 節點配置
CHAININTEL_MONIKER=validator-node-1
CHAININTEL_NETWORK=mainnet|testnet|devnet
CHAININTEL_HOME=/root/.chainintel
CHAININTEL_LOG_LEVEL=info|debug|error

# 質押配置
CHAININTEL_MIN_STAKE=1000000
CHAININTEL_COMMISSION_RATE=0.10

# 存儲配置
IPFS_API_URL=/ip4/127.0.0.1/tcp/5001
FILECOIN_RPC_URL=https://api.node.glif.io
ARWEAVE_GATEWAY=https://arweave.net

# AI 引擎配置
INTEL_ENGINE_GPU_ENABLED=true
INTEL_ENGINE_MAX_MEMORY=32GB
FEDERATION_NODE_CAPACITY=high

# API 配置
API_RATE_LIMIT=1000
API_JWT_SECRET=xxx
CORS_ALLOWED_ORIGINS=https://chainintel.ai
```

### 監控告警

```yaml
# prometheus-rules.yml
groups:
- name: chainintel-alerts
  rules:
  - alert: HighBlockTime
    expr: histogram_quantile(0.99, rate(chainintel_block_time_bucket[5m])) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Block time is too high"
      
  - alert: ValidatorJailed
    expr: chainintel_validator_jailed == 1
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Validator has been jailed"
      
  - alert: LowPeerCount
    expr: chainintel_p2p_peers < 5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Low peer count detected"
```

---

*Document Version: 1.0.0*
*Last Updated: 2024-03-15*
*For updates: docs.chainintel.ai*
