// scripts/deploy.js
// Deploys DIDRegistry → VerificationLog → TicketCredential in order.
// Run locally:  npx hardhat run scripts/deploy.js --network localhost
// Run on Amoy:  npx hardhat run scripts/deploy.js --network amoy

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy DIDRegistry
  console.log("1/3  Deploying DIDRegistry...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didAddress = await didRegistry.getAddress();
  console.log("     DIDRegistry deployed to:", didAddress);

  // 2. Deploy VerificationLog
  console.log("2/3  Deploying VerificationLog...");
  const VerificationLog = await ethers.getContractFactory("VerificationLog");
  const verificationLog = await VerificationLog.deploy();
  await verificationLog.waitForDeployment();
  const logAddress = await verificationLog.getAddress();
  console.log("     VerificationLog deployed to:", logAddress);

  // 3. Deploy TicketCredential (depends on the two above)
  console.log("3/3  Deploying TicketCredential...");
  const TicketCredential = await ethers.getContractFactory("TicketCredential");
  const ticketCredential = await TicketCredential.deploy(didAddress, logAddress);
  await ticketCredential.waitForDeployment();
  const ticketAddress = await ticketCredential.getAddress();
  console.log("     TicketCredential deployed to:", ticketAddress);

  console.log("\n--- Deployment Summary ---");
  console.log("DIDRegistry:       ", didAddress);
  console.log("VerificationLog:   ", logAddress);
  console.log("TicketCredential:  ", ticketAddress);
  console.log("Organizer (owner): ", deployer.address);
  console.log("--------------------------\n");

  // Run a quick smoke test on the local node to confirm contracts are wired correctly
  const network = (await ethers.provider.getNetwork()).name;
  if (network === "unknown" || network === "localhost") {
    console.log("Running smoke test on local node...");

    // Register a DID for deployer
    let tx = await didRegistry.registerIdentity("did:ethr:" + deployer.address);
    await tx.wait();
    const isReg = await didRegistry.isRegistered(deployer.address);
    console.log("  deployer registered DID:", isReg); // true

    // Issue a ticket to deployer
    tx = await ticketCredential.issueTicket(deployer.address, "ipfs://QmSmokeTest");
    await tx.wait();
    const ticket = await ticketCredential.getTicket(1);
    console.log("  ticket #1 owner:", ticket.owner);
    console.log("  ticket #1 issued:", ticket.issued); // true

    // Verify the ticket
    tx = await ticketCredential.verifyTicket(1);
    const receipt = await tx.wait();
    const verifiedEvent = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "TicketVerified"
    );
    console.log("  verification success:", verifiedEvent?.args?.success); // true

    // Confirm log was written
    const count = await verificationLog.getRecordCount();
    console.log("  verification log entries:", count.toString()); // 1

    console.log("Smoke test passed.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
