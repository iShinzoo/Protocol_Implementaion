import hardhat from "hardhat";
const { ethers, run } = hardhat;
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployerSigner] = await ethers.getSigners();

  const tokenName = process.env.SEPOLIA_TOKEN_NAME;
  const tokenSymbol = process.env.SEPOLIA_TOKEN_SYMBOL;
  const endpoint = process.env.ENDPOINT_ADDRESS;

  const MyOFT = await ethers.getContractFactory("MyOFT", deployerSigner);
  console.log("Deploying MyOFT on Sepolia: ");
  const sepoliaMyOFT = await MyOFT.deploy(tokenName, tokenSymbol, endpoint, deployerSigner.address);
  await sepoliaMyOFT.deployTransaction.wait(3);
  console.log("MyOFT Deployed to:", sepoliaMyOFT.address);

  // Verification process
  console.log("Verifying MyOFT contract...");
  await run("verify:verify", {
    address: sepoliaMyOFT.address,
    constructorArguments: [tokenName, tokenSymbol, endpoint, deployerSigner.address],
    contract: "contracts/MyOFT.sol:MyOFT"
  });
  console.log("SEPOLIA_OFT_CONTRACT_ADDRESS", sepoliaMyOFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });