import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { Staking, ERC20Mock } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

const ADMIN = "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42";

describe("Staking", function() {
    const initialSupply: number = 100000000000;
    const claimFrozenTime: number = 600;
    const unstakeFrozenTime: number = 600;
    const rewardPersentage: number = 10;

    let staking: Staking;
    let stakingToken: ERC20Mock;
    let rewardToken: ERC20Mock;
    let owner: SignerWithAddress;
    let staker: SignerWithAddress;

    beforeEach(async function() {
        [owner, staker] = await ethers.getSigners();

        const StakingToken = await ethers.getContractFactory("ERC20Mock");
        stakingToken = await StakingToken.deploy("StakingToken", "STK", initialSupply);
        await stakingToken.deployed();

        const RewardToken = await ethers.getContractFactory("ERC20Mock");
        rewardToken = await RewardToken.deploy("RewardToken", "RWRD", initialSupply);
        await rewardToken.deployed();

        const Staking = await ethers.getContractFactory("Staking");
        staking = await Staking.deploy(
            stakingToken.address, 
            rewardToken.address, 
            rewardPersentage, 
            claimFrozenTime, 
            unstakeFrozenTime);
        await staking.deployed();

        await rewardToken.transfer(staking.address, initialSupply);
    })

    it("Should be deployed", async function() {
        expect(staking.address).to.be.properAddress;
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

            await network.provider.send("evm_increaseTime", [650]);
            await network.provider.send("evm_mine");

            await expect(() => staking.connect(owner).unstake())
            .to.changeTokenBalance(stakingToken, owner, 150);

            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [650]);
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

        it("Should claim all reward tokens and emit Claimed event", async function() {;
            await stakingToken.approve(staking.address, 600);
            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [600]);
            await network.provider.send("evm_mine");

            await expect(() => staking.connect(owner).claim())
            .to.changeTokenBalance(rewardToken, owner, 15);

            await staking.connect(owner).stake(150);

            await network.provider.send("evm_increaseTime", [600]);
            await network.provider.send("evm_mine");

            await expect(staking.claim())
            .to.emit(staking, "Claimed")
            .withArgs(owner.address, 30);
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

            await network.provider.send("evm_increaseTime", [700]);
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
            expect(await staking.claimFrozenTime()).to.equal(5);
            expect(await staking.unstakeFrozenTime()).to.equal(8);
        })

        it("Should return error because staker isn't ADMIN", async function() {
            await expect(staking.connect(staker).changeStakingSettings(40, 5, 8))
            .to.be.reverted;
        })
    })
})