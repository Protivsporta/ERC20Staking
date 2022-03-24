import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("initialize", "Initialize staking contract")
  .addParam("stakabletokenaddress", "Address of token contract to stake")
  .addParam("rewardtokenaddress", "Address of token contract to get reward")
  .addParam("rewardpercentage", "Integer from 0 to infinite, which means percentage of reward tokens from amount of staked tokens")
  .addParam("claimfrozentimeinminutes", "Number of minutes that staker can't claim his reward")
  .addParam("unstakefrozentimeinminutes", "Number of minutes that staker can't unstake his staked tokens")
  .setAction(async (taskArgs, hre) => {
    const staking = await hre.ethers.getContractAt("Staking", process.env.CONTRACT_ADDR!);
    await staking.initialize(taskArgs.stakabletokenaddress, taskArgs.rewardtokenaddress, taskArgs.rewardpercentage, taskArgs.claimfrozentimeinminutes, taskArgs.unstakefrozentimeinminutes);
    console.log(`Staking contract initialized! Stakable token address: ${taskArgs.stakabletokenaddress}, Reward token address: ${taskArgs.rewardtokenaddress}`);
  });
