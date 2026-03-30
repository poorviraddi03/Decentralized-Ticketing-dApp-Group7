Decentralized Identity and Ticket Verification System
Project Overview
This project implements a blockchain-based event ticketing system designed to improve security, transparency, and trust in ticket management. Traditional ticketing platforms rely on centralized systems, which are vulnerable to issues such as ticket fraud, duplication, and unauthorized resale.
The proposed system uses smart contracts to issue, manage, and verify tickets that are linked to decentralized identities. This ensures that each ticket is authentic, traceable, and can only be used once.
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
Verifier (Entry System): Verifies tickets at the event
On-Chain Components
DIDRegistry.sol
Manages decentralized identity registration for users
TicketCredential.sol
Handles ticket issuance, transfer, verification, and revocation
VerificationLog.sol
Records all verification attempts and outcomes
Off-Chain Components
Ticket metadata storage (IPFS or database)
Frontend application or command-line interface
Technologies Used
Solidity
Ethereum-compatible blockchain (Polygon Amoy testnet)
Remix IDE or Hardhat
MetaMask
Project Structure
.
├── README.md
├── contracts/
│   ├── DIDRegistry.sol
│   ├── TicketCredential.sol
│   └── VerificationLog.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── sample-test.js
└── docs/
    └── architecture.md
Setup and Deployment
Using Remix IDE
Open Remix IDE (https://remix.ethereum.org)
Create a new workspace
Upload all files from the contracts/ folder
Deployment Order
Deploy DIDRegistry.sol
Deploy VerificationLog.sol
Deploy TicketCredential.sol using:
DIDRegistry contract address
VerificationLog contract address
Usage
Register identity using registerIdentity()
Issue ticket using issueTicket() (organizer only)
Verify ticket using verifyTicket()
View verification logs through VerificationLog contract
Smart Contract Design
The system follows a modular contract structure with clear separation of responsibilities:
Identity management is handled by DIDRegistry
Ticket lifecycle management is handled by TicketCredential
Verification tracking is handled by VerificationLog
Interfaces are used to enable interaction between contracts. Each contract includes clearly defined function signatures and event logging for transparency.
Scope
The current implementation includes:
Identity registration
Ticket issuance
Ticket verification
Ticket usage tracking
Verification logging
Future improvements may include:
Secure ticket resale
Advanced identity verification mechanisms
Full frontend integration
Team Members
Karthik Viyyapu
Argha Dhar
Poorvi Raddi
Rishi Krishnan Gurunathan
Smitkumar Sandipbhai Patel
References
Ethereum Solidity Documentation
W3C Decentralized Identifiers (DID)
Verifiable Credentials Data Model
Project Status
In development. Core smart contract structure and functionality implemented.
