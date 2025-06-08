// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockLayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable {
        // Mock implementation - just accept the call
    }
    
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint nativeFee, uint zroFee) {
        // Return mock fees
        return (0.01 ether, 0);
    }
} 