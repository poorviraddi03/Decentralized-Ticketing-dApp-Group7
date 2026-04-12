// scripts/deploy.js
// ─────────────────────────────────────────────────────────────
// Task 4: Integration — Full Deployment Script
//
// Deployment order (required by constructor dependencies):
//   1. DIDRegistry       — no dependencies
//   2. VerificationLog   — no dependencies
//   3. TicketCredential  — needs DIDRegistry + VerificationLog addresses
//
// TicketCredential already integrates all three contracts internally.
// This script wires them up and saves addresses for the test suite.
//
// Usage:
//   Local:  npx hardhat run scripts/deploy.js --network localhost
//   Amoy:   npx hardhat run scripts/deploy.js --network amoy
// ─────────────────────────────────────────────────────────────

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("════════════════════════════════════════════════════════");
  console.log("  Decentralized Ticketing dApp — Group 7");
  console.log("  Task 4: Contract Integration Deployment");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(
    `  Balance  : ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );
  console.log("────────────────────────────────────────────────────────\n");

  // ── Step 1: Deploy DIDRegistry ────────────────────────────
  console.log("1/3  Deploying DIDRegistry...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didAddr = await didRegistry.getAddress();
  console.log(`     ✅ DIDRegistry     → ${didAddr}\n`);

  // ── Step 2: Deploy VerificationLog ───────────────────────
  console.log("2/3  Deploying VerificationLog...");
  const VerificationLog = await ethers.getContractFactory("VerificationLog");
  const verificationLog = await VerificationLog.deploy();
  await verificationLog.waitForDeployment();
  const logAddr = await verificationLog.getAddress();
  console.log(`     ✅ VerificationLog → ${logAddr}\n`);

  // ── Step 3: Deploy TicketCredential ──────────────────────
  // Constructor: (address _didRegistryAddress, address _verificationLogAddress)
  // The deployer automatically becomes the `organizer`.
  console.log("3/3  Deploying TicketCredential (integrates all three)...");
  const TicketCredential = await ethers.getContractFactory("TicketCredential");
  const ticketCredential = await TicketCredential.deploy(didAddr, logAddr);
  await ticketCredential.waitForDeployment();
  const ticketAddr = await ticketCredential.getAddress();
  console.log(`     ✅ TicketCredential → ${ticketAddr}\n`);

  // ── Summary ───────────────────────────────────────────────
  const addresses = {
    DIDRegistry:      didAddr,
    VerificationLog:  logAddr,
    TicketCredential: ticketAddr,
    organizer:        deployer.address,
  };

  console.log("════════════════════════════════════════════════════════");
  console.log("  Deployment complete!");
  console.log("════════════════════════════════════════════════════════");
  console.log(`  DIDRegistry      : ${addresses.DIDRegistry}`);
  console.log(`  VerificationLog  : ${addresses.VerificationLog}`);
  console.log(`  TicketCredential : ${addresses.TicketCredential}`);
  console.log(`  Organizer wallet : ${addresses.organizer}`);
  console.log("════════════════════════════════════════════════════════\n");

  // Persist for test suite and frontend
  const outPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`  ✅ Addresses saved → deployed-addresses.json\n`);

  // ── Integration smoke-check (local only) ──────────────────
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 31337n) {
    console.log("  Running post-deploy smoke check on local network...");

    // Verify the cross-contract wiring is correct
    const linkedDID = await ticketCredential.didRegistry();
    const linkedLog = await ticketCredential.verificationLog();

    console.log(`  ticketCredential.didRegistry()      → ${linkedDID}`);
    console.log(`  ticketCredential.verificationLog()  → ${linkedLog}`);

    const didOk  = linkedDID.toLowerCase()  === didAddr.toLowerCase();
    const logOk  = linkedLog.toLowerCase()  === logAddr.toLowerCase();

    if (didOk && logOk) {
      console.log("  ✅ Cross-contract links verified\n");
    } else {
      console.error("  ❌ Link mismatch — check constructor args");
      process.exitCode = 1;
    }
  }

  return addresses;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
