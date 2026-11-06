// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WalaweAccount, UserOperation} from "../src/WalaweAccount.sol";

contract WalaweAccountTest is Test {
    WalaweAccount account;
    address owner;
    uint256 ownerPrivateKey;
    address agentKey;
    uint256 agentPrivateKey;
    address entryPoint = address(0x4);

    function setUp() public {
        // Generate real wallets for testing
        ownerPrivateKey = 0xA11CE;
        owner = vm.addr(ownerPrivateKey);
        
        agentPrivateKey = 0xB0B;
        agentKey = vm.addr(agentPrivateKey);

        vm.prank(owner);
        account = new WalaweAccount(owner, entryPoint);
    }

    function test_OwnerCanAddSessionKey() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x5));
        assertTrue(account.isValidSession(agentKey));
    }

    function test_OwnerCanRevokeSessionKey() public {
        vm.startPrank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x5));
        assertTrue(account.isValidSession(agentKey));
        account.revokeSessionKey(agentKey);
        assertFalse(account.isValidSession(agentKey));
        vm.stopPrank();
    }

    function test_ValidateUserOp_Owner() public {
        bytes32 userOpHash = keccak256("test_op");
        
        // Sign the hash with Owner's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, userOpHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        UserOperation memory userOp;
        userOp.signature = signature;

        vm.prank(entryPoint);
        uint256 result = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(result, 0); // 0 means valid
    }

    function test_ValidateUserOp_SessionKey() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x5));

        bytes32 userOpHash = keccak256("test_op_session");
        
        // Sign the hash with Agent's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        UserOperation memory userOp;
        userOp.signature = signature;

        vm.prank(entryPoint);
        uint256 result = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(result, 0); // 0 means valid
    }

    function test_ValidateUserOp_InvalidSignature() public {
        bytes32 userOpHash = keccak256("test_op_invalid");
        
        // Sign with a random private key (hacker)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBAD, userOpHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        UserOperation memory userOp;
        userOp.signature = signature;

        vm.prank(entryPoint);
        uint256 result = account.validateUserOp(userOp, userOpHash, 0);
        assertEq(result, 1); // 1 means invalid
    }
}
