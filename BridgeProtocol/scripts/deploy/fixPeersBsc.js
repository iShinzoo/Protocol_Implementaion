import hardhat from 'hardhat';
const { ethers } = hardhat;

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Your deployed contract addresses
    const SEPOLIA_OFT_ADDRESS = "0x4f08A4682C1871300f42D8686344dbD00CB99B51";
    const BSC_OFT_ADDRESS = "0x70E594c78B041E2d430236D733b33170b0F4A749";
    
    // Chain EIDs
    const BSC_CHAIN_EID = 40102; // BSC Testnet
    const SEPOLIA_CHAIN_EID = 40161; // Sepolia
    
    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const oftBsc = MyOFT.attach(BSC_OFT_ADDRESS);
    
    try {
        console.log("Setting peer on BSC for Sepolia...");
        
        // Convert Sepolia address to bytes32
        const sepoliaAddressBytes32 = ethers.utils.hexZeroPad(SEPOLIA_OFT_ADDRESS, 32);
        
        console.log(`Sepolia Address: ${SEPOLIA_OFT_ADDRESS}`);
        console.log(`Sepolia Address as bytes32: ${sepoliaAddressBytes32}`);
        
        // Set peer
        const tx = await oftBsc.setPeer(SEPOLIA_CHAIN_EID, sepoliaAddressBytes32);
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`Peer set successfully! Block: ${receipt.blockNumber}`);
        
        // Verify the peer is set correctly
        const peer = await oftBsc.peers(SEPOLIA_CHAIN_EID);
        console.log(`Peer for Sepolia (EID: ${SEPOLIA_CHAIN_EID}): ${peer}`);
        
        // Convert back to address to verify
        const peerAddress = ethers.utils.getAddress(peer.slice(-40));
        console.log(`Peer address: ${peerAddress}`);
        console.log(`Expected Sepolia address: ${SEPOLIA_OFT_ADDRESS}`);
        
        if (peerAddress.toLowerCase() === SEPOLIA_OFT_ADDRESS.toLowerCase()) {
            console.log("✅ Peer set correctly!");
        } else {
            console.log("❌ Peer not set correctly!");
        }
        
    } catch (error) {
        console.error("Error setting peer:", error);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});