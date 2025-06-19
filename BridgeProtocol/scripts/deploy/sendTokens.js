import hardhat from "hardhat";
const { ethers } = hardhat;
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Contract addresses
    const SEPOLIA_OFT_ADDRESS = "0x4f08A4682C1871300f42D8686344dbD00CB99B51";
    const BSC_OFT_ADDRESS = "0x70E594c78B041E2d430236D733b33170b0F4A749";
    const BSC_CHAIN_EID = 40102;

    // Get contract instance
    const MyOFT = await ethers.getContractFactory("MyOFT");
    const oftSepolia = MyOFT.attach(SEPOLIA_OFT_ADDRESS);

    // Check balances
    const [currentBalance, ethBalance] = await Promise.all([
        oftSepolia.balanceOf(deployer.address),
        deployer.getBalance()
    ]);
    
    console.log(`Token balance: ${ethers.utils.formatEther(currentBalance)}`);
    console.log(`ETH balance: ${ethers.utils.formatEther(ethBalance)}`);

    const amountToSend = ethers.utils.parseEther("10");
    if (currentBalance.lt(amountToSend)) {
        throw new Error("Insufficient token balance");
    }

    // Build options
  const options = "0x00030100110100000000000000000000000000013880"; // Example options, adjust as needed

    // Prepare send parameters
    const sendParam = {
        dstEid: BSC_CHAIN_EID,
        to: ethers.utils.hexZeroPad(deployer.address, 32),
        amountLD: amountToSend,
        minAmountLD: amountToSend.mul(95).div(100),
        extraOptions: options,
        composeMsg: "0x",
        oftCmd: "0x"
    };

    // Get fee quote
    const [nativeFee, lzTokenFee] = await oftSepolia.quoteSend(sendParam, false);
    console.log(`Estimated fee: ${ethers.utils.formatEther(nativeFee)} ETH`);

    // // Check approvals
    // const allowance = await oftSepolia.allowance(deployer.address, SEPOLIA_OFT_ADDRESS);
    // if (allowance.lt(amountToSend)) {
    //     console.log("Approving tokens...");
    //     const approveTx = await oftSepolia.approve(SEPOLIA_OFT_ADDRESS, amountToSend);
    //     await approveTx.wait();
    // }

    // Execute transfer
    try {
        console.log("Sending tokens...");
        const tx = await oftSepolia.send(
            sendParam,
            { nativeFee, lzTokenFee },
            deployer.address,
            {
                value: nativeFee,
                gasLimit: 800000
            }
        );
        
        const receipt = await tx.wait();
        console.log(`Success! TX hash: ${tx.hash}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("Full error details:", error);
        if (error?.data) {
            try {
                const decoded = oftSepolia.interface.parseError(error.data);
                console.error("Decoded error:", decoded.name);
            } catch (e) {
                console.error("Could not decode error");
            }
        }
        throw error;
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});