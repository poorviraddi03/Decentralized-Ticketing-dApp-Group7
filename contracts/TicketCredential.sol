// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal interface to check whether a user has a registered DID.
interface IDIDRegistry {
    function isRegistered(address _user) external view returns (bool);
}

/// @notice Minimal interface to record verification events.
interface IVerificationLog {
    function logVerification(
        uint256 _ticketId,
        address _verifier,
        bool _success,
        string calldata _note
    ) external;
}

/// @title TicketCredential
/// @notice Issues, verifies, and tracks usage of blockchain-linked event tickets.
/// @dev Ticket metadata itself can be stored off-chain, while only a hash/reference is stored on-chain.
contract TicketCredential {
    struct Ticket {
        uint256 ticketId;
        address owner;
        string metadataHash;
        bool issued;
        bool used;
        bool revoked;
    }

    address public organizer;
    IDIDRegistry public didRegistry;
    IVerificationLog public verificationLog;

    uint256 public nextTicketId;

    mapping(uint256 => Ticket) public tickets;

    event TicketIssued(uint256 indexed ticketId, address indexed owner, string metadataHash);
    event TicketVerified(uint256 indexed ticketId, address indexed verifier, bool success);
    event TicketRevoked(uint256 indexed ticketId);
    event TicketTransferred(uint256 indexed ticketId, address indexed from, address indexed to);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can perform this action");
        _;
    }

    constructor(address _didRegistryAddress, address _verificationLogAddress) {
        organizer = msg.sender;
        didRegistry = IDIDRegistry(_didRegistryAddress);
        verificationLog = IVerificationLog(_verificationLogAddress);
        nextTicketId = 1;
    }

    /// @notice Issue a ticket to a registered user.
    /// @param _recipient The wallet receiving the ticket.
    /// @param _metadataHash Off-chain ticket data hash/reference (e.g. IPFS CID or hash).
    function issueTicket(address _recipient, string calldata _metadataHash) external onlyOrganizer {
        require(_recipient != address(0), "Invalid recipient");
        require(bytes(_metadataHash).length > 0, "Metadata hash required");
        require(didRegistry.isRegistered(_recipient), "Recipient must have registered DID");

        uint256 ticketId = nextTicketId;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            owner: _recipient,
            metadataHash: _metadataHash,
            issued: true,
            used: false,
            revoked: false
        });

        nextTicketId++;

        emit TicketIssued(ticketId, _recipient, _metadataHash);
    }

    /// @notice Verify a ticket at entry and mark it as used if valid.
    /// @param _ticketId The ticket being checked.
    /// @return True if the ticket is valid and accepted.
    function verifyTicket(uint256 _ticketId) external returns (bool) {
        Ticket storage ticket = tickets[_ticketId];

        if (!ticket.issued) {
            verificationLog.logVerification(_ticketId, msg.sender, false, "Ticket does not exist");
            emit TicketVerified(_ticketId, msg.sender, false);
            return false;
        }

        if (ticket.revoked) {
            verificationLog.logVerification(_ticketId, msg.sender, false, "Ticket revoked");
            emit TicketVerified(_ticketId, msg.sender, false);
            return false;
        }

        if (ticket.used) {
            verificationLog.logVerification(_ticketId, msg.sender, false, "Ticket already used");
            emit TicketVerified(_ticketId, msg.sender, false);
            return false;
        }

        ticket.used = true;

        verificationLog.logVerification(_ticketId, msg.sender, true, "Valid ticket");
        emit TicketVerified(_ticketId, msg.sender, true);
        return true;
    }

    /// @notice Revoke a ticket so it can no longer be used.
    /// @param _ticketId The ticket to revoke.
    function revokeTicket(uint256 _ticketId) external onlyOrganizer {
        require(tickets[_ticketId].issued, "Ticket does not exist");
        require(!tickets[_ticketId].revoked, "Ticket already revoked");

        tickets[_ticketId].revoked = true;

        emit TicketRevoked(_ticketId);
    }

    /// @notice Transfer a ticket to another registered user before it is used.
    /// @param _ticketId The ticket to transfer.
    /// @param _newOwner The wallet receiving the ticket.
    function transferTicket(uint256 _ticketId, address _newOwner) external {
        require(_newOwner != address(0), "Invalid new owner");
        require(didRegistry.isRegistered(_newOwner), "New owner must have registered DID");

        Ticket storage ticket = tickets[_ticketId];

        require(ticket.issued, "Ticket does not exist");
        require(!ticket.used, "Used ticket cannot be transferred");
        require(!ticket.revoked, "Revoked ticket cannot be transferred");
        require(ticket.owner == msg.sender, "Only ticket owner can transfer");

        address previousOwner = ticket.owner;
        ticket.owner = _newOwner;

        emit TicketTransferred(_ticketId, previousOwner, _newOwner);
    }

    /// @notice Get ticket details for display in frontend or testing.
    /// @param _ticketId The ticket ID to query.
    function getTicket(uint256 _ticketId)
        external
        view
        returns (
            uint256 ticketId,
            address owner,
            string memory metadataHash,
            bool issued,
            bool used,
            bool revoked
        )
    {
        Ticket memory ticket = tickets[_ticketId];
        return (
            ticket.ticketId,
            ticket.owner,
            ticket.metadataHash,
            ticket.issued,
            ticket.used,
            ticket.revoked
        );
    }
}
