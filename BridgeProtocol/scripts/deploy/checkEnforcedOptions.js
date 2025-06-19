import hardhat from 'hardhat';
const { ethers } = hardhat;

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Your deployed contract addresses
    const SEPOLIA_OFT_ADDRESS = "0x4f08A4682C1871300f42D8686344dbD00CB99B51";
    
    // Chain EIDs
    const BSC_CHAIN_EID = 40102; // BSC Testnet
    const SEND_MSG_TYPE = 1; // SEND message type
    
    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const oftSepolia = MyOFT.attach(SEPOLIA_OFT_ADDRESS);
    
    try {
        console.log("Checking enforced options...");
        
        // Try to get enforced options (this function might exist)
        try {
            const enforcedOptions = await oftSepolia.enforcedOptions(BSC_CHAIN_EID, SEND_MSG_TYPE);
            console.log(`Enforced options for BSC (EID: ${BSC_CHAIN_EID}):`, enforcedOptions);
        } catch (error) {
            console.log("Cannot read enforced options directly");
        }
        
        // Check basic contract info
        const name = await oftSepolia.name();
        const symbol = await oftSepolia.symbol();
        const balance = await oftSepolia.balanceOf(deployer.address);
        
        console.log("\n=== Contract Info ===");
        console.log(`Contract: ${SEPOLIA_OFT_ADDRESS}`);
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Your Balance: ${ethers.utils.formatEther(balance)} tokens`);
        
        // Check if peer is set correctly
        try {
            const peer = await oftSepolia.peers(BSC_CHAIN_EID);
            console.log(`Peer for BSC (EID: ${BSC_CHAIN_EID}): ${peer}`);
            
            // Convert peer back to address to verify
            const peerAddress = ethers.utils.getAddress(ethers.utils.hexDataSlice(peer, 12));
            console.log(`Peer address: ${peerAddress}`);
            console.log(`Expected BSC address: 0x70E594c78B041E2d430236D733b33170b0F4A749`);
            
        } catch (error) {
            console.error("Cannot read peer info:", error.message);
        }
        
    } catch (error) {
        console.error("Error checking contract info:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});