import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("stake", "Stakes amount of tokens")
  .addParam("amount", "Amount of tokens to stake")
  .setAction(async (taskArgs, hre) => {
    const staking = await hre.ethers.getContractAt("Staking", process.env.CONTRACT_ADDR!);
    await staking.stake(taskArgs.value);
    console.log(`${taskArgs.amount} tokens staked on contract!`);
  });
