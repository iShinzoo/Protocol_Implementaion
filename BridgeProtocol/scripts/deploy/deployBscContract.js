import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();



async function main() {
  const [deployerSigner] = await ethers.getSigners();

  const tokenName = process.env.BSC_TOKEN_NAME;
  const tokenSymbol = process.env.BSC_TOKEN_SYMBOL;
  const endpoint = process.env.ENDPOINT_ADDRESS;

  const MyOFT = await ethers.getContractFactory("MyOFT", deployerSigner);
  console.log("Deploying MyOFT Contract on BSC Testnet: ");
  const bscMyOFT = await MyOFT.deploy(tokenName, tokenSymbol, endpoint, deployerSigner.address);
  await bscMyOFT.deployTransaction.wait(3);
  console.log("BSC MyOFT Deployed to:", bscMyOFT.address);
  // Verification process
  console.log("Verifying MyOFT contract...");
  await run("verify:verify", {
    address: bscMyOFT.address,
    constructorArguments: [tokenName, tokenSymbol, endpoint, deployerSigner.address],
    contract: "contracts/MyOFT.sol:MyOFT"
  });
  console.log("BSC_OFT_CONTRACT_ADDRESS", bscMyOFT.address)
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });