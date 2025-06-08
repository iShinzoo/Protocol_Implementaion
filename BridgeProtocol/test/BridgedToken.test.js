const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BridgedToken", function () {
    let BridgedToken, token, owner, addr1, addr2;
    const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ROLE"));
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

    beforeEach(async function () {
        BridgedToken = await ethers.getContractFactory("BridgedToken");
        [owner, addr1, addr2] = await ethers.getSigners();
        token = await BridgedToken.deploy();
        // Wait for deployment to be mined
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner (DEFAULT_ADMIN_ROLE)", async function () {
            expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
        });

        it("Should have correct name and symbol", async function () {
            expect(await token.name()).to.equal("Bridged Token");
            expect(await token.symbol()).to.equal("BRG");
        });
    });

    describe("Access Control for BRIDGE_ROLE", function () {
        it("DEFAULT_ADMIN_ROLE should be able to grant BRIDGE_ROLE", async function () {
            await token.connect(owner).grantBridgeRole(addr1.address);
            expect(await token.hasRole(BRIDGE_ROLE, addr1.address)).to.equal(true);
        });

        it("Non-admin should not be able to grant BRIDGE_ROLE", async function () {
            await expect(token.connect(addr1).grantBridgeRole(addr2.address))
                .to.be.reverted;
        });

        it("DEFAULT_ADMIN_ROLE should be able to revoke BRIDGE_ROLE", async function () {
            await token.connect(owner).grantBridgeRole(addr1.address);
            expect(await token.hasRole(BRIDGE_ROLE, addr1.address)).to.equal(true);
            await token.connect(owner).revokeBridgeRole(addr1.address);
            expect(await token.hasRole(BRIDGE_ROLE, addr1.address)).to.equal(false);
        });

        it("Non-admin should not be able to revoke BRIDGE_ROLE", async function () {
            await token.connect(owner).grantBridgeRole(addr1.address);
            await expect(token.connect(addr2).revokeBridgeRole(addr1.address))
                .to.be.reverted;
        });
    });

    describe("Minting", function () {
        beforeEach(async function() {
            await token.connect(owner).grantBridgeRole(addr1.address); // addr1 is the bridge
        });

        it("Should allow account with BRIDGE_ROLE to mint tokens", async function () {
            const mintAmount = ethers.parseUnits("100", 18);
            await token.connect(addr1).mint(addr2.address, mintAmount);
            expect(await token.balanceOf(addr2.address)).to.equal(mintAmount);
        });

        it("Should not allow account without BRIDGE_ROLE to mint tokens", async function () {
            const mintAmount = ethers.parseUnits("100", 18);
            await expect(token.connect(addr2).mint(addr2.address, mintAmount))
                .to.be.reverted;
        });

        it("Should not allow owner (if not bridge) to mint tokens without BRIDGE_ROLE", async function () {
            const mintAmount = ethers.parseUnits("100", 18);
            await expect(token.connect(owner).mint(addr2.address, mintAmount))
                .to.be.reverted;
        });
    });

    describe("Burning", function () {
        beforeEach(async function() {
            await token.connect(owner).grantBridgeRole(addr1.address); // addr1 is the bridge
            const mintAmount = ethers.parseUnits("100", 18);
            await token.connect(addr1).mint(addr2.address, mintAmount);
        });

        it("Should allow account with BRIDGE_ROLE to burn tokens", async function () {
            const initialBalance = await token.balanceOf(addr2.address);
            const burnAmount = ethers.parseUnits("50", 18);
            await token.connect(addr1).burn(addr2.address, burnAmount);
            expect(await token.balanceOf(addr2.address)).to.equal(initialBalance - burnAmount);
        });

        it("Should not allow account without BRIDGE_ROLE to burn tokens", async function () {
            const burnAmount = ethers.parseUnits("50", 18);
            await expect(token.connect(addr2).burn(addr2.address, burnAmount))
                .to.be.reverted;
        });

        it("Should fail if burning more than balance", async function () {
            const burnAmount = ethers.parseUnits("200", 18); // More than minted
            await expect(token.connect(addr1).burn(addr2.address, burnAmount)).to.be.reverted;
        });
    });
});
