// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Destroyable is Ownable {
    constructor() {}

    function _withdrawToken(IERC20 token) public onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.transfer(msg.sender, balance);
        }
    }

    function destroy() public onlyOwner {
        selfdestruct(payable(msg.sender));
    }
}
