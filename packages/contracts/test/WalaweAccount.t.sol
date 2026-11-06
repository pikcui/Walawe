// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WalaweAccount, UserOperation} from "../src/WalaweAccount.sol";

contract WalaweAccountTest is Test {
    WalaweAccount account;
    address owner = address(0x1);
    address agentKey = address(0x2);
    address hacker = address(0x3);
    address entryPoint = address(0x4);

    function setUp() public {
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
        UserOperation memory userOp;
        // Mock signature to recover the owner address
        userOp.signature = abi.encodePacked(owner); 
        
        vm.prank(entryPoint);
        uint256 result = account.validateUserOp(userOp, bytes32(0), 0);
        assertEq(result, 0); // 0 means valid
    }

    function test_ValidateUserOp_SessionKey() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x5));

        UserOperation memory userOp;
        userOp.signature = abi.encodePacked(agentKey);

        vm.prank(entryPoint);
        uint256 result = account.validateUserOp(userOp, bytes32(0), 0);
        assertEq(result, 0); // 0 means valid
    }
}
