import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const Staking = await ethers.getContractFactory("Staking", signer);
  const staking = await Staking.deploy("0x098DaDA18eb6790e2cEe0575BB89485Be066c372", "0x17E117Ed9929Ed8e37B369c87dE1613377Ca07c6", 20, 600, 600);

  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
