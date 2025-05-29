// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract BridgeBase is ReentrancyGuard, Pausable, Ownable {
    mapping(bytes32 => bool) public processedMessages;

    modifier onlyValidAddress(address to) {
        require(to != address(0), "Invalid address");
        _;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
