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

    receive() external payable {}

    // Fungsi Execute standar untuk Smart Account
    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == entryPoint || msg.sender == owner, "Only EntryPoint or Owner");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "Execution failed");
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

    // ERC-4337 Core Function
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Caller must be EntryPoint");

        // Bayar gas prefund jika diminta oleh EntryPoint
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success);
        }

        // 1. Verify Signature
        address signer = ECDSA.recover(userOpHash, userOp.signature);

        // 2. Owner bypasses limits (Master Key)
        if (signer == owner) {
            return 0;
        }

        // 3. Session Key Check
        if (isValidSession(signer)) {
            // Pastikan calldata adalah panggilan ke fungsi 'execute'
            if (userOp.callData.length >= 4) {
                bytes4 selector = bytes4(userOp.callData[0:4]);
                // Selector untuk execute(address,uint256,bytes) adalah 0xb61d27f6
                if (selector == bytes4(0xb61d27f6)) {
                    // Decode parameter execute
                    (address dest, uint256 value, ) = abi.decode(userOp.callData[4:], (address, uint256, bytes));
                    
                    SessionKey memory sk = sessionKeys[signer];
                    require(dest == sk.allowedDestination, "Invalid destination for Session Key");
                    require(value <= sk.maxAmountPerTx, "Amount exceeds Session Key limit");
                    return 0;
                }
            }
            return 1; // Gagal jika bukan fungsi execute
        }

        return 1; // Invalid signature
    }
}
