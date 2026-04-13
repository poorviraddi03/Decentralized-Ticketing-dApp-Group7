# CSE540-BlockChain-Group7

# Decentralized Identity and Access Management (IAM) dApp
### Event Ticket Verification System
**CSE 540: Engineering Blockchain Applications — Spring B 2026**

---

## Team Members
- Karthik Viyyapu
- Argha Dhar
- Poorvi Raddi
- Rishi Krishnan Gurunathan
- Smitkumar Sandipbhai Patel

---

## Project Description

This project implements a **Decentralized Identity and Access Management (IAM) system** applied to event ticket verification. Traditional ticketing platforms rely on centralized databases that are vulnerable to fraud, ticket duplication, and unauthorized resale. Our system addresses these issues by representing tickets as **verifiable credentials** anchored to a user's decentralized identity on the blockchain.

Users (ticket holders) register a **Decentralized Identifier (DID)** on-chain. Event organizers (issuers) issue tickets as credentials linked to that DID. At the event gate, verifiers confirm ticket authenticity against on-chain data — no central authority required.

### Key Features
- **DID Registration** — Users anchor their identity on-chain via a DID string
- **Ticket Issuance** — Organizers issue tamper-proof ticket credentials to registered users
- **On-chain Verification** — Hash-based verification ensures authenticity without exposing private data
- **Immutable Audit Log** — Every verification attempt is permanently recorded on-chain
- **Replay-Attack Prevention** — Tickets are marked `used` after a successful scan
- **Ticket Transfer** — Holders can transfer tickets to other registered users before use

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OFF-CHAIN                            │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  User/Holder │   │   Issuer     │   │    Verifier    │  │
│  │  (Frontend)  │   │  (Organizer) │   │  (Entry Gate)  │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
│         │                  │                    │           │
│         │  Full DID doc /  │  Full ticket JSON  │           │
│         │  ticket JSON     │  stored on IPFS    │           │
│         ▼                  ▼                    ▼           │
│              IPFS / Encrypted Off-chain Storage             │
└─────────────────────────┬───────────────────────────────────┘
                          │  Hash references only
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  ON-CHAIN (Ethereum / Polygon Amoy)         │
│                                                             │
│  ┌──────────────────┐   ┌───────────────────┐              │
│  │   DIDRegistry    │   │  TicketCredential │              │
│  │                  │   │                   │              │
│  │ • registerIdentity() │ • issueTicket()   │              │
│  │ • updateIdentity()│  │ • verifyTicket()  │              │
│  │ • getIdentity()  │   │ • revokeTicket()  │              │
│  │ • isRegistered() │   │ • transferTicket()│              │
│  └──────────────────┘   └───────────────────┘              │
│                                                             │
│              ┌────────────────────────┐                    │
│              │    VerificationLog     │                    │
│              │                        │                    │
│              │ • logVerification()    │                    │
│              │ • getRecord()          │                    │
│              │ • getRecordCount()     │                    │
│              └────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Stakeholders & Roles

| Role | Description | Key Permissions |
|---|---|---|
| **User / Holder** | Registers identity, holds and transfers tickets | `registerIdentity`, `transferTicket` |
| **Issuer / Organizer** | Event organizer who issues tickets | `issueTicket`, `revokeTicket` |
| **Verifier** | Entry gate scanner | `verifyTicket` |

---

## Smart Contracts

| Contract | File | Purpose |
|---|---|---|
| `DIDRegistry` | `contracts/DIDRegistry.sol` | Registers and manages user DIDs on-chain |
| `TicketCredential` | `contracts/TicketCredential.sol` | Issues, verifies, revokes, and transfers event ticket credentials |
| `VerificationLog` | `contracts/VerificationLog.sol` | Immutable audit log of all verification attempts |

### Deployment Order
TicketCredential depends on the other two contracts. Always deploy in this order:
```
1. DIDRegistry        → copy address A
2. VerificationLog    → copy address B
3. TicketCredential(A, B)
```

---

## Dependencies & Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | JavaScript runtime |
| [Hardhat](https://hardhat.org/) | v2.22+ | Smart contract development & testing |
| [MetaMask](https://metamask.io/) | Browser Extension | Wallet & transaction signing (testnet only) |
| [Git](https://git-scm.com/) | Any | Version control |

### Installation

```bash
# Clone the repository
git clone https://github.com/poorviraddi03/Decentralized-Ticketing-dApp-Group7.git
cd Decentralized-Ticketing-dApp-Group7-main

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
# Expected: 32 passing
```

---

## Deployment Instructions

### Option A — Remix IDE (Quickest, no wallet needed for local demo)

1. Open [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create three new files and paste in each `.sol` file from `contracts/`
3. In the **Solidity Compiler** tab, set version to **0.8.20** and enable Auto Compile
4. In the **Deploy & Run Transactions** tab, set Environment to **Remix VM (Shanghai)**
5. Deploy contracts in order:
   - Deploy `DIDRegistry` → copy its address
   - Deploy `VerificationLog` → copy its address
   - Deploy `TicketCredential` → paste both addresses into the constructor fields

For testnet deployment via Remix:
- Connect MetaMask to **Polygon Amoy Testnet** (Chain ID: 80002)
- Get free test POL from the [Polygon Faucet](https://faucet.polygon.technology/)
- Set Environment to **Injected Provider - MetaMask**

### Option B — Hardhat Local Network

```bash
# Terminal 1 — start local blockchain
npx hardhat node

# Terminal 2 — deploy all contracts + run smoke test
npx hardhat run scripts/deploy.js --network localhost
```

### Option C — Polygon Amoy Testnet

```bash
# Copy the env template and fill in your values
cp .env.example .env

# Deploy
npx hardhat run scripts/deploy.js --network amoy
```

---

## Basic Usage Flow

```
1. USER registers a DID
   └─ DIDRegistry.registerIdentity("did:ethr:0xABC...")

2. ORGANIZER issues a ticket to the user
   └─ TicketCredential.issueTicket(userAddress, "ipfs://QmHash")
      (contract verifies user has a registered DID first)

3. USER optionally transfers ticket to another registered user
   └─ TicketCredential.transferTicket(ticketId, newOwnerAddress)

4. VERIFIER scans ticket at venue gate
   └─ TicketCredential.verifyTicket(ticketId)
      → returns true/false, marks ticket used, logs result

5. VerificationLog records the attempt permanently
   └─ VerificationLog.getRecord(index) → ticketId, verifier, success, note, timestamp
```

---

## Project Status

| Milestone | Deadline | Status |
|---|---|---|
| Project Proposal | 03/22/2026 | ✅ Submitted |
| Smart Contract Draft | 03/29/2026 | ✅ Complete |
| Hardhat Test Suite (32 tests) | 04/12/2026 | ✅ Complete |
| Deployment Script | 04/12/2026 | ✅ Complete |
| Midterm Progress Update | 04/12/2026 | ✅ Submitted |
| Frontend (React + Ethers.js) | 05/03/2026 | 🔜 In Progress |
| Final Submission | 05/03/2026 | 🔜 Upcoming |

---

## Planned Additions (Next Milestone)
- Frontend web UI (React + Ethers.js) for all three stakeholder roles
- IPFS integration for off-chain ticket metadata storage
- Deployment to Polygon Amoy testnet
- ZKP simulation for age/identity verification without revealing private data
- Gas cost analysis and scalability evaluation

---

## npm Scripts Reference

| Command | What it does |
|---|---|
| `npm run compile` | Compile all contracts |
| `npm test` | Run all 32 tests |
| `npm run node` | Start local Hardhat blockchain |
| `npm run deploy:local` | Deploy to local node (node must be running) |
| `npm run deploy:amoy` | Deploy to Polygon Amoy testnet |
| `npm run clean` | Delete compiled artifacts and cache |

---

## References

1. W3C Decentralized Identifiers (DIDs): https://www.w3.org/TR/did-core/
2. W3C Verifiable Credentials Data Model: https://www.w3.org/TR/vc-data-model/
3. Ethereum Solidity Documentation: https://docs.soliditylang.org/
4. IBM Blockchain Identity Overview: https://www.ibm.com/topics/blockchain-identity
5. Microsoft Decentralized Identity Overview: https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/decentralized-identity-overview
