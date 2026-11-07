// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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

    // ERC-4337 Core Function with REAL ECDSA Verification and Limits Enforcement
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /* missingAccountFunds */
    ) external view override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Caller must be EntryPoint");

        // 1. Verify Signature
        address signer = ECDSA.recover(userOpHash, userOp.signature);
        
        // 2. Owner bypasses limits (Master Key)
        if (signer == owner) {
            return 0; 
        }

        // 3. Session Key must be active and not expired
        if (isValidSession(signer)) {
            // Decode callData to check target and amount
            // We assume the callData is a standard transfer(address, uint256)
            // function selector for transfer is 0xa9059cbb
            if (userOp.callData.length >= 68) {
                bytes4 selector = bytes4(userOp.callData[0:4]);
                if (selector == bytes4(0xa9059cbb)) {
                    // Decode the address and amount from callData
                    (address to, uint256 amount) = abi.decode(userOp.callData[4:], (address, uint256));
                    
                    SessionKey memory sk = sessionKeys[signer];
                    require(to == sk.allowedDestination, "Invalid destination for Session Key");
                    require(amount <= sk.maxAmountPerTx, "Amount exceeds Session Key limit");
                    return 0; 
                }
            }
            // If we can't parse the callData or it's not a transfer, reject for safety
            return 1; 
        }

        return 1; // Invalid signature
    }
}
