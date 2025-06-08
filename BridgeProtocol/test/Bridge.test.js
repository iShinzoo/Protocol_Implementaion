const { expect } = require("chai");
const { ethers } = require("hardhat");

// Mock LayerZero Endpoint for testing
const MOCK_LZ_ENDPOINT_ABI = [
    "function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address payable refundAddress, address zroPaymentAddress, bytes calldata adapterParams) external payable",
    "function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view returns (uint nativeFee, uint zroFee)",
    "function mockReceive(uint16 srcChainId, bytes calldata srcAddress, uint64 nonce, bytes calldata payload)"
];

async function deployMockLZEndpoint() {
    const [deployer] = await ethers.getSigners();
    const MockLZEndpointFactory = await ethers.getContractFactory("MockLZEndpoint");
    return await MockLZEndpointFactory.deploy();
}

describe("Bridge Contracts (Source and Destination)", function () {
    let owner, user, bridgeAdmin, otherUser;
    let MockToken, mockToken; // Token on source chain
    let BridgedToken, bridgedToken; // Token on destination chain (the one that gets minted)
    let BridgeSource, bridgeSource;
    let BridgeDestination, bridgeDestination;
    let mockLZEndpointSrc, mockLZEndpointDst; // Separate endpoints for clarity if needed, or use one

    const SRC_CHAIN_ID = 101; // Example LayerZero chain ID for source
    const DST_CHAIN_ID = 102; // Example LayerZero chain ID for destination
    const DEFAULT_GAS_AMOUNT = 250000;

    const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ROLE"));

    beforeEach(async function () {
        [owner, user, bridgeAdmin, otherUser] = await ethers.getSigners();

        // Deploy Mock LZ Endpoint
        const MockLZEndpointFactory = await ethers.getContractFactory("MockLZEndpoint");
        mockLZEndpointSrc = await MockLZEndpointFactory.deploy();
        await mockLZEndpointSrc.waitForDeployment();
        const mockLZEndpointSrcAddress = await mockLZEndpointSrc.getAddress();
        mockLZEndpointDst = mockLZEndpointSrc; // For this test, one mock can serve both if it has mockReceive

        // Deploy Source Token (e.g., a standard ERC20)
        MockToken = await ethers.getContractFactory("MockERC20"); // Using our mock ERC20
        mockToken = await MockToken.deploy("Mock Source Token", "MST");
        await mockToken.waitForDeployment();
        const mockTokenAddress = await mockToken.getAddress();
        await mockToken.mint(user.address, ethers.parseUnits("1000", 18));

        // Deploy Bridged Token (on 'destination')
        BridgedToken = await ethers.getContractFactory("BridgedToken");
        bridgedToken = await BridgedToken.deploy(); // Admin is 'owner' of this test suite
        await bridgedToken.waitForDeployment();
        const bridgedTokenAddress = await bridgedToken.getAddress();

        // Deploy BridgeSource
        BridgeSource = await ethers.getContractFactory("BridgeSource");
        bridgeSource = await BridgeSource.deploy(mockTokenAddress, mockLZEndpointSrcAddress, bridgeAdmin.address);
        await bridgeSource.waitForDeployment();
        const bridgeSourceAddress = await bridgeSource.getAddress();

        // Deploy BridgeDestination
        BridgeDestination = await ethers.getContractFactory("BridgeDestination");
        bridgeDestination = await BridgeDestination.deploy(bridgedTokenAddress, bridgeSourceAddress, bridgeAdmin.address);
        await bridgeDestination.waitForDeployment();

        // Configure BridgeSource: set trusted remote
        const destinationPath = ethers.solidityPacked(["address"], [await bridgeDestination.getAddress()]);
        await bridgeSource.connect(bridgeAdmin).setTrustedRemote(DST_CHAIN_ID, destinationPath);
        await bridgeSource.connect(bridgeAdmin).setDestinationGasAmount(DEFAULT_GAS_AMOUNT);

        // Configure BridgedToken: grant BRIDGE_ROLE to BridgeDestination
        // 'owner' deployed bridgedToken, so 'owner' has DEFAULT_ADMIN_ROLE for it.
        await bridgedToken.connect(owner).grantBridgeRole(await bridgeDestination.getAddress());
    });

    describe("BridgeSource Setup", function () {
        it("Should set correct owner", async function () {
            expect(await bridgeSource.owner()).to.equal(bridgeAdmin.address);
        });
        it("Should set correct token and endpoint", async function () {
            expect(await bridgeSource.token()).to.equal(await mockToken.getAddress());
            expect(await bridgeSource.endpoint()).to.equal(await mockLZEndpointSrc.getAddress());
        });
        it("Should allow owner to set trusted remote", async function () {
            const newPath = ethers.solidityPacked(["address"], [otherUser.address]); // dummy path
            await bridgeSource.connect(bridgeAdmin).setTrustedRemote(103, newPath);
            expect(await bridgeSource.trustedRemoteLookup(103)).to.equal(newPath);
        });
        it("Should allow owner to set destination gas amount", async function () {
            await bridgeSource.connect(bridgeAdmin).setDestinationGasAmount(300000);
            expect(await bridgeSource.destinationGasAmount()).to.equal(300000);
        });
        it("Should revert if non-owner tries to set trusted remote or gas", async function () {
            const newPath = ethers.solidityPacked(["address"], [otherUser.address]);
            await expect(bridgeSource.connect(user).setTrustedRemote(103, newPath)).to.be.reverted;
            await expect(bridgeSource.connect(user).setDestinationGasAmount(300000)).to.be.reverted;
        });
    });

    describe("BridgeDestination Setup", function () {
        it("Should set correct owner", async function () {
            expect(await bridgeDestination.owner()).to.equal(bridgeAdmin.address);
        });
        it("Should set correct token and trusted source bridge", async function () {
            expect(await bridgeDestination.token()).to.equal(await bridgedToken.getAddress());
            expect(await bridgeDestination.trustedSourceBridge()).to.equal(await bridgeSource.getAddress());
        });
    });

    describe("Pausable Functionality (BridgeBase)", function () {
        it("Owner should be able to pause and unpause BridgeSource", async function () {
            await bridgeSource.connect(bridgeAdmin).pause();
            expect(await bridgeSource.paused()).to.be.true;
            await bridgeSource.connect(bridgeAdmin).unpause();
            expect(await bridgeSource.paused()).to.be.false;
        });

        it("Owner should be able to pause and unpause BridgeDestination", async function () {
            await bridgeDestination.connect(bridgeAdmin).pause();
            expect(await bridgeDestination.paused()).to.be.true;
            await bridgeDestination.connect(bridgeAdmin).unpause();
            expect(await bridgeDestination.paused()).to.be.false;
        });

        it("bridgeTokens should fail if BridgeSource is paused", async function () {
            await bridgeSource.connect(bridgeAdmin).pause();
            const amount = ethers.parseUnits("10", 18);
            await mockToken.connect(user).approve(await bridgeSource.getAddress(), amount);
            await expect(
                bridgeSource.connect(user).bridgeTokens(DST_CHAIN_ID, otherUser.address, amount, { value: ethers.parseEther("0.1") })
            ).to.be.reverted;
        });
    });

    describe("Estimating Fees", function () {
        it("Should estimate fees correctly (mocked response)", async function () {
            const amount = ethers.parseUnits("50", 18);
            await expect(bridgeSource.connect(user).estimateFees(DST_CHAIN_ID, otherUser.address, amount))
                .to.not.be.reverted;
        });
    });

    describe("Bridging Tokens (End-to-End Mocked)", function () {
        let bridgeAmount;
        let fee;

        beforeEach(async function() {
            bridgeAmount = ethers.parseUnits("100", 18);
            fee = ethers.parseEther("0.1"); // Example fee
            await mockToken.connect(user).approve(await bridgeSource.getAddress(), bridgeAmount);
        });

        it("Should bridge tokens successfully (mocked LZ receive)", async function () {
            const initialUserBalanceSrc = await mockToken.balanceOf(user.address);
            const initialBridgeSrcBalance = await mockToken.balanceOf(await bridgeSource.getAddress());
            const initialUserBalanceDst = await bridgedToken.balanceOf(otherUser.address);

            // 1. User calls bridgeTokens on BridgeSource
            const bridgeTx = await bridgeSource.connect(user).bridgeTokens(DST_CHAIN_ID, otherUser.address, bridgeAmount, { value: fee });
            await expect(bridgeTx)
                .to.emit(bridgeSource, "BridgeInitiated")
                .withArgs(user.address, ethers.ZeroAddress, bridgeAmount, DST_CHAIN_ID); // to is address(0) in event

            // Check balances on source chain
            expect(await mockToken.balanceOf(user.address)).to.equal(initialUserBalanceSrc - bridgeAmount);
            expect(await mockToken.balanceOf(await bridgeSource.getAddress())).to.equal(initialBridgeSrcBalance + bridgeAmount);

            // 2. Simulate LayerZero calling lzReceive on BridgeDestination
            // Construct the payload as BridgeSource does
            const payload = new ethers.AbiCoder().encode(["address", "uint256"], [otherUser.address, bridgeAmount]);
            const srcAddressBytes = ethers.solidityPacked(["address"], [await bridgeSource.getAddress()]);
            const nonce = 1; // Example nonce, BridgeBase doesn't use it from LZ but for processedMessages
            
            // Ensure BridgeDestination has BRIDGE_ROLE for bridgedToken
            expect(await bridgedToken.hasRole(BRIDGE_ROLE, await bridgeDestination.getAddress())).to.be.true;

            // Use a valid signer for lzReceive
            const [validSigner] = await ethers.getSigners();
            const receiveTx = await bridgeDestination.connect(validSigner)
                .lzReceive(SRC_CHAIN_ID, srcAddressBytes, nonce, payload);
            
            await expect(receiveTx)
                .to.emit(bridgeDestination, "BridgeReceived")
                .withArgs(otherUser.address, bridgeAmount);

            // Check balance on destination chain
            expect(await bridgedToken.balanceOf(otherUser.address)).to.equal(initialUserBalanceDst + bridgeAmount);

            // Check processedMessages
            const messageHash = ethers.keccak256(payload);
            expect(await bridgeDestination.processedMessages(messageHash)).to.be.true;
        });

        it("Should fail if trusted remote not set", async function () {
            const unsetChainId = 999;
            await expect(bridgeSource.connect(user).bridgeTokens(unsetChainId, otherUser.address, bridgeAmount, { value: fee }))
                .to.be.revertedWith("Trusted remote not set for this chain");
        });

        it("Should fail if not enough ETH sent for fees", async function () {
            await expect(bridgeSource.connect(user).bridgeTokens(DST_CHAIN_ID, otherUser.address, bridgeAmount, { value: 0 }))
                .to.be.revertedWith("Must send ETH for LayerZero fees");
        });

        it("Should fail if amount is 0", async function () {
            await expect(bridgeSource.connect(user).bridgeTokens(DST_CHAIN_ID, otherUser.address, 0, { value: fee }))
                .to.be.revertedWith("Amount must be > 0");
        });

        it("Should fail if token transferFrom fails (insufficient allowance/balance)", async function () {
            await mockToken.connect(user).approve(await bridgeSource.getAddress(), ethers.parseUnits("1", 18)); // Lower allowance
            await expect(bridgeSource.connect(user).bridgeTokens(DST_CHAIN_ID, otherUser.address, bridgeAmount, { value: fee }))
                .to.be.reverted;
        });

        describe("lzReceive on BridgeDestination specific checks", function() {
            let payload, srcAddressBytes, nonce;
            beforeEach(async () => {
                payload = new ethers.AbiCoder().encode(["address", "uint256"], [otherUser.address, bridgeAmount]);
                srcAddressBytes = ethers.solidityPacked(["address"], [await bridgeSource.getAddress()]);
                nonce = 1;
            });

            it("Should fail lzReceive if called from untrusted source bridge address", async function () {
                const wrongSrcAddressBytes = ethers.solidityPacked(["address"], [otherUser.address]);
                const [validSigner] = await ethers.getSigners();
                await expect(bridgeDestination.connect(validSigner)
                    .lzReceive(SRC_CHAIN_ID, wrongSrcAddressBytes, nonce, payload))
                    .to.be.reverted;
            });

            it("Should fail lzReceive if message already processed", async function () {
                const [validSigner] = await ethers.getSigners();
                await bridgeDestination.connect(validSigner)
                    .lzReceive(SRC_CHAIN_ID, srcAddressBytes, nonce, payload); // First call
                
                await expect(bridgeDestination.connect(validSigner)
                    .lzReceive(SRC_CHAIN_ID, srcAddressBytes, nonce, payload)) // Second call with same payload
                    .to.be.reverted;
            });

            it("Should fail lzReceive if BridgeDestination does not have BRIDGE_ROLE on token", async function () {
                // Revoke role for this test
                await bridgedToken.connect(owner).revokeBridgeRole(await bridgeDestination.getAddress());
                const [validSigner] = await ethers.getSigners();
                await expect(bridgeDestination.connect(validSigner)
                    .lzReceive(SRC_CHAIN_ID, srcAddressBytes, nonce, payload))
                    .to.be.reverted;
            });
        });
    });

    describe("Withdraw Functions", function () {
        it("Owner of BridgeSource can withdraw stuck ERC20 tokens", async function () {
            const stuckAmount = ethers.parseUnits("50", 18);
            await mockToken.connect(user).transfer(await bridgeSource.getAddress(), stuckAmount); // Manually send tokens to contract
            const initialOwnerBalance = await mockToken.balanceOf(bridgeAdmin.address);
            await bridgeSource.connect(bridgeAdmin).withdrawTokens(await mockToken.getAddress(), stuckAmount);
            const finalOwnerBalance = await mockToken.balanceOf(bridgeAdmin.address);
            expect(finalOwnerBalance - initialOwnerBalance).to.equal(stuckAmount);
        });

        it("Owner of BridgeSource can withdraw stuck ETH (native currency)", async function () {
            const stuckEthAmount = ethers.parseEther("1.0");
            await owner.sendTransaction({ to: await bridgeSource.getAddress(), value: stuckEthAmount });
            const initialOwnerEth = await ethers.provider.getBalance(bridgeAdmin.address);
            await bridgeSource.connect(bridgeAdmin).withdrawETH();
            const finalOwnerEth = await ethers.provider.getBalance(bridgeAdmin.address);
            expect(finalOwnerEth > initialOwnerEth).to.be.true;
        });

        it("Non-owner cannot withdraw tokens from BridgeSource", async function () {
            const stuckAmount = ethers.parseUnits("10", 18);
            await mockToken.connect(user).transfer(await bridgeSource.getAddress(), stuckAmount);
            await expect(bridgeSource.connect(user).withdrawTokens(await mockToken.getAddress(), stuckAmount)).to.be.reverted;
        });
    });

});
