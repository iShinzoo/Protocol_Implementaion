// Deployment script for BridgeProtocol contracts
// Usage: npx hardhat run scripts/deploy.js --network <network>

const hre = require("hardhat");

async function main() {
  // Deploy BridgedToken
  const BridgedToken = await hre.ethers.getContractFactory("BridgedToken");
  const bridgedToken = await BridgedToken.deploy();
  await bridgedToken.deployed();
  console.log("BridgedToken deployed to:", bridgedToken.address);

  // Grant BRIDGE_ROLE to bridge contracts after deployment
  // Deploy BridgeSource
  // Replace with actual LayerZero endpoint and destination bridge addresses
  const LAYERZERO_ENDPOINT = "0xYourLayerZeroEndpoint";
  const DESTINATION_BRIDGE = "0xYourDestinationBridge";
  const BridgeSource = await hre.ethers.getContractFactory("BridgeSource");
  const bridgeSource = await BridgeSource.deploy(
    bridgedToken.address,
    LAYERZERO_ENDPOINT,
    DESTINATION_BRIDGE
  );
  await bridgeSource.deployed();
  console.log("BridgeSource deployed to:", bridgeSource.address);

  // Deploy BridgeDestination
  // Replace with actual trusted source bridge address
  const TRUSTED_SOURCE_BRIDGE = bridgeSource.address;
  const BridgeDestination = await hre.ethers.getContractFactory("BridgeDestination");
  const bridgeDestination = await BridgeDestination.deploy(
    bridgedToken.address,
    TRUSTED_SOURCE_BRIDGE
  );
  await bridgeDestination.deployed();
  console.log("BridgeDestination deployed to:", bridgeDestination.address);

  // Grant BRIDGE_ROLE to bridge contracts
  const BRIDGE_ROLE = await bridgedToken.BRIDGE_ROLE();
  await bridgedToken.grantRole(BRIDGE_ROLE, bridgeSource.address);
  await bridgedToken.grantRole(BRIDGE_ROLE, bridgeDestination.address);
  console.log("BRIDGE_ROLE granted to bridge contracts.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
