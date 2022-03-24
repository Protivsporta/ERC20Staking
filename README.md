# Staking contract for ERC20 token standart with ability to change staking logic settings
Contract address - 0x9D0E0f2c60e69cfF26Bd49B6EB8B538D4982B54C

Etherscan virified - https://ropsten.etherscan.io/address/0x9D0E0f2c60e69cfF26Bd49B6EB8B538D4982B54C#code

Staking logic: contract recieve LP tokens and afrer x minutes charge reward tokens to account.
Available functions: stake(amount), unstake(), claim(), changeStakingSettings()

Available task:

```shell
  accounts      Prints the list of accounts
  check         Check whatever you need
  claim         Claim all reward tokens
  clean         Clears the cache and deletes all artifacts
  compile       Compiles the entire project, building all artifacts
  console       Opens a hardhat console
  coverage      Generates a code coverage report for tests
  flatten       Flattens and prints contracts and their dependencies
  help          Prints this message
  initialize    Initialize staking contract
  node          Starts a JSON-RPC server on top of Hardhat Network
  run           Runs a user-defined script after compiling the project
  stake         Stakes amount of tokens
  test          Runs mocha tests
  typechain     Generate Typechain typings for compiled contracts
  unstake       Unstakes all staked tokens
  verify        Verifies contract on Etherscan
```
