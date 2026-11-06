// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Mock IAccount interface for ERC-4337
interface IAccount {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

contract WalaweAccount is IAccount {
    address public immutable owner;
    address public immutable entryPoint;

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

    constructor(address _owner, address _entryPoint) {
        owner = _owner;
        entryPoint = _entryPoint;
    }

    function addSessionKey(
        address key, 
        uint256 validUntil, 
        uint256 maxAmountPerTx, 
        address allowedDestination
    ) external onlyOwner {
        sessionKeys[key] = SessionKey(true, validUntil, maxAmountPerTx, allowedDestination);
        emit SessionKeyAdded(key, validUntil, maxAmountPerTx, allowedDestination);
    }

    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    function isValidSession(address key) public view returns (bool) {
        return sessionKeys[key].active && block.timestamp < sessionKeys[key].validUntil;
    }

    // ERC-4337 Core Function with REAL ECDSA Verification
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /* missingAccountFunds */
    ) external view override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Caller must be EntryPoint");

        // 1. Verify Signature using OpenZeppelin ECDSA
        address signer = ECDSA.recover(userOpHash, userOp.signature);
        
        // 2. Check if signer is owner (Master Key)
        if (signer == owner) {
            return 0; // Valid signature
        }

        // 3. Check if signer is a valid Session Key
        if (isValidSession(signer)) {
            return 0; // Valid session key
        }

        return 1; // Invalid
    }
}
