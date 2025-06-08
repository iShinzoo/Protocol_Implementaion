// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BridgeBase.sol";

interface ILayerZeroReceiver {
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64, /* _nonce */
        bytes calldata _payload
    ) external;
}

interface IERC20Mint {
    function mint(address, uint256) external;
}

contract BridgeDestination is BridgeBase, ILayerZeroReceiver {
    address public token;
    address public trustedSourceBridge;

    event BridgeReceived(address indexed receiver, uint256 amount);

    constructor(address _token, address _trustedSourceBridge, address _owner)
        BridgeBase(_owner)
    {
        token = _token;
        trustedSourceBridge = _trustedSourceBridge;
    }

    function lzReceive(
        uint16, /* _srcChainId */
        bytes calldata _srcAddress,
        uint64 /* _nonce */,
        bytes calldata _payload
    ) external override nonReentrant whenNotPaused {
        require(keccak256(_srcAddress) == keccak256(abi.encodePacked(trustedSourceBridge)), "Invalid source bridge");

        bytes32 messageHash = keccak256(_payload);
        require(!processedMessages[messageHash], "Message already processed");
        processedMessages[messageHash] = true;

        (address to, uint256 amount) = abi.decode(_payload, (address, uint256));

        IERC20Mint(token).mint(to, amount);
        emit BridgeReceived(to, amount);
    }
}
