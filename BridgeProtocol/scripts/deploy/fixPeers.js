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
    const oftSepolia = MyOFT.attach(SEPOLIA_OFT_ADDRESS);
    
    try {
        console.log("Setting peer on Sepolia for BSC...");
        
        // Convert BSC address to bytes32
        const bscAddressBytes32 = ethers.utils.hexZeroPad(BSC_OFT_ADDRESS, 32);
        
        console.log(`BSC Address: ${BSC_OFT_ADDRESS}`);
        console.log(`BSC Address as bytes32: ${bscAddressBytes32}`);
        
        // Set peer
        const tx = await oftSepolia.setPeer(BSC_CHAIN_EID, bscAddressBytes32);
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`Peer set successfully! Block: ${receipt.blockNumber}`);
        
        // Verify the peer is set correctly
        const peer = await oftSepolia.peers(BSC_CHAIN_EID);
        console.log(`Peer for BSC (EID: ${BSC_CHAIN_EID}): ${peer}`);
        
        // Convert back to address to verify
        const peerAddress = ethers.utils.getAddress(peer.slice(-40));
        console.log(`Peer address: ${peerAddress}`);
        console.log(`Expected BSC address: ${BSC_OFT_ADDRESS}`);
        
        if (peerAddress.toLowerCase() === BSC_OFT_ADDRESS.toLowerCase()) {
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