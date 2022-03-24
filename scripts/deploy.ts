import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const Staking = await ethers.getContractFactory("Staking", signer);
  const staking = await Staking.deploy();

  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
