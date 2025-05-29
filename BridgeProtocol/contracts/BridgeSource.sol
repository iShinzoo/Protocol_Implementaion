// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BridgeBase.sol";

interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable;
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
}

contract BridgeSource is BridgeBase {
    address public token;
    ILayerZeroEndpoint public endpoint;
    address public destinationBridge;

    event BridgeInitiated(address indexed sender, address indexed to, uint256 amount, uint16 dstChainId);

    constructor(address _token, address _endpoint, address _destinationBridge) {
        token = _token;
        endpoint = ILayerZeroEndpoint(_endpoint);
        destinationBridge = _destinationBridge;
    }

    function bridgeTokens(
        uint16 dstChainId,
        bytes calldata destinationAddress,
        uint256 amount
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");

        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        bytes memory payload = abi.encode(msg.sender, amount);
        endpoint.send{value: msg.value}(
            dstChainId,
            destinationAddress,
            payload,
            payable(msg.sender),
            address(0x0),
            bytes("")
        );

        emit BridgeInitiated(msg.sender, address(0), amount, dstChainId);
    }
}
