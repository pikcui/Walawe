// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

// Walawe Smart Account (ERC-4337)
// This contract allows the owner to add scoped session keys
// that AI agents can use to pay for APIs without holding the master key.

contract WalaweAccount {
    address public owner;

    struct SessionKey {
        bool active;
        uint256 validUntil;
        uint256 maxAmountPerTx;
        address allowedDestination;
    }

    mapping(address => SessionKey) public sessionKeys;

    event SessionKeyAdded(address indexed key, uint256 validUntil, uint256 maxAmountPerTx, address allowedDestination);
    event SessionKeyRevoked(address indexed key);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    // User adds an AI agent's session key
    function addSessionKey(
        address key, 
        uint256 validUntil, 
        uint256 maxAmountPerTx, 
        address allowedDestination
    ) external onlyOwner {
        sessionKeys[key] = SessionKey(true, validUntil, maxAmountPerTx, allowedDestination);
        emit SessionKeyAdded(key, validUntil, maxAmountPerTx, allowedDestination);
    }

    // User can instantly revoke a rogue agent (Kill Switch)
    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    // Validate signature (Simplified for MVP v1)
    // In reality, this would implement ERC-1271 or similar
    function isValidSession(address key) public view returns (bool) {
        return sessionKeys[key].active && block.timestamp < sessionKeys[key].validUntil;
    }
}
