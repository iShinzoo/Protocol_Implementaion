import hardhat from 'hardhat';
const { ethers } = hardhat;

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Contract address from your deployment
    const sepoliaOFTAddress = "0x4f08A4682C1871300f42D8686344dbD00CB99B51";
    
    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const tokenSepolia = MyOFT.attach(sepoliaOFTAddress);
    
    // Mint tokens to deployer (assuming your contract has a mint function)
    const amountToMint = ethers.utils.parseEther("1000"); // 1000 tokens
    
    console.log("Minting tokens on Sepolia...");
    console.log("Amount to mint:", ethers.utils.formatEther(amountToMint));
    
    // Check if contract has mint function, otherwise use constructor minting
    try {
        const tx = await tokenSepolia.mint(deployer.address, amountToMint);
        await tx.wait();
        console.log("Tokens minted successfully!");
        console.log("Transaction hash:", tx.hash);
    } catch (error) {
        console.log("Mint function not available or tokens already minted in constructor");
    }
    
    // Check balance
    const balance = await tokenSepolia.balanceOf(deployer.address);
    console.log("Current balance:", ethers.utils.formatEther(balance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });