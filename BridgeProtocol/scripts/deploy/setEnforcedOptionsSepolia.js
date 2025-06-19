import hardhat from 'hardhat';
const { ethers } = hardhat;
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Contract addresses from your deployment
    const sepoliaOFTAddress = "0x4f08A4682C1871300f42D8686344dbD00CB99B51";
    const bscChainEid = 40102; // BSC Testnet EID
    
    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const tokenSepolia = MyOFT.attach(sepoliaOFTAddress);
    
    console.log("Setting enforced options on Sepolia...");
    
    // Create enforced options for BSC destination
    const options = Options.newOptions().addExecutorLzReceiveOption(50000, 0);
    const optionsBytes = "0x00030100110100000000000000000000000000013880";
    
    const enforcedOptions = [
        {
            eid: bscChainEid,
            msgType: 1, // SEND message type
            options: optionsBytes
        }
    ];
    
    const tx = await tokenSepolia.setEnforcedOptions(enforcedOptions);
    await tx.wait();
    
    console.log("Enforced options set successfully on Sepolia!");
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });