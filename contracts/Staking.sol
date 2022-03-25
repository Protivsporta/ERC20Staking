//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is AccessControl{

    using SafeERC20 for IERC20;

    IERC20 public stakableToken;
    IERC20 public rewardToken;
    uint256 public rewardPercentage;
    uint256 public claimFrozenTime;
    uint256 public unstakeFrozenTime;
    bytes32 public constant ADMIN = keccak256(abi.encodePacked("ADMIN"));

    struct Staker {
        uint256 stake;
        uint256 reward;
        uint256 rewardClaimed;
        uint256 startingTimestamp;
        uint256 updatedTimestamp;
    }
     
    mapping (address => Staker) public stakers;

    constructor(
        address _stakableTokenAddress, 
        address _rewardTokenAddress,
        uint256 _rewardPercentage,
        uint256 _claimFrozenTime,
        uint256 _unstakeFrozenTime) {
        stakableToken = IERC20(_stakableTokenAddress);
        rewardToken = IERC20(_rewardTokenAddress);
        rewardPercentage = _rewardPercentage;
        claimFrozenTime = _claimFrozenTime;
        unstakeFrozenTime = _unstakeFrozenTime;
        _grantRole(ADMIN, msg.sender);
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount of tokens to stake should be positive");
        stakers[msg.sender].updatedTimestamp = block.timestamp;
        if(stakers[msg.sender].stake == 0) {
            stakers[msg.sender].startingTimestamp = block.timestamp;
        } else {
            calculateReward(msg.sender);
        }
        stakers[msg.sender].stake += _amount;
        stakableToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    function unstake() external onlyAfterUnstakeFrozenPeriod() {
        require(stakers[msg.sender].stake > 0, "You don't have tokens to unstake");
        uint256 currentStake = stakers[msg.sender].stake;
        claim();
        stakers[msg.sender].stake = 0;
        stakableToken.safeTransfer(msg.sender, currentStake);
        emit Unstaked(msg.sender, currentStake);
    }

    function claim() public onlyAfterClaimFrozenPeriod {
        calculateReward(msg.sender);
        uint256 currentReward = stakers[msg.sender].reward - stakers[msg.sender].rewardClaimed;
        require(currentReward > 0, "You don't have tokens to claim");
        stakers[msg.sender].rewardClaimed += currentReward;
        rewardToken.safeTransfer(msg.sender, currentReward);
        emit Claimed(msg.sender, currentReward);
    }

    function changeStakingSettings(uint256 _rewardPercentage, uint256 _claimFrozenTime, uint256 _unstakeFrozenTime) external onlyRole(ADMIN) {
        rewardPercentage = _rewardPercentage;
        claimFrozenTime = _claimFrozenTime;
        unstakeFrozenTime = _unstakeFrozenTime;
    }

    function calculateReward(address _staker) internal {
        stakers[_staker].reward += stakers[_staker].stake * rewardPercentage * (block.timestamp - stakers[_staker].updatedTimestamp) / 100 / claimFrozenTime;
        stakers[_staker].updatedTimestamp = block.timestamp;
    }

    modifier onlyAfterUnstakeFrozenPeriod() {
        require(block.timestamp - stakers[msg.sender].startingTimestamp > unstakeFrozenTime, "You can not unstake tokens now, please try later");
        _;
    }

    modifier onlyAfterClaimFrozenPeriod() {
        require(block.timestamp - stakers[msg.sender].startingTimestamp > claimFrozenTime, "You can not claim tokens now, please try later");
        _;
    }

    event Staked(address indexed _staker, uint256 _amount);

    event Claimed(address indexed _claimer, uint256 _amount);

    event Unstaked(address indexed _staker, uint256 _amount);
}
