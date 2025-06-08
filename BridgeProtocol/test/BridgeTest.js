const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Bridge Protocol Test", function () {
    let bridgedTokenSepolia;
    let bridgedTokenBnb;
    let bridgeSource;
    let bridgeDestination;
    let mockEndpoint;
    let owner;
    let user;
    const amount = ethers.parseEther("1"); // 1 token to transfer

    // Chain IDs
    const SEPOLIA_CHAIN_ID = 10161;
    const BNB_TESTNET_CHAIN_ID = 10297;

    before(async function () {
        [owner, user] = await ethers.getSigners();
    });

    describe("Deployment and Setup", function () {
        it("Should deploy all contracts and set up bridge", async function () {
            // Deploy mock LayerZero endpoint
            const MockLayerZeroEndpoint = await ethers.getContractFactory("MockLayerZeroEndpoint");
            mockEndpoint = await MockLayerZeroEndpoint.deploy();
            await mockEndpoint.waitForDeployment();
            console.log("Mock LayerZero Endpoint deployed at:", await mockEndpoint.getAddress());

            // Deploy BridgedToken on Sepolia
            const BridgedToken = await ethers.getContractFactory("BridgedToken");
            bridgedTokenSepolia = await BridgedToken.deploy();
            await bridgedTokenSepolia.waitForDeployment();
            console.log("BridgedToken Sepolia deployed at:", await bridgedTokenSepolia.getAddress());

            // Deploy BridgeSource on Sepolia
            const BridgeSource = await ethers.getContractFactory("BridgeSource");
            bridgeSource = await BridgeSource.deploy(
                await bridgedTokenSepolia.getAddress(),
                await mockEndpoint.getAddress(),
                owner.address
            );
            await bridgeSource.waitForDeployment();
            console.log("BridgeSource deployed at:", await bridgeSource.getAddress());

            // Deploy BridgedToken on BNB Testnet
            bridgedTokenBnb = await BridgedToken.deploy();
            await bridgedTokenBnb.waitForDeployment();
            console.log("BridgedToken BNB deployed at:", await bridgedTokenBnb.getAddress());

            // Deploy BridgeDestination on BNB Testnet
            const BridgeDestination = await ethers.getContractFactory("BridgeDestination");
            bridgeDestination = await BridgeDestination.deploy(
                await bridgedTokenBnb.getAddress(),
                await bridgeSource.getAddress(),
                owner.address
            );
            await bridgeDestination.waitForDeployment();
            console.log("BridgeDestination deployed at:", await bridgeDestination.getAddress());

            // Set up bridge roles
            await bridgedTokenSepolia.grantBridgeRole(await bridgeSource.getAddress());
            await bridgedTokenBnb.grantBridgeRole(await bridgeDestination.getAddress());

            // Set trusted remote
            const trustedRemote = ethers.solidityPacked(
                ["address"],
                [await bridgeDestination.getAddress()]
            );
            await bridgeSource.setTrustedRemote(BNB_TESTNET_CHAIN_ID, trustedRemote);
        });
    });

    describe("Bridge Operation", function () {
        it("Should complete a full bridge operation from Sepolia to BNB Testnet", async function () {
            // 1. Mint tokens to user on Sepolia using the bridge role
            await bridgedTokenSepolia.connect(owner).grantRole(
                await bridgedTokenSepolia.BRIDGE_ROLE(),
                owner.address
            );
            await bridgedTokenSepolia.mint(user.address, amount);
            const initialSepoliaBalance = await bridgedTokenSepolia.balanceOf(user.address);
            expect(initialSepoliaBalance).to.equal(amount);
            console.log("Initial Sepolia balance:", ethers.formatEther(initialSepoliaBalance));

            // 2. Approve tokens for bridge
            await bridgedTokenSepolia.connect(user).approve(
                await bridgeSource.getAddress(),
                amount
            );

            // 3. Bridge tokens
            const bridgeTx = await bridgeSource.connect(user).bridgeTokens(
                BNB_TESTNET_CHAIN_ID,
                user.address,
                amount,
                { value: ethers.parseEther("0.01") } // Send some ETH for fees
            );
            console.log("Bridge transaction hash:", bridgeTx.hash);

            // 4. Wait for transaction to be mined
            await bridgeTx.wait();

            // 5. Simulate LayerZero message reception
            const payload = ethers.AbiCoder.defaultAbiCoder().encode([
                "address",
                "uint256"
            ], [user.address, amount]);

            // Ensure BridgeDestination has BRIDGE_ROLE on BNB token
            await bridgedTokenBnb.connect(owner).grantRole(
                await bridgedTokenBnb.BRIDGE_ROLE(),
                await bridgeDestination.getAddress()
            );

            // 6. Call lzReceive on destination contract with correct srcAddress encoding
            const srcAddress = ethers.solidityPacked(["address"], [await bridgeSource.getAddress()]);
            const receiveTx = await bridgeDestination.lzReceive(
                SEPOLIA_CHAIN_ID,
                srcAddress,
                0, // nonce
                payload
            );
            console.log("Receive transaction hash:", receiveTx.hash);

            // 7. Verify balances
            const finalSepoliaBalance = await bridgedTokenSepolia.balanceOf(user.address);
            const bnbBalance = await bridgedTokenBnb.balanceOf(user.address);

            console.log("Final Sepolia balance:", ethers.formatEther(finalSepoliaBalance));
            console.log("BNB Testnet balance:", ethers.formatEther(bnbBalance));

            expect(finalSepoliaBalance).to.equal(0); // All tokens should be bridged
            expect(bnbBalance).to.equal(amount); // Should receive tokens on BNB
        });
    });
}); 