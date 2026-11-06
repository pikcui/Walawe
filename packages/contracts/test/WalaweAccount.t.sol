// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WalaweAccount} from "../src/WalaweAccount.sol";

contract WalaweAccountTest is Test {
    WalaweAccount account;
    address owner = address(0x1);
    address agentKey = address(0x2);
    address hacker = address(0x3);

    function setUp() public {
        vm.prank(owner);
        account = new WalaweAccount(owner);
    }

    function test_OwnerCanAddSessionKey() public {
        vm.prank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x4));
        assertTrue(account.isValidSession(agentKey));
    }

    function test_RevertIf_NonOwnerAddsSessionKey() public {
        vm.prank(hacker);
        vm.expectRevert("Not authorized");
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x4));
    }

    function test_OwnerCanRevokeSessionKey() public {
        vm.startPrank(owner);
        account.addSessionKey(agentKey, block.timestamp + 1 days, 1000, address(0x4));
        assertTrue(account.isValidSession(agentKey));
        account.revokeSessionKey(agentKey);
        assertFalse(account.isValidSession(agentKey));
        vm.stopPrank();
    }
}
