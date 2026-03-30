// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VerificationLog
/// @notice Stores verification history for event tickets.
/// @dev This contract records when a verifier checks a ticket at entry.
contract VerificationLog {
    struct VerificationRecord {
        uint256 ticketId;
        address verifier;
        uint256 timestamp;
        bool success;
        string note;
    }

    VerificationRecord[] private records;

    event TicketVerified(
        uint256 indexed ticketId,
        address indexed verifier,
        bool success,
        string note,
        uint256 timestamp
    );

    /// @notice Add a verification event to the on-chain log.
    /// @param _ticketId The ID of the ticket being checked.
    /// @param _verifier The address performing verification.
    /// @param _success Whether the verification succeeded.
    /// @param _note A short note such as "Valid entry" or "Ticket already used".
    function logVerification(
        uint256 _ticketId,
        address _verifier,
        bool _success,
        string calldata _note
    ) external {
        records.push(
            VerificationRecord({
                ticketId: _ticketId,
                verifier: _verifier,
                timestamp: block.timestamp,
                success: _success,
                note: _note
            })
        );

        emit TicketVerified(_ticketId, _verifier, _success, _note, block.timestamp);
    }

    /// @notice Returns one verification record by index.
    /// @param _index Position in the records array.
    function getRecord(uint256 _index)
        external
        view
        returns (
            uint256 ticketId,
            address verifier,
            uint256 timestamp,
            bool success,
            string memory note
        )
    {
        require(_index < records.length, "Invalid index");
        VerificationRecord memory record = records[_index];
        return (
            record.ticketId,
            record.verifier,
            record.timestamp,
            record.success,
            record.note
        );
    }

    /// @notice Returns how many verification records exist.
    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
}
