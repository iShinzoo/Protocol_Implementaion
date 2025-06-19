import hardhat from 'hardhat';
const { ethers } = hardhat;
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Contract addresses from your deployment
    const bscOFTAddress = "0x70E594c78B041E2d430236D733b33170b0F4A749";
    const sepoliaChainEid = 40161; // Sepolia EID
    
    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const tokenBsc = MyOFT.attach(bscOFTAddress);
    
    console.log("Setting enforced options on BSC...");
    
    // Create enforced options for Sepolia destination
    const options = Options.newOptions().addExecutorLzReceiveOption(50000, 0);
    const optionsBytes = "0x00030100110100000000000000000000000000013880";
    
    const enforcedOptions = [
        {
            eid: sepoliaChainEid,
            msgType: 1, // SEND message type
            options: optionsBytes
        }
    ];
    
    const tx = await tokenBsc.setEnforcedOptions(enforcedOptions);
    await tx.wait();
    
    console.log("Enforced options set successfully on BSC!");
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });