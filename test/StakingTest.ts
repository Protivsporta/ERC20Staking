import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { Staking, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const ADMIN = "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42";

describe("Staking", function() {
    const initialSupply: number = 100000000000;
    const claimFrozenTimeInMinutes: number = 10;
    const unstakeFrozenTimeInMinutes: number = 20;
    const rewardPersentage: number = 50;

    let staking: Staking;
    let stakingToken: ERC20Mock;
    let rewardToken: ERC20Mock;
    let owner: SignerWithAddress;
    let staker: SignerWithAddress;

    beforeEach(async function() {
        [owner, staker] = await ethers.getSigners();
        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy();
        await staking.deployed();

        const StakingToken = await ethers.getContractFactory("ERC20Mock");
        stakingToken = await StakingToken.deploy("StakingToken", "STK", initialSupply);
        await stakingToken.deployed();

        const RewardToken = await ethers.getContractFactory("ERC20Mock");
        rewardToken = await RewardToken.deploy("RewardToken", "RWRD", initialSupply);
        await rewardToken.deployed();

        await staking.initialize(stakingToken.address, rewardToken.address, rewardPersentage, unstakeFrozenTimeInMinutes, claimFrozenTimeInMinutes);

        await rewardToken.transfer(staking.address, initialSupply);
    })

    it("Should be deployed", async function() {
        expect(staking.address).to.be.properAddress;
    })

    describe("Initialize", function() {

        it("Should be initialized", async function() {
            expect(await staking.initialized()).to.equal(true);
        })

        it("Should return error with message because contract can't initialize twice", async function() {
            await expect(staking.initialize(stakingToken.address, rewardToken.address, rewardPersentage, unstakeFrozenTimeInMinutes, claimFrozenTimeInMinutes))
            .to.be.revertedWith("Contract has already initialized!");
        })
    })

    describe("Stake", function() {
        
        it("Should stake 150 tokens and emit Staked event", async function() {
            await stakingToken.approve(staking.address, 600);

            await expect(() => staking.stake(150))
            .to.changeTokenBalance(stakingToken, staking, 150);

            await expect(staking.connect(owner).stake(150))
            .to.emit(staking, "Staked")
            .withArgs(owner.address, 150);
        })

        it("Should return error with message because account try to stake 0 or less tokens", async function() {
            await stakingToken.approve(staking.address, 600);

            await expect(staking.stake(0))
            .to.be.revertedWith("Amount of tokens to stake should be positive");
        })

    })

    describe("Unstake", function() {

        it("Should unstake 150 tokens and emit Unstaked event", async function() {
            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [50000000]);
            await network.provider.send("evm_mine");

            await expect(() => staking.connect(owner).unstake())
            .to.changeTokenBalance(stakingToken, owner, 150);

            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [50000000]);
            await network.provider.send("evm_mine");

            await expect(staking.connect(owner).unstake())
            .to.emit(staking, "Unstaked")
            .withArgs(owner.address, 150); 

        })

        it("Should return error with message because staker try to unstake tokens too early", async function() {
            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await expect(staking.connect(owner).unstake())
            .to.be.revertedWith("You can not unstake tokens now, please try later");
        })

        it("Should return error with message because account don't have tokens to unstake", async function() {
            await stakingToken.approve(staking.address, 600);

            await expect(staking.connect(owner).unstake())
            .to.be.revertedWith("You don't have tokens to unstake");
        })
    })

    describe("Claim", function() {

        it("Should claim all reward tokens and emit Claimed event", async function() {
            const amountTokensToStake: number = 150;
            const amountTokensToReward: number = amountTokensToStake * rewardPersentage / 100;

            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [50000000]);
            await network.provider.send("evm_mine");

            await expect(() => staking.connect(owner).claim())
            .to.changeTokenBalance(rewardToken, owner, amountTokensToReward);

            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [50000000]);
            await network.provider.send("evm_mine");

            await expect(staking.claim())
            .to.emit(staking, "Claimed");
        })

        it("Should return error with message because staker try to claim too early", async function() {
            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await expect(staking.connect(owner).claim())
            .to.be.revertedWith("You can not claim tokens now, please try later");
        })

        it("Should return error message because staker don't have rewards to claim", async function() {
            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [50000000]);
            await network.provider.send("evm_mine");

            await staking.connect(owner).claim();

            await expect(staking.connect(owner).claim())
            .to.be.revertedWith("You don't have tokens to claim");
        })


    })

    describe("Change settings", function() {
        it("Should change admin settings for staking logic", async function() {
            await staking.changeStakingSettings(40, 5, 8);

            expect(await staking.rewardPercentage()).to.equal(40);
            expect(await staking.claimFrozenTimeInMinutes()).to.equal(5);
            expect(await staking.unstakeFrozenTimeInMinutes()).to.equal(8);
        })

        it("Should return error because staker isn't ADMIN", async function() {
            await expect(staking.connect(staker).changeStakingSettings(40, 5, 8))
            .to.be.reverted;
        })
    })

    //ERC-20 contract Unit tests
    /*
    it("Should be deployed", async function() {
        const ownerAddress = owner.address;
        expect(ownerAddress).to.be.properAddress;
    })

    it("Should return token name", async () => {
        expect(await erc20.name()).to.equal("CringeToken");

    })

    it("Should return token symbol", async function() {
        expect(await erc20.symbol()).to.equal("CRNG")
    })

    it("Should return token decimals", async function() {
        expect(await erc20.decimals()).to.equal(8)
    })

    it("Should return current balance of tokens by address and test that all initial tokens collected on owner address", async function() {
        expect(await erc20.balanceOf(owner.address)).to.equal(1000000000)
    })

    it("Should check that total supply of tokens equal initial amount", async function() {
        expect(await erc20.totalSupply()).to.equal(1000000000)
    })

    it("Should transfer 200 tokens to Sid and emit event Transfer", async function() {
        await expect(() => erc20.transfer(sid.address, 200))
        .to.changeTokenBalance(erc20, sid, 200)

        await expect(erc20.transfer(sid.address, 200))
        .to.emit(erc20, "Transfer")
        .withArgs(owner.address, sid.address, 200)

    })

    it("Should transfer 150 tokens from owner to Nancy and emit event Transfer", async function() {
        await erc20.approve(owner.address, 150)

        await expect(() => erc20.transferFrom(owner.address, nancy.address, 150))
        .to.changeTokenBalances(erc20, [owner, nancy], [-150, 150])

        await expect(erc20.transferFrom(owner.address, sid.address, 150))
        .to.emit(erc20, "Transfer")
        .withArgs(owner.address, sid.address, 150)

    })

    it("Should approve 250 tokens for Nancy from owner", async function() {
        await expect(erc20.approve(nancy.address, 250))
        .to.emit(erc20, "Approval")
        .withArgs(owner.address, nancy.address, 250)

        expect(await erc20.allowance(owner.address, nancy.address)).to.equal(250)
    })

    it("Should mint 300 tokens to Sid account and emit Mint event", async function() {
        await expect(() => erc20.mint(sid.address, 300))
        .to.changeTokenBalance(erc20, sid, 300)

        await expect(erc20.mint(sid.address, 300))
        .to.emit(erc20, "Mint")
        .withArgs(sid.address, 300)
    })

    it("Should burn 300 tokens from Nancy account and emit Burn event", async function() {
        await erc20.mint(nancy.address, 650)

        await expect(() => erc20.burn(nancy.address, 300))
        .to.changeTokenBalance(erc20, nancy, -300)

        await expect(erc20.burn(nancy.address, 300))
        .to.emit(erc20, "Burn")
        .withArgs(nancy.address, 300)        
    })

    it("Should return error message because balance of owner smaller then value of transfer", async function() {
        await expect(erc20.transfer(sid.address, 10000000000)).to.be.revertedWith("Amount of transaction is bigger then balance")
    })

    it("Should return error message because allowance of Sid is 0", async function() {
        await expect(erc20.transferFrom(sid.address, nancy.address, 200)).to.be.revertedWith("Amount of transaction is bigger then balance of allowance")
    })

    it("Should return error message because Sid don't have ADMIN role and can't mint tokens", async function() {
        await expect(erc20.connect(sid).mint(sid.address, 500)).to.be.revertedWith("not authorized")
    })

    it("Should return error message because Sid don't have ADMIN role and can't burn tokens", async function() {
        await expect(erc20.connect(sid).burn(sid.address, 500)).to.be.revertedWith("not authorized")
    })

    //Access control contract Unit tests

    it("Should return error message because Sid don't have ADMIN role and can't grant roles to another accounts", async function() {
        await expect(erc20.connect(sid).grantRole(ADMIN, sid.address)).to.be.revertedWith("not authorized")
    })

    it("Should return error message because Sid don't have ADMIN role and can't revoke roles from another accounts", async function() {
        await expect(erc20.connect(sid).revokeRole(ADMIN, sid.address)).to.be.revertedWith("not authorized")
    })

    it("Should grant ADMIN role to Sid account and emit GrantRole event", async function() {
        await expect(erc20.grantRole(ADMIN, sid.address))
        .to.emit(erc20, "GrantRole")
        .withArgs(ADMIN, sid.address)

        await expect(() => erc20.connect(sid).mint(sid.address, 300))
        .to.changeTokenBalance(erc20, sid, 300)
    })

    it("Should revoke ADMIN role from owner account and emit RevokeRole event", async function() {
        await expect(erc20.revokeRole(ADMIN, owner.address))
        .to.emit(erc20, "RevokeRole")
        .withArgs(ADMIN, owner.address)

        await expect(erc20.mint(owner.address, 300)).to.be.revertedWith("not authorized")
        
    }) 
    */

})