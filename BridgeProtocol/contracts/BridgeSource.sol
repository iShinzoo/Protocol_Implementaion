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
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract BridgeSource is BridgeBase {
    address public token;
    ILayerZeroEndpoint public endpoint;
    address public destinationBridge;

    event BridgeInitiated(address indexed sender, address indexed to, uint256 amount, uint16 dstChainId);

    constructor(
        address _token, 
        address _endpoint, 
        address _destinationBridge,
        address initialOwner
    ) BridgeBase(initialOwner) {
        require(_token != address(0), "Invalid token address");
        require(_endpoint != address(0), "Invalid endpoint address");
        require(_destinationBridge != address(0), "Invalid destination bridge address");
        
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
        require(msg.value > 0, "Must send ETH for LayerZero fees");

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

    // Function to update destination bridge address (only owner)
    function updateDestinationBridge(address _newDestinationBridge) external onlyOwner {
        require(_newDestinationBridge != address(0), "Invalid address");
        destinationBridge = _newDestinationBridge;
    }

    // Function to withdraw stuck tokens (only owner)
    function withdrawTokens(address _token, uint256 amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(_token).transfer(owner(), amount);
        }
    }

    // Function to estimate LayerZero fees (pure function for placeholder)
    function estimateFees(
        uint16, /* dstChainId */
        bytes calldata, /* destinationAddress */
        bytes calldata, /* payload */
        bool, /* useZro */
        bytes calldata /* adapterParams */
    ) external pure returns (uint256 nativeFee, uint256 zroFee) {
        // Note: This would need to be implemented based on LayerZero's fee estimation
        // For now, returning a placeholder - in production, this should call LayerZero's estimateFees
        return (0.001 ether, 0);
    }
}