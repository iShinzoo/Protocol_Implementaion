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
    
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint nativeFee, uint zroFee);
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract BridgeSource is BridgeBase {
    address public token;
    ILayerZeroEndpoint public endpoint;
    
    // Mapping to store trusted remote addresses for each chain
    mapping(uint16 => bytes) public trustedRemoteLookup;
    
    event BridgeInitiated(address indexed sender, address indexed to, uint256 amount, uint16 dstChainId);
    event SetTrustedRemote(uint16 _remoteChainId, bytes _path);

    constructor(
        address _token, 
        address _endpoint,
        address initialOwner
    ) BridgeBase(initialOwner) {
        require(_token != address(0), "Invalid token address");
        require(_endpoint != address(0), "Invalid endpoint address");
        
        token = _token;
        endpoint = ILayerZeroEndpoint(_endpoint);
    }

    // CRITICAL: Set trusted remote address for destination chain
    function setTrustedRemote(uint16 _remoteChainId, bytes calldata _path) external onlyOwner {
        trustedRemoteLookup[_remoteChainId] = _path;
        emit SetTrustedRemote(_remoteChainId, _path);
    }

    function bridgeTokens(
        uint16 dstChainId,
        bytes calldata destinationAddress, // This should be the user's destination address
        uint256 amount
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(msg.value > 0, "Must send ETH for LayerZero fees");
        
        // Check if trusted remote is set
        bytes memory trustedRemote = trustedRemoteLookup[dstChainId];
        require(trustedRemote.length > 0, "Trusted remote not set for this chain");
        
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Encode the payload with sender and destination info
        bytes memory payload = abi.encode(destinationAddress, amount);
        
        // Use the trusted remote address for LayerZero communication
        endpoint.send{value: msg.value}(
            dstChainId,
            trustedRemote, // This is the destination bridge contract address
            payload,
            payable(msg.sender),
            address(0x0),
            bytes("")
        );

        emit BridgeInitiated(msg.sender, address(0), amount, dstChainId);
    }

    // Function to estimate LayerZero fees
    function estimateFees(
        uint16 dstChainId,
        bytes calldata destinationAddress,
        uint256 amount
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        bytes memory payload = abi.encode(destinationAddress, amount);
        return endpoint.estimateFees(dstChainId, address(this), payload, false, bytes(""));
    }

    // Function to withdraw stuck tokens (only owner)
    function withdrawTokens(address _token, uint256 amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(_token).transfer(owner(), amount);
        }
    }
}