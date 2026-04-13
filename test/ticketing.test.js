// test/ticketing.test.js
// Full test suite covering DIDRegistry, VerificationLog, and TicketCredential.
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Decentralized Ticketing System", function () {
  let didRegistry, verificationLog, ticketCredential;
  let organizer, user1, user2, verifier;

  // Deploy fresh contracts before every test
  beforeEach(async function () {
    [organizer, user1, user2, verifier] = await ethers.getSigners();

    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();

    const VerificationLog = await ethers.getContractFactory("VerificationLog");
    verificationLog = await VerificationLog.deploy();

    const TicketCredential = await ethers.getContractFactory("TicketCredential");
    ticketCredential = await TicketCredential.deploy(
      await didRegistry.getAddress(),
      await verificationLog.getAddress()
    );
  });

  // ─────────────────────────────────────────────
  // DIDRegistry
  // ─────────────────────────────────────────────
  describe("DIDRegistry", function () {
    it("allows a user to register a DID", async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:0xUser1");

      const [did, registered] = await didRegistry.getIdentity(user1.address);
      expect(registered).to.equal(true);
      expect(did).to.equal("did:ethr:0xUser1");
    });

    it("emits IdentityRegistered on registration", async function () {
      await expect(
        didRegistry.connect(user1).registerIdentity("did:ethr:0xUser1")
      )
        .to.emit(didRegistry, "IdentityRegistered")
        .withArgs(user1.address, "did:ethr:0xUser1", anyValue);
    });

    it("prevents registering an empty DID", async function () {
      await expect(
        didRegistry.connect(user1).registerIdentity("")
      ).to.be.revertedWith("DID cannot be empty");
    });

    it("prevents double-registration", async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:0xUser1");
      await expect(
        didRegistry.connect(user1).registerIdentity("did:ethr:0xUser1Again")
      ).to.be.revertedWith("Identity already registered");
    });

    it("allows updating a registered DID", async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:0xUser1");
      await didRegistry.connect(user1).updateIdentity("did:ethr:0xUser1Updated");

      const [did] = await didRegistry.getIdentity(user1.address);
      expect(did).to.equal("did:ethr:0xUser1Updated");
    });

    it("prevents updating an unregistered DID", async function () {
      await expect(
        didRegistry.connect(user1).updateIdentity("did:ethr:new")
      ).to.be.revertedWith("Identity not registered");
    });

    it("isRegistered returns false for unknown address", async function () {
      expect(await didRegistry.isRegistered(user1.address)).to.equal(false);
    });
  });

  // ─────────────────────────────────────────────
  // VerificationLog
  // ─────────────────────────────────────────────
  describe("VerificationLog", function () {
    it("records a verification entry", async function () {
      await verificationLog
        .connect(verifier)
        .logVerification(1, verifier.address, true, "Valid entry");

      expect(await verificationLog.getRecordCount()).to.equal(1);

      const [ticketId, addr, , success, note] = await verificationLog.getRecord(0);
      expect(ticketId).to.equal(1);
      expect(addr).to.equal(verifier.address);
      expect(success).to.equal(true);
      expect(note).to.equal("Valid entry");
    });

    it("emits TicketVerified when logging", async function () {
      await expect(
        verificationLog
          .connect(verifier)
          .logVerification(42, verifier.address, false, "Ticket revoked")
      )
        .to.emit(verificationLog, "TicketVerified")
        .withArgs(42, verifier.address, false, "Ticket revoked", anyValue);
    });

    it("reverts getRecord on invalid index", async function () {
      await expect(verificationLog.getRecord(0)).to.be.revertedWith("Invalid index");
    });
  });

  // ─────────────────────────────────────────────
  // TicketCredential — Issuing
  // ─────────────────────────────────────────────
  describe("TicketCredential — issuing", function () {
    beforeEach(async function () {
      // Register DIDs for both users so they can receive tickets
      await didRegistry.connect(user1).registerIdentity("did:ethr:user1");
      await didRegistry.connect(user2).registerIdentity("did:ethr:user2");
    });

    it("organizer can issue a ticket to a registered user", async function () {
      await ticketCredential
        .connect(organizer)
        .issueTicket(user1.address, "ipfs://QmABC");

      const ticket = await ticketCredential.getTicket(1);
      expect(ticket.owner).to.equal(user1.address);
      expect(ticket.issued).to.equal(true);
      expect(ticket.used).to.equal(false);
      expect(ticket.revoked).to.equal(false);
      expect(ticket.metadataHash).to.equal("ipfs://QmABC");
    });

    it("emits TicketIssued on issue", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(user1.address, "ipfs://QmABC")
      )
        .to.emit(ticketCredential, "TicketIssued")
        .withArgs(1, user1.address, "ipfs://QmABC");
    });

    it("increments ticket ID for each new ticket", async function () {
      await ticketCredential.connect(organizer).issueTicket(user1.address, "ipfs://Qm1");
      await ticketCredential.connect(organizer).issueTicket(user2.address, "ipfs://Qm2");

      const t1 = await ticketCredential.getTicket(1);
      const t2 = await ticketCredential.getTicket(2);
      expect(t1.owner).to.equal(user1.address);
      expect(t2.owner).to.equal(user2.address);
    });

    it("reverts when recipient has no registered DID", async function () {
      await expect(
        ticketCredential
          .connect(organizer)
          .issueTicket(verifier.address, "ipfs://QmABC")
      ).to.be.revertedWith("Recipient must have registered DID");
    });

    it("reverts when metadata hash is empty", async function () {
      await expect(
        ticketCredential.connect(organizer).issueTicket(user1.address, "")
      ).to.be.revertedWith("Metadata hash required");
    });

    it("reverts when non-organizer tries to issue", async function () {
      await expect(
        ticketCredential.connect(user1).issueTicket(user2.address, "ipfs://Qm1")
      ).to.be.revertedWith("Only organizer can perform this action");
    });
  });

  // ─────────────────────────────────────────────
  // TicketCredential — Verification
  // ─────────────────────────────────────────────
  describe("TicketCredential — verification", function () {
    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:user1");
      await ticketCredential
        .connect(organizer)
        .issueTicket(user1.address, "ipfs://QmABC");
    });

    it("verifies a valid ticket and marks it used", async function () {
      const tx = await ticketCredential.connect(verifier).verifyTicket(1);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (l) => l.fragment?.name === "TicketVerified"
      );
      expect(event.args.success).to.equal(true);

      const ticket = await ticketCredential.getTicket(1);
      expect(ticket.used).to.equal(true);
    });

    it("writes a record to VerificationLog on success", async function () {
      await ticketCredential.connect(verifier).verifyTicket(1);
      expect(await verificationLog.getRecordCount()).to.equal(1);

      const [ticketId, , , success, note] = await verificationLog.getRecord(0);
      expect(ticketId).to.equal(1);
      expect(success).to.equal(true);
      expect(note).to.equal("Valid ticket");
    });

    it("rejects a used ticket and logs the failure", async function () {
      await ticketCredential.connect(verifier).verifyTicket(1); // first use
      const tx = await ticketCredential.connect(verifier).verifyTicket(1); // replay
      const receipt = await tx.wait();

      const event = receipt.logs.find((l) => l.fragment?.name === "TicketVerified");
      expect(event.args.success).to.equal(false);

      const [, , , success, note] = await verificationLog.getRecord(1);
      expect(success).to.equal(false);
      expect(note).to.equal("Ticket already used");
    });

    it("rejects a non-existent ticket", async function () {
      const tx = await ticketCredential.connect(verifier).verifyTicket(999);
      const receipt = await tx.wait();

      const event = receipt.logs.find((l) => l.fragment?.name === "TicketVerified");
      expect(event.args.success).to.equal(false);
    });

    it("rejects a revoked ticket", async function () {
      await ticketCredential.connect(organizer).revokeTicket(1);
      const tx = await ticketCredential.connect(verifier).verifyTicket(1);
      const receipt = await tx.wait();

      const event = receipt.logs.find((l) => l.fragment?.name === "TicketVerified");
      expect(event.args.success).to.equal(false);

      const [, , , , note] = await verificationLog.getRecord(0);
      expect(note).to.equal("Ticket revoked");
    });
  });

  // ─────────────────────────────────────────────
  // TicketCredential — Revocation
  // ─────────────────────────────────────────────
  describe("TicketCredential — revocation", function () {
    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:user1");
      await ticketCredential
        .connect(organizer)
        .issueTicket(user1.address, "ipfs://QmABC");
    });

    it("organizer can revoke a ticket", async function () {
      await ticketCredential.connect(organizer).revokeTicket(1);
      const ticket = await ticketCredential.getTicket(1);
      expect(ticket.revoked).to.equal(true);
    });

    it("emits TicketRevoked on revocation", async function () {
      await expect(ticketCredential.connect(organizer).revokeTicket(1))
        .to.emit(ticketCredential, "TicketRevoked")
        .withArgs(1);
    });

    it("reverts when revoking an already-revoked ticket", async function () {
      await ticketCredential.connect(organizer).revokeTicket(1);
      await expect(
        ticketCredential.connect(organizer).revokeTicket(1)
      ).to.be.revertedWith("Ticket already revoked");
    });

    it("reverts when non-organizer tries to revoke", async function () {
      await expect(
        ticketCredential.connect(user1).revokeTicket(1)
      ).to.be.revertedWith("Only organizer can perform this action");
    });
  });

  // ─────────────────────────────────────────────
  // TicketCredential — Transfer
  // ─────────────────────────────────────────────
  describe("TicketCredential — transfer", function () {
    beforeEach(async function () {
      await didRegistry.connect(user1).registerIdentity("did:ethr:user1");
      await didRegistry.connect(user2).registerIdentity("did:ethr:user2");
      await ticketCredential
        .connect(organizer)
        .issueTicket(user1.address, "ipfs://QmABC");
    });

    it("owner can transfer a ticket to another registered user", async function () {
      await ticketCredential.connect(user1).transferTicket(1, user2.address);
      const ticket = await ticketCredential.getTicket(1);
      expect(ticket.owner).to.equal(user2.address);
    });

    it("emits TicketTransferred on transfer", async function () {
      await expect(
        ticketCredential.connect(user1).transferTicket(1, user2.address)
      )
        .to.emit(ticketCredential, "TicketTransferred")
        .withArgs(1, user1.address, user2.address);
    });

    it("reverts when recipient has no DID", async function () {
      await expect(
        ticketCredential.connect(user1).transferTicket(1, verifier.address)
      ).to.be.revertedWith("New owner must have registered DID");
    });

    it("reverts when non-owner tries to transfer", async function () {
      await expect(
        ticketCredential.connect(user2).transferTicket(1, user2.address)
      ).to.be.revertedWith("Only ticket owner can transfer");
    });

    it("reverts transfer of a used ticket", async function () {
      await ticketCredential.connect(verifier).verifyTicket(1);
      await expect(
        ticketCredential.connect(user1).transferTicket(1, user2.address)
      ).to.be.revertedWith("Used ticket cannot be transferred");
    });

    it("reverts transfer of a revoked ticket", async function () {
      await ticketCredential.connect(organizer).revokeTicket(1);
      await expect(
        ticketCredential.connect(user1).transferTicket(1, user2.address)
      ).to.be.revertedWith("Revoked ticket cannot be transferred");
    });
  });

  // ─────────────────────────────────────────────
  // End-to-end flow
  // ─────────────────────────────────────────────
  describe("End-to-end flow", function () {
    it("full lifecycle: register → issue → transfer → verify → replay rejected", async function () {
      // 1. Both users register DIDs
      await didRegistry.connect(user1).registerIdentity("did:ethr:user1");
      await didRegistry.connect(user2).registerIdentity("did:ethr:user2");

      // 2. Organizer issues ticket to user1
      await ticketCredential
        .connect(organizer)
        .issueTicket(user1.address, "ipfs://QmEvent");
      expect((await ticketCredential.getTicket(1)).owner).to.equal(user1.address);

      // 3. user1 transfers to user2
      await ticketCredential.connect(user1).transferTicket(1, user2.address);
      expect((await ticketCredential.getTicket(1)).owner).to.equal(user2.address);

      // 4. Verifier scans ticket — should succeed
      let tx = await ticketCredential.connect(verifier).verifyTicket(1);
      let receipt = await tx.wait();
      let event = receipt.logs.find((l) => l.fragment?.name === "TicketVerified");
      expect(event.args.success).to.equal(true);

      // 5. Replay attempt — should fail
      tx = await ticketCredential.connect(verifier).verifyTicket(1);
      receipt = await tx.wait();
      event = receipt.logs.find((l) => l.fragment?.name === "TicketVerified");
      expect(event.args.success).to.equal(false);

      // 6. Log should have 2 records (success + failure)
      expect(await verificationLog.getRecordCount()).to.equal(2);
    });
  });
});

