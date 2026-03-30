Decentralized Identity and Ticket Verification System

Project Overview
This project implements a blockchain-based event ticketing system designed to improve security, transparency, and trust in ticket management. Traditional ticketing platforms rely on centralized systems, which are vulnerable to issues such as ticket fraud, duplication, and unauthorized resale.

The proposed system uses smart contracts to issue, manage, and verify tickets linked to decentralized identities. This ensures that each ticket is authentic, traceable, and can only be used once.

Key Features
- Decentralized identity registration for users
- Secure ticket issuance by event organizers
- On-chain ticket verification at entry points
- Prevention of duplicate or reused tickets
- Logging of all verification events on-chain

System Architecture

Actors
- User (Holder): Owns and presents the ticket
- Issuer (Event Organizer): Issues tickets
- Verifier (Entry System): Verifies tickets

On-Chain Components
- DIDRegistry.sol → Identity registration
- TicketCredential.sol → Ticket management
- VerificationLog.sol → Verification logging

Off-Chain Components
- IPFS or database storage
- Frontend or CLI

Technologies Used
- Solidity
- Ethereum / Polygon Amoy Testnet
- Remix IDE or Hardhat
- MetaMask

Project Structure

.
├── README.md
├── contracts/
│   ├── DIDRegistry.sol
│   ├── TicketCredential.sol
│   └── VerificationLog.sol

Setup and Deployment

Using Remix IDE
1. Open https://remix.ethereum.org
2. Create a workspace
3. Upload contract files

Deployment Order
1. Deploy DIDRegistry
2. Deploy VerificationLog
3. Deploy TicketCredential with contract addresses

Usage

1. Register identity
2. Issue ticket
3. Verify ticket
4. Check logs

Smart Contract Design

- Modular structure
- Separate contracts for identity, tickets, and logs
- Interfaces used for interaction
- Events used for tracking actions

Scope

Implemented
- Identity registration
- Ticket issuance
- Ticket verification
- Usage tracking

Future Work
- Ticket resale
- Advanced identity verification
- Frontend integration

Team Members
- Karthik Viyyapu
- Argha Dhar
- Poorvi Raddi
- Rishi Krishnan Gurunathan
- Smitkumar Sandipbhai Patel

Project Status
In developmentView logs using VerificationLog
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
