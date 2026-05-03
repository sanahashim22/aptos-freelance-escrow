# Freelance Code Evaluation Platform - Aptos Escrow DApp

A trustless DApp on Aptos blockchain that automates freelance code evaluation
and payment release using Move smart contracts, IPFS (Pinata), and Docker.

## Tech Stack
- Blockchain: Aptos Testnet (Move language)
- Oracle: Node.js + Aptos TypeScript SDK + Docker (Python/JS/Java)
- Frontend: React.js + Vite + Petra Wallet
- Storage: IPFS via Pinata


## Phase 2: Architecture & Initial Implementation

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/aptos-freelance-escrow
cd aptos-freelance-escrow
npm install  # root deps
cd oracle && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure
Edit oracle/index.js and frontend/src/aptos.js:
Replace YOUR_ORACLE_ADDRESS_HERE with your Aptos account address.

### 3. Deploy contract
```bash
aptos init --network devnet
aptos move compile --named-addresses escrow=default
aptos move publish --named-addresses escrow=default --assume-yes
```

### 4. Start Oracle
```bash
cd oracle && node index.js
```

### 5. Start Frontend
```bash
cd frontend && npm run dev
# Open http://localhost:5173
```

## Demo Flow
1. Client connects Petra Wallet → creates milestone → locks APT
2. Freelancer submits code CID (uploaded to IPFS)
3. Oracle automatically evaluates code in Docker
4. If tests pass → APT auto-released to freelancer
5. If tests fail → funds held; client can retry or refund


## Phase 3: Core Implementation & Validation

## Prerequisites
- Ubuntu 22.04 (or WSL2 on Windows)
- Aptos CLI v9.x: curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
- Node.js v20: via nodesource setup_20.x
- Docker Engine v24+
- Petra Wallet Chrome extension (https://petra.app)
- Pinata account for IPFS uploads (https://pinata.cloud)

## Setup & Run

### 1. Clone
git clone https://github.com/sanahashim22/aptos-freelance-escrow
cd aptos-freelance-escrow

### 2. Install dependencies
cd oracle && npm install && cd ..
cd frontend && npm install && cd ..
npm install node-fetch form-data

### 3. Initialize Aptos CLI
aptos init --network testnet
aptos account fund-with-faucet --account default --faucet-url https://faucet.testnet.aptoslabs.com

### 4. Deploy contract
aptos move compile --named-addresses escrow=default
aptos move publish --named-addresses escrow=default --assume-yes --max-gas 100000
aptos move run --function-id default::escrow::initialize --assume-yes --max-gas 10000

### 5. Configure oracle address
Copy your oracle address from: aptos account list
Replace YOUR_ORACLE_ADDRESS_HERE in:
oracle/index.js  (ORACLE_ADDRESS variable)
oracle/aptos.js  (private key and address)
frontend/src/aptos.js  (ORACLE_ADDRESS export)

### 6. Start Oracle (Terminal 1)
cd oracle && node index.js

### 7. Start Frontend (Terminal 2)
cd frontend && npm run dev

# Open http://localhost:5173 in Chrome with Petra Wallet accounts

### 8. Run unit tests
aptos move test --named-addresses escrow=default

## Demo Flow
1. Connect Client Petra account → fill milestone form → Create & Lock APT
2. Switch to Freelancer Petra account → upload code to Pinata → Submit CID
3. Oracle auto-detects, runs Docker evaluation, reports result on-chain
4. If tests pass: APT auto-released | If fail: funds held

## Supported Languages
- Python (default): python:3.11-alpine Docker image
- JavaScript: node:18-alpine Docker image
- Java: openjdk:17-alpine Docker image


