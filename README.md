# Freelance Code Evaluation Platform - Aptos Escrow DApp

## Phase 3: Core Implementation & Validation

A trustless DApp on Aptos blockchain that automates freelance code evaluation
and payment release using Move smart contracts, IPFS (Pinata), and Docker.

## Tech Stack
- Blockchain: Aptos Testnet (Move language)
- Oracle: Node.js + Aptos TypeScript SDK + Docker (Python/JS/Java)
- Frontend: React.js + Vite + Petra Wallet
- Storage: IPFS via Pinata

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
# Copy your oracle address from: aptos account list
# Replace YOUR_ORACLE_ADDRESS_HERE in:
#   oracle/index.js  (ORACLE_ADDRESS variable)
#   oracle/aptos.js  (private key and address)
#   frontend/src/aptos.js  (ORACLE_ADDRESS export)

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


