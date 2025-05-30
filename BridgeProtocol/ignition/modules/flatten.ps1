# Flatten all contracts to the flat/ directory
# Usage: powershell ./ignition/modules/flatten.ps1

if (!(Test-Path -Path "flat")) {
    New-Item -ItemType Directory -Path "flat"
}

npx hardhat flatten ../contracts/BridgeSource.sol | Out-File -Encoding utf8 flat/BridgeSource_flat.sol
npx hardhat flatten ../contracts/BridgeDestination.sol | Out-File -Encoding utf8 flat/BridgeDestination_flat.sol
npx hardhat flatten ../contracts/BridgeToken.sol | Out-File -Encoding utf8 flat/BridgeToken_flat.sol
