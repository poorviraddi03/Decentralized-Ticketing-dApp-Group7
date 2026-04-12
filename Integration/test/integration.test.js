// test/integration.test.js
// ─────────────────────────────────────────────────────────────
// Task 4: Integration Tests
// Tests the full system workflow through the real contract APIs.
//
// Run: npx hardhat test
// ─────────────────────────────────────────────────────────────

const { expect } = require("chai");
const { ethers }  = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Decentralized Ticketing dApp — Integration Tests", function () {

  let didRegistry, verificationLog, ticketCredential;
  let organizer, user1, user2, verifier, stranger;

  const DID_1        = "did:ethr:0xUser1";
  const DID_2        = "did:ethr:0xUser2";
  const METADATA_CID = "QmTicketHashABCDEF1234567890";  // IPFS CID or hash

  // ── Deploy fresh contracts before every test ──────────────
  beforeEach(async function () {
    [organizer, user1, user2, verifier, stranger] = await ethers.getSigners();

    // 1. DIDRegistry (no deps)
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();

    // 2. VerificationLog (no deps)
    const VerificationLog = await ethers.getContractFactory("VerificationLog");
    verificationLog = await VerificationLog.deploy();

    // 3. TicketCredential — wired to the two above
    const TicketCredential = await ethers.getContractFactory("TicketCredential");
    ticketCredential = await TicketCredential.deploy(
      await didRegistry.getAddress(),
      await verificationLog.getAddress()
    );
  });

  // ────────────────────────────────────────────────────────────
  //  1. Deployment & Cross-Contract Wiring
  // ────────────────────────────────────────────────────────────
  describe("1. Deployment & Wiring", function () {

    it("TicketCredential correctly stores DIDRegistry address", async function () {
      expect(await ticketCredential.didRegistry())
        .to.equal(await didRegistry.getAddress());
    });

    it("TicketCredential correctly stores VerificationLog address", async function () {
      expect(await ticketCredential.verificationLog())
        .to.equal(await verificationLog.getAddress());
    });

    it("deployer is set as organizer", async function () {
      expect(await ticketCredential.organizer()).to.equal(organizer.address);
    });

    it("ticket counter starts at 1", async function () {
      expect(await ticketCredential.nextTicketId()).to.equal(1n);
    });

    it("VerificationLog starts with zero records", async function () {
      expect(await verificationLog.getRecordCount()).to.equal(0n);
    });
  });

  // ────────────────────────────────────────────────────────────
  //  2. DID Registration (Task 1 contract — used by Task 4 flow)
  // ────────────────────────────────────────────────────────────
  describe("2. DID Registration", function () {

    it("user can register a DID", async function () {
      await expect(didRegistry.connect(user1).registerIdentity(DID_1))
        .to.emit(didRegistry, "IdentityRegistered")
        .withArgs(user1.address, DID_1, anyValue);

      expect(await didRegistry.isRegistered(user1.address)).to.equal(true);
    });

    it("getIdentity returns correct data after registration", async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      const [did, registered] = await didRegistry.getIdentity(user1.address);
      expect(did).to.equal(DID_1);
      expect(registered).to.equal(true);
    });

    it("cannot register twice", async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      await expect(
        didRegistry.connect(user1).registerIdentity(DID_1)
      ).to.be.revertedWith("Identity already registered");
    });

    it("cannot register empty DID", async function () {
      await expect(
        didRegistry.connect(user1).registerIdentity("")
      ).to.be.revertedWith("DID cannot be empty");
    });

    it("user can update their DID", async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      const updatedDID = "did:ethr:0xUser1-v2";

      await expect(didRegistry.connect(user1).updateIdentity(updatedDID))
        .to.emit(didRegistry, "IdentityUpdated")
        .withArgs(user1.address, updatedDID, anyValue);

      const [did] = await didRegistry.getIdentity(user1.address);
      expect(did).to.equal(updatedDID);
    });

    it("unregistered user returns false for isRegistered", async function () {
      expect(await didRegistry.isRegistered(stranger.address)).to.equal(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  //  3. Ticket Issuance (requires DID → enforced by TicketCredential)
  // ────────────────────────────────────────────────────────────
  describe("3. Ticket Issuance", function () {

    beforeEach(async function () {
      // User1 registers their DID before organizer can issue a ticket
      await didRegistry.connect(user1).registerIdentity(DID_1);
    });

    it("organizer issues a ticket to a registered user", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID)
      )
        .to.emit(ticketCredential, "TicketIssued")
        .withArgs(1n, user1.address, METADATA_CID);
    });

    it("ticket is stored correctly on-chain", async function () {
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
      const [ticketId, owner, metadataHash, issued, used, revoked] =
        await ticketCredential.getTicket(1);

      expect(ticketId).to.equal(1n);
      expect(owner).to.equal(user1.address);
      expect(metadataHash).to.equal(METADATA_CID);
      expect(issued).to.equal(true);
      expect(used).to.equal(false);
      expect(revoked).to.equal(false);
    });

    it("ticket ID counter increments correctly", async function () {
      await didRegistry.connect(user2).registerIdentity(DID_2);

      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
      await ticketCredential.connect(organizer).issueTicket(user2.address, METADATA_CID);

      expect(await ticketCredential.nextTicketId()).to.equal(3n);
    });

    it("non-organizer cannot issue a ticket", async function () {
      await expect(
        ticketCredential.connect(stranger).issueTicket(user1.address, METADATA_CID)
      ).to.be.revertedWith("Only organizer can perform this action");
    });

    it("cannot issue to unregistered user — DIDRegistry check enforced", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(stranger.address, METADATA_CID)
      ).to.be.revertedWith("Recipient must have registered DID");
    });

    it("cannot issue to zero address", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(ethers.ZeroAddress, METADATA_CID)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("cannot issue with empty metadata hash", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(user1.address, "")
      ).to.be.revertedWith("Metadata hash required");
    });
  });

  // ────────────────────────────────────────────────────────────
  //  4. Ticket Verification (atomically logs to VerificationLog)
  // ────────────────────────────────────────────────────────────
  describe("4. Ticket Verification & VerificationLog Integration", function () {
    const TICKET_ID = 1n;

    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
    });

    it("valid ticket passes verification", async function () {
      await expect(ticketCredential.connect(verifier).verifyTicket(TICKET_ID))
        .to.emit(ticketCredential, "TicketVerified")
        .withArgs(TICKET_ID, verifier.address, true);
    });

    it("successful verification is logged in VerificationLog", async function () {
      await ticketCredential.connect(verifier).verifyTicket(TICKET_ID);

      expect(await verificationLog.getRecordCount()).to.equal(1n);

      const [ticketId, logVerifier, , success, note] =
        await verificationLog.getRecord(0);

      expect(ticketId).to.equal(TICKET_ID);
      expect(logVerifier).to.equal(verifier.address);
      expect(success).to.equal(true);
      expect(note).to.equal("Valid ticket");
    });

    it("replay attack blocked — used ticket returns false", async function () {
      // First scan: success
      await ticketCredential.connect(verifier).verifyTicket(TICKET_ID);

      // Second scan: must fail
      await expect(ticketCredential.connect(verifier).verifyTicket(TICKET_ID))
        .to.emit(ticketCredential, "TicketVerified")
        .withArgs(TICKET_ID, verifier.address, false);

      // Both attempts logged
      expect(await verificationLog.getRecordCount()).to.equal(2n);
      const [, , , success2, note2] = await verificationLog.getRecord(1);
      expect(success2).to.equal(false);
      expect(note2).to.equal("Ticket already used");
    });

    it("failed verification for non-existent ticket is logged", async function () {
      await ticketCredential.connect(verifier).verifyTicket(999n);

      expect(await verificationLog.getRecordCount()).to.equal(1n);
      const [, , , success, note] = await verificationLog.getRecord(0);
      expect(success).to.equal(false);
      expect(note).to.equal("Ticket does not exist");
    });

    it("revoked ticket is logged as failed on verification attempt", async function () {
      await ticketCredential.connect(organizer).revokeTicket(TICKET_ID);
      await ticketCredential.connect(verifier).verifyTicket(TICKET_ID);

      const [, , , success, note] = await verificationLog.getRecord(0);
      expect(success).to.equal(false);
      expect(note).to.equal("Ticket revoked");
    });

    it("ticket is marked used after successful verify", async function () {
      await ticketCredential.connect(verifier).verifyTicket(TICKET_ID);
      const [, , , , used] = await ticketCredential.getTicket(TICKET_ID);
      expect(used).to.equal(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  //  5. Ticket Revocation
  // ────────────────────────────────────────────────────────────
  describe("5. Ticket Revocation", function () {
    const TICKET_ID = 1n;

    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
    });

    it("organizer can revoke a ticket", async function () {
      await expect(ticketCredential.connect(organizer).revokeTicket(TICKET_ID))
        .to.emit(ticketCredential, "TicketRevoked")
        .withArgs(TICKET_ID);

      const [, , , , , revoked] = await ticketCredential.getTicket(TICKET_ID);
      expect(revoked).to.equal(true);
    });

    it("non-organizer cannot revoke", async function () {
      await expect(
        ticketCredential.connect(stranger).revokeTicket(TICKET_ID)
      ).to.be.revertedWith("Only organizer can perform this action");
    });

    it("cannot revoke a non-existent ticket", async function () {
      await expect(
        ticketCredential.connect(organizer).revokeTicket(999n)
      ).to.be.revertedWith("Ticket does not exist");
    });

    it("cannot revoke an already-revoked ticket", async function () {
      await ticketCredential.connect(organizer).revokeTicket(TICKET_ID);
      await expect(
        ticketCredential.connect(organizer).revokeTicket(TICKET_ID)
      ).to.be.revertedWith("Ticket already revoked");
    });
  });

  // ────────────────────────────────────────────────────────────
  //  6. Ticket Transfer
  // ────────────────────────────────────────────────────────────
  describe("6. Ticket Transfer", function () {
    const TICKET_ID = 1n;

    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity(DID_1);
      await didRegistry.connect(user2).registerIdentity(DID_2);
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
    });

    it("owner transfers ticket to another registered user", async function () {
      await expect(
        ticketCredential.connect(user1).transferTicket(TICKET_ID, user2.address)
      )
        .to.emit(ticketCredential, "TicketTransferred")
        .withArgs(TICKET_ID, user1.address, user2.address);

      const [, newOwner] = await ticketCredential.getTicket(TICKET_ID);
      expect(newOwner).to.equal(user2.address);
    });

    it("cannot transfer to unregistered wallet — DID check enforced", async function () {
      await expect(
        ticketCredential.connect(user1).transferTicket(TICKET_ID, stranger.address)
      ).to.be.revertedWith("New owner must have registered DID");
    });

    it("non-owner cannot transfer ticket", async function () {
      await expect(
        ticketCredential.connect(user2).transferTicket(TICKET_ID, user2.address)
      ).to.be.revertedWith("Only ticket owner can transfer");
    });

    it("used ticket cannot be transferred", async function () {
      await ticketCredential.connect(verifier).verifyTicket(TICKET_ID);
      await expect(
        ticketCredential.connect(user1).transferTicket(TICKET_ID, user2.address)
      ).to.be.revertedWith("Used ticket cannot be transferred");
    });

    it("revoked ticket cannot be transferred", async function () {
      await ticketCredential.connect(organizer).revokeTicket(TICKET_ID);
      await expect(
        ticketCredential.connect(user1).transferTicket(TICKET_ID, user2.address)
      ).to.be.revertedWith("Revoked ticket cannot be transferred");
    });
  });

  // ────────────────────────────────────────────────────────────
  //  7. VerificationLog standalone
  // ────────────────────────────────────────────────────────────
  describe("7. VerificationLog", function () {

    it("records multiple entries and returns correct count", async function () {
      await verificationLog.logVerification(1n, verifier.address, true,  "Valid ticket");
      await verificationLog.logVerification(2n, verifier.address, false, "Ticket already used");
      await verificationLog.logVerification(3n, verifier.address, false, "Ticket revoked");

      expect(await verificationLog.getRecordCount()).to.equal(3n);
    });

    it("getRecord returns correct data for each index", async function () {
      await verificationLog.logVerification(42n, verifier.address, true, "Valid ticket");

      const [ticketId, loggedVerifier, , success, note] =
        await verificationLog.getRecord(0);

      expect(ticketId).to.equal(42n);
      expect(loggedVerifier).to.equal(verifier.address);
      expect(success).to.equal(true);
      expect(note).to.equal("Valid ticket");
    });

    it("getRecord reverts on out-of-bounds index", async function () {
      await expect(verificationLog.getRecord(0)).to.be.revertedWith("Invalid index");
    });
  });

  // ────────────────────────────────────────────────────────────
  //  8. Full End-to-End Happy Path
  // ────────────────────────────────────────────────────────────
  describe("8. End-to-End: Complete Workflow", function () {

    it("registers DID → issues ticket → verifies entry → blocks replay", async function () {

      // Step 1: User registers identity
      await didRegistry.connect(user1).registerIdentity(DID_1);
      expect(await didRegistry.isRegistered(user1.address)).to.equal(true);

      // Step 2: Organizer issues ticket (DID check passes internally)
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);
      const [, , , issued] = await ticketCredential.getTicket(1);
      expect(issued).to.equal(true);

      // Step 3: Verifier checks ticket at gate → success + auto-logged
      const tx = await ticketCredential.connect(verifier).verifyTicket(1n);
      await expect(tx)
        .to.emit(ticketCredential, "TicketVerified")
        .withArgs(1n, verifier.address, true);

      // VerificationLog has the record
      expect(await verificationLog.getRecordCount()).to.equal(1n);
      const [, , , logSuccess] = await verificationLog.getRecord(0);
      expect(logSuccess).to.equal(true);

      // Step 4: Ticket marked used
      const [, , , , used] = await ticketCredential.getTicket(1);
      expect(used).to.equal(true);

      // Step 5: Replay attempt is rejected and logged
      await ticketCredential.connect(verifier).verifyTicket(1n);
      expect(await verificationLog.getRecordCount()).to.equal(2n);
      const [, , , replaySuccess, replayNote] = await verificationLog.getRecord(1);
      expect(replaySuccess).to.equal(false);
      expect(replayNote).to.equal("Ticket already used");
    });

    it("full revocation flow: issue → revoke → verify fails → logged", async function () {

      await didRegistry.connect(user1).registerIdentity(DID_1);
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);

      // Organizer revokes before event
      await ticketCredential.connect(organizer).revokeTicket(1n);

      // Verifier attempt → blocked
      await ticketCredential.connect(verifier).verifyTicket(1n);

      const [, , , success, note] = await verificationLog.getRecord(0);
      expect(success).to.equal(false);
      expect(note).to.equal("Ticket revoked");
    });

    it("transfer then verify: new owner's ticket is accepted", async function () {

      await didRegistry.connect(user1).registerIdentity(DID_1);
      await didRegistry.connect(user2).registerIdentity(DID_2);
      await ticketCredential.connect(organizer).issueTicket(user1.address, METADATA_CID);

      // User1 transfers to User2
      await ticketCredential.connect(user1).transferTicket(1n, user2.address);
      const [, newOwner] = await ticketCredential.getTicket(1);
      expect(newOwner).to.equal(user2.address);

      // Ticket still passes verification after transfer
      const tx = await ticketCredential.connect(verifier).verifyTicket(1n);
      await expect(tx)
        .to.emit(ticketCredential, "TicketVerified")
        .withArgs(1n, verifier.address, true);
    });
  });

}); // end describe
