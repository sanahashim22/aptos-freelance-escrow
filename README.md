# Freelance Code Evaluation Platform - Aptos Escrow DApp

## Project Overview
A trustless DApp on Aptos blockchain that automates freelance code evaluation
and payment release using Move smart contracts, IPFS, and Docker sandboxing.

## Tech Stack
- Blockchain: Aptos Devnet/Testnet (Move language)
- Oracle: Node.js + Aptos TypeScript SDK + Docker
- Frontend: React.js + Vite + Petra Wallet
- Storage: IPFS pinata

## Quick Start

### Prerequisites
- Ubuntu 22.04 (or WSL2)
- Aptos CLI v3.x
- Node.js v18+
- Docker Engine
- Petra Wallet (Chrome extension)

### 1. Clone and install
git clone https://github.com/sanahashim22/aptos-freelance-escrow
cd aptos-freelance-escrow
npm install  # root deps
cd oracle && npm install && cd ..
cd frontend && npm install && cd ..


### 2. Configure
Edit oracle/index.js and frontend/src/aptos.js:
Replace YOUR_ORACLE_ADDRESS_HERE with your Aptos account address.

otherwise use:

oracle address: 0x4e2246ea3280c6f364c97b522c019650a7629d21f97f470b3bbb8e6dd29338ec

aptos freelancer address: 0x60e17d10a7f05637e9de7e2a72c27a96aea8209ae58398d84ea97301725f73bc

aptos client address: 0x52c99580939c5f4df232aeabccab608b11d65baa82d9a2ee22bbb46c07261f49



### 3. Deploy contract
aptos init --network devnet
aptos move compile --named-addresses escrow=default
aptos move publish --named-addresses escrow=default --assume-yes


### 4. Start Oracle
cd oracle && node index.js


### 5. Start Frontend
cd frontend && npm run dev

### Open http://localhost:5173
=======

Open http://localhost:5173
2d63e74a3d9f4baa6f60e9ac440c76190f5af09f


## Demo Flow
1. Client connects Petra Wallet → creates milestone → locks APT
2. Freelancer submits code CID (uploaded to IPFS)
3. Oracle automatically evaluates code in Docker
4. If tests pass → APT auto-released to freelancer
5. If tests fail → funds held; client can retry or refund


