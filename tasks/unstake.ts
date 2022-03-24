import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("unstake", "Unstakes all staked tokens")
  .setAction(async (hre) => {
    const staking = await hre.ethers.getContractAt("Staking", process.env.CONTRACT_ADDR!);
    await staking.unstake();
    console.log(`All stakable tokens unstaked!`);
  });
