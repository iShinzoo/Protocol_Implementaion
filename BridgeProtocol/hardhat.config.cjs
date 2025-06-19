require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.22",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 400,
                        details: {yul: false},
                    }
                }
            }
        ]
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        bscTestnet: {
            url: process.env.BSC_TESTNET_RPC || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
        }
    },
    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_API_KEY,
            bscTestnet: process.env.BSC_SCAN_API_KEY,
        },
        customChains: [
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                  apiURL: "https://api-testnet.bscscan.com/api",
                  browserURL: "https://testnet.bscscan.com"
                }
              }
        ]
    },
    mocha: {
        timeout: 100000000
    },
};
