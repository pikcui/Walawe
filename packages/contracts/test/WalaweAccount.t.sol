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
    address allowedDest = address(0x5);
    address unauthorizedDest = address(0x6);

    function setUp() public {
        ownerPrivateKey = 0xA11CE;
        owner = vm.addr(ownerPrivateKey);
        agentPrivateKey = 0xB0B;
        agentKey = vm.addr(agentPrivateKey);

        vm.prank(owner);
        account = new WalaweAccount(owner, entryPoint);
        
        // Beri saldo kontrak untuk bayar gas
        vm.deal(address(account), 1 ether);
    }

    function test_OwnerCanAddSessionKey() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, allowedDest);
        assertTrue(account.isValidSession(agentKey));
    }

    function test_ValidateUserOp_OwnerBypass() public {
        bytes32 userOpHash = keccak256("test_op");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, userOpHash);

        UserOperation memory userOp;
        userOp.signature = abi.encodePacked(r, s, v);

        vm.prank(entryPoint);
        assertEq(account.validateUserOp(userOp, userOpHash, 0), 0);
    }

    function test_ValidateUserOp_SessionKey_ValidExecute() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, allowedDest);

        bytes32 userOpHash = keccak256("test_op_session");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);

        UserOperation memory userOp;
        userOp.signature = abi.encodePacked(r, s, v);
        // Construct valid callData: execute(allowedDest, 500, "")
        userOp.callData = abi.encodeWithSelector(bytes4(0xb61d27f6), allowedDest, 500, "");

        vm.prank(entryPoint);
        assertEq(account.validateUserOp(userOp, userOpHash, 0), 0);
    }

    function test_ValidateUserOp_SessionKey_ExceedsMaxAmount() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, allowedDest);

        bytes32 userOpHash = keccak256("test_op_session");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);

        UserOperation memory userOp;
        userOp.signature = abi.encodePacked(r, s, v);
        // Construct callData: execute(allowedDest, 2000, "") -> Exceeds max 1000
        userOp.callData = abi.encodeWithSelector(bytes4(0xb61d27f6), allowedDest, 2000, "");

        vm.prank(entryPoint);
        vm.expectRevert("Amount exceeds Session Key limit");
        account.validateUserOp(userOp, userOpHash, 0);
    }

    function test_ValidateUserOp_SessionKey_InvalidDestination() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, allowedDest);

        bytes32 userOpHash = keccak256("test_op_session");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);

        UserOperation memory userOp;
        userOp.signature = abi.encodePacked(r, s, v);
        // Construct callData: execute(unauthorizedDest, 500, "")
        userOp.callData = abi.encodeWithSelector(bytes4(0xb61d27f6), unauthorizedDest, 500, "");

        vm.prank(entryPoint);
        vm.expectRevert("Invalid destination for Session Key");
        account.validateUserOp(userOp, userOpHash, 0);
    }
}
