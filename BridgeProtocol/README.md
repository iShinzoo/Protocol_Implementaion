# LayerZero V2 Cross-Chain Protocol

A comprehensive guide for deploying and configuring LayerZero V2 OFT (Omnichain Fungible Token) across Sepolia and BSC testnets.

## Overview

This protocol enables seamless cross-chain token transfers between Sepolia (Ethereum testnet) and BSC testnet using LayerZero V2 infrastructure.

## Chain Configuration

| Chain | Chain ID | LayerZero Endpoint ID |
|-------|----------|----------------------|
| Sepolia | 11155111 | 40161 |
| BSC Testnet | 97 | 40102 |

## Prerequisites

- Node.js
- Hardhat
- Private keys for deployment accounts
- Test ETH on Sepolia
- Test BNB on BSC testnet

## Installation

```bash
yarn install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
SEPOLIA_RPC=YOUR_SEPOLIA_RPC_URL
BSC_TESTNET_RPC=YOUR_BSC_RPC_URL
ETHERSCAN_API_KEY=YOUR_SEPOLIA_API_KEY
BSC_SCAN_API_KEY=YOUR_BSC_API_KEY

DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY

SEPOLIA_EID=40161
SEPOLIA_TOKEN_NAME=sepOFT
SEPOLIA_TOKEN_SYMBOL=sOFT

BSC_EID=40102
BSC_TOKEN_NAME=bscOFT
BSC_TOKEN_SYMBOL=bOFT

ENDPOINT_ADDRESS=0x6EDCE65403992e310A62460808c4b910D972f10f

BSC_SENDLIBRARY=0x55f16c442907e86D764AFdc2a07C2de3BdAc8BB7
BSC_RECVLIBRARY=0x188d4bbCeD671A7aA2b5055937F79510A32e9683
BSC_EXECUTOR=0x31894b190a8bAbd9A067Ce59fde0BfCFD2B18470
BSC_DVN=0x0ee552262f7b562efced6dd4a7e2878ab897d405

SEP_SENDLIBRARY=0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE
SEP_RECVLIBRARY=0xdAf00F5eE2158dD58E0d3857851c432E34A3A851
SEP_EXECUTOR=0x718B92b5CB0a5552039B593faF724D182A881eDA
SEPOLIA_DVN=0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193

SEPOLIA_OFT=YOUR_SEPOLIA_ADDRESS
BSC_OFT=YOUR_BSC_ADDRESS
```

## Contract Addresses

### LayerZero V2 Endpoints
- **Sepolia**: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- **BSC Testnet**: `0x6EDCE65403992e310A62460808c4b910D972f10f`

### DVN Providers
- **DVN 1**: `0x4F675c48FaD936cb4c3cA07d7cBF421CeeAE0C75`
- **DVN 2**: `0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193`

## Deployment Steps

### 1. Deploy OFT Contract on Sepolia

```bash
npx hardhat run scripts/deploy/deploySepoliaContract.js --network sepolia
```

### 2. Deploy OFT Contract on BSC Testnet

```bash
npx hardhat run scripts/deploy/deployBscContract.js --network bscTestnet
```

### 3. Set Peer Connections

After deployment, update the contract addresses in your configuration and run:

```bash
# Set peer on Sepolia (pointing to BSC contract)
npx hardhat run scripts/deploy/fixPeers.js --network sepolia

# Set peer on BSC (pointing to Sepolia contract)
npx hardhat run scripts/deploy/fixPeersBsc.js --network bscTestnet
```

### 4. Configure Send and Receive Libraries

```bash
# Configure libraries on Sepolia
npx hardhat run scripts/deploy/setupSepolia.js --network sepolia

# Configure libraries on BSC
npx hardhat run scripts/deploy/setupBsc.js --network bscTestnet
```

### 5. Set Enforced Options

```bash
# Set enforced options on both chains
npx hardhat run scripts/deploy/setEnforcedOptionsSepolia.js --network sepolia
npx hardhat run scripts/deploy/setEnforcedOptionsBsc.js --network bscTestnet
```

## Configuration Details

### Executor Configuration
- **Max Message Size**: 100,000 bytes
- **Executor**: Owner address (pays destination execution fees)

### ULN Configuration
- **Confirmations**: 15 blocks
- **Required DVN Count**: 2
- **DVN Addresses**: See contract addresses section above

### Gas Options
- **Standard Transfer**: 200,000 gas limit
- **Compose Option**: 500,000 gas limit

## Usage

### Mint Tokens Cross-Chain

```bash
# Mint tokens from Sepolia to BSC
npx hardhat run scripts/deploy/mintTokens.js --network sepolia
```

### Send Tokens Cross-Chain

```bash
# Send tokens from Sepolia to BSC
npx hardhat run scripts/deploy/sendTokens.js --network sepolia
```

## Hardhat Configuration

Ensure your `hardhat.config.js` includes both networks:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY
    }
  }
};
```

## Verification

### Verify Contracts

```bash
# Verify on Sepolia
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "sdpOFT" "sdpOFT" "0x6EDCE65403992e310A62460808c4b910D972f10f" "OWNER_ADDRESS"

# Verify on BSC Testnet
npx hardhat verify --network bscTestnet DEPLOYED_CONTRACT_ADDRESS "sdpOFT" "sdpOFT" "0x6EDCE65403992e310A62460808c4b910D972f10f" "OWNER_ADDRESS"
```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Ensure you have enough native tokens for gas fees on both chains
2. **Peer Not Set**: Make sure setPeer is called on both contracts with correct addresses
3. **Library Configuration**: Verify send and receive libraries are properly configured
4. **DVN Configuration**: Ensure DVN addresses are correct and active


## Resources

- [LayerZero V2 Documentation](https://docs.layerzero.network/v2)
- [Deployed Contracts](https://docs.layerzero.network/v2/deployments/deployed-contracts)
- [DVN Addresses](https://docs.layerzero.network/v2/deployments/dvn-addresses)


