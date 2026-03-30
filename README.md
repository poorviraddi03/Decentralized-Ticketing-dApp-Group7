Decentralized Identity and Ticket Verification System
Project Overview
This project implements a blockchain-based event ticketing system designed to improve security, transparency, and trust in ticket management. Traditional ticketing platforms rely on centralized systems, which are vulnerable to issues such as ticket fraud, duplication, and unauthorized resale.
The proposed system uses smart contracts to issue, manage, and verify tickets linked to decentralized identities. This ensures that each ticket is authentic, traceable, and can only be used once.
Key Features
Decentralized identity registration for users
Secure ticket issuance by event organizers
On-chain ticket verification at entry points
Prevention of duplicate or reused tickets
Logging of all verification events on-chain
System Architecture
Actors
User (Holder): Owns and presents the ticket
Issuer (Event Organizer): Issues tickets
Verifier (Entry System): Verifies tickets
On-Chain Components
DIDRegistry.sol → Manages decentralized identity registration
TicketCredential.sol → Handles ticket issuance, transfer, verification, and revocation
VerificationLog.sol → Records verification history
Off-Chain Components
Ticket metadata storage (IPFS or database)
Frontend application or CLI
Technologies Used
Solidity
Ethereum / Polygon Amoy Testnet
Remix IDE or Hardhat
MetaMask
Project Structure
.
├── README.md
├── contracts/
│ ├── DIDRegistry.sol
│ ├── TicketCredential.sol
│ └── VerificationLog.sol
├── scripts/
│ └── deploy.js
├── test/
│ └── sample-test.js
└── docs/
└── architecture.md
Setup and Deployment
Using Remix IDE
Open https://remix.ethereum.org
Create a new workspace
Upload all files from the contracts folder
Deployment Order
Deploy DIDRegistry.sol
Deploy VerificationLog.sol
Deploy TicketCredential.sol with:
DIDRegistry contract address
VerificationLog contract address
Usage
Register identity using registerIdentity()
Issue ticket using issueTicket()
Verify ticket using verifyTicket()
View logs using VerificationLog
Smart Contract Design
The system follows a modular structure:
DIDRegistry → identity management
TicketCredential → ticket lifecycle
VerificationLog → verification tracking
Interfaces are used for contract interaction. Each contract includes clear function definitions and event logging.
Scope
Implemented
Identity registration
Ticket issuance
Ticket verification
Ticket usage tracking
Verification logging
Future Work
Ticket resale system
Advanced identity verification
Full frontend integration
Team Members
Karthik Viyyapu
Argha Dhar
Poorvi Raddi
Rishi Krishnan Gurunathan
Smitkumar Sandipbhai Patel
References
Ethereum Solidity Documentation
W3C DID Specification
Verifiable Credentials Data Model
Project Status
In development. Core smart contract functionality implemented.
