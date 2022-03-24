import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("claim", "Claim all reward tokens")
  .setAction(async (hre) => {
    const staking = await hre.ethers.getContractAt("Staking", process.env.CONTRACT_ADDR!);
    await staking.claim();
    console.log(`All reward tokens claimed!`);
  });
