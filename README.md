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
- **DID Registration** — Users anchor a hashed identity document on-chain
- **Ticket Issuance** — Organizers issue tamper-proof ticket credentials
- **On-chain Verification** — Hash-based verification ensures authenticity without exposing private data
- **Immutable Audit Log** — Every verification attempt is permanently recorded
- **Replay-Attack Prevention** — Tickets are marked Used after a successful scan

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OFF-CHAIN                            │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   │
│  │  User/Holder │   │   Issuer     │   │    Verifier    │   │
│  │  (Frontend)  │   │  (Organizer) │   │  (Entry Gate)  │   │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘   │
│         │                  │                    │           │
│         │  Full DID doc /  │  Full ticket JSON  │           │
│         │  ticket JSON     │  stored on IPFS    │           │
│         ▼                  ▼                    ▼           │
│              IPFS / Encrypted Off-chain Storage             │
└─────────────────────────┬───────────────────────────────────┘
                          │  Hash references only
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       ON-CHAIN (Ethereum / Polygon Amoy)    │
│                                                             │
│  ┌──────────────────┐  ┌───────────────────┐                │
│  │   DIDRegistry    │  │  TicketCredential │                │
│  │                  │  │                   │                │
│  │ • registerDID()  │  │ • issueTicket()   │                │
│  │ • resolveDID()   │  │ • verifyTicket()  │                │
│  │ • deactivateDID()│  │ • markTicketUsed()│                │
│  │ • updateDID()    │  │ • revokeTicket()  │                │
│  └──────────────────┘  └───────────────────┘                │
│                                                             │
│              ┌────────────────────────┐                     │
│              │    VerificationLog     │                     │
│              │                        │                     │
│              │ • logVerification()    │                     │
│              │ • getLogsByTicket()    │                     │
│              │ • hasSuccessfulVerif() │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Stakeholders & Roles

| Role | Description | Key Permissions |
|---|---|---|
| **User / Holder** | Registers identity, holds ticket | registerDID, view own tickets |
| **Issuer** | Event organizer who issues tickets | issueTicket, revokeTicket, markTicketUsed |
| **Verifier** | Entry gate / system | verifyTicket, logVerification |
| **Owner** | Contract deployer | Authorize/revoke issuers and verifiers |

---

## Smart Contracts

| Contract | File | Purpose |
|---|---|---|
| `DIDRegistry` | `contracts/DIDRegistry.sol` | Registers and manages user DIDs on-chain |
| `TicketCredential` | `contracts/TicketCredential.sol` | Issues and tracks event ticket credentials |
| `VerificationLog` | `contracts/VerificationLog.sol` | Immutable audit log of all verification attempts |

---

## Dependencies & Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | JavaScript runtime |
| [Hardhat](https://hardhat.org/) or [Remix IDE](https://remix.ethereum.org) | Latest | Smart contract development & testing |
| [MetaMask](https://metamask.io/) | Browser Extension | Wallet & transaction signing |
| [Git](https://git-scm.com/) | Any | Version control |

### Installation (Hardhat)

```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-folder>

# Install dependencies
npm install

# Install Hardhat (if not already installed)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

---

## Deployment Instructions

### Option A — Remix IDE (Quickest for Demo)

1. Open [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create a new workspace and paste each `.sol` file from `contracts/'
3. Compile using Solidity compiler **^0.8.20**
4. Connect MetaMask to **Polygon Amoy Testnet**
   - Add via [ChainList](https://chainlist.org/) → search "Amoy" → Add to MetaMask
   - Get free test POL tokens from the [Polygon Faucet](https://faucet.polygon.technology/)
5. In the **Deploy & Run** tab, select **Injected Provider - MetaMask**
6. Deploy contracts in this order:
   1. `DIDRegistry`
   2. `TicketCredential`
   3. `VerificationLog`
7. Copy deployed contract addresses for use in the frontend

### Option B — Hardhat Local Network

```bash
# Start a local Hardhat node
npx hardhat node

# In a second terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

> **Note:** Deployment scripts (`scripts/deploy.js`) are in progress and will be finalized in the Midterm Progress Update.

---

## Basic Usage Flow

```
1. USER registers a DID
   └─ DIDRegistry.registerDID("did:ethr:0xABC...", <hash>)

2. ISSUER issues a ticket to the user's DID
   └─ TicketCredential.issueTicket("did:ethr:0xABC...", <ticketHash>, "EVENT_2026")

3. USER presents ticket at the gate (off-chain data + ticketId)

4. VERIFIER checks validity on-chain
   └─ TicketCredential.verifyTicket(ticketId, <offChainHash>)  → returns true/false

5. VERIFIER marks ticket as used (if valid)
   └─ TicketCredential.markTicketUsed(ticketId)

6. VERIFIER logs the event immutably
   └─ VerificationLog.logVerification(ticketId, VerificationResult.Success)
```

---

## Project Status

| Milestone | Deadline | Status |
|---|---|---|
| Project Proposal | 03/22/2026 | ✅ Submitted |
| Smart Contract Draft | 03/29/2026 | ✅ In Progress |
| Midterm Progress Update | 04/12/2026 | 🔜 Upcoming |
| Final Submission | 05/03/2026 | 🔜 Upcoming |

---

## Planned Additions (Future Milestones)
- Frontend web UI (React + Ethers.js) for all three stakeholder roles
- ZKP simulation for age/identity verification without revealing private data
- IPFS integration for off-chain ticket data storage
- Hardhat test suite covering all core contract functions
- Gas cost analysis and scalability evaluation

---

## References

1. W3C Decentralized Identifiers (DIDs): https://www.w3.org/TR/did-core/
2. W3C Verifiable Credentials Data Model: https://www.w3.org/TR/vc-data-model/
3. Ethereum Solidity Documentation: https://docs.soliditylang.org/
4. IBM Blockchain Identity Overview: https://www.ibm.com/topics/blockchain-identity
5. Microsoft Decentralized Identity Overview: https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/decentralized-identity-overview
