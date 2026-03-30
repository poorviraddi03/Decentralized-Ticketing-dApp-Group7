// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DIDRegistry
/// @notice Registers and manages decentralized identifiers (DIDs) for users.
/// @dev Each wallet address can register one DID string for this prototype.
contract DIDRegistry {
    struct Identity {
        string did;
        bool registered;
        uint256 registeredAt;
    }

    mapping(address => Identity) private identities;

    event IdentityRegistered(address indexed user, string did, uint256 timestamp);
    event IdentityUpdated(address indexed user, string newDid, uint256 timestamp);

    /// @notice Register a DID for the sender's wallet address.
    /// @param _did The decentralized identifier string.
    function registerIdentity(string calldata _did) external {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(!identities[msg.sender].registered, "Identity already registered");

        identities[msg.sender] = Identity({
            did: _did,
            registered: true,
            registeredAt: block.timestamp
        });

        emit IdentityRegistered(msg.sender, _did, block.timestamp);
    }

    /// @notice Update the DID for the sender's wallet address.
    /// @param _newDid The new DID string.
    function updateIdentity(string calldata _newDid) external {
        require(identities[msg.sender].registered, "Identity not registered");
        require(bytes(_newDid).length > 0, "DID cannot be empty");

        identities[msg.sender].did = _newDid;

        emit IdentityUpdated(msg.sender, _newDid, block.timestamp);
    }

    /// @notice Get identity details for a wallet.
    /// @param _user The wallet address to query.
    /// @return did The DID string.
    /// @return registered Whether the identity exists.
    /// @return registeredAt Timestamp when the identity was first registered.
    function getIdentity(address _user)
        external
        view
        returns (string memory did, bool registered, uint256 registeredAt)
    {
        Identity memory identity = identities[_user];
        return (identity.did, identity.registered, identity.registeredAt);
    }

    /// @notice Check whether a wallet has a registered identity.
    /// @param _user The wallet address to query.
    /// @return True if the wallet has registered a DID.
    function isRegistered(address _user) external view returns (bool) {
        return identities[_user].registered;
    }
}
