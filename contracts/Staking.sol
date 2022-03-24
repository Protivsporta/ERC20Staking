//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is AccessControl{

    using SafeERC20 for IERC20;

    IERC20 public stakableToken;
    IERC20 public rewardToken;
    bool public initialized;
    uint256 public rewardPercentage;
    uint256 public claimFrozenTimeInMinutes;
    uint256 public unstakeFrozenTimeInMinutes;
    bytes32 public constant ADMIN = keccak256(abi.encodePacked("ADMIN"));

    struct Staker {
        uint256 stake;
        uint256 reward;
        uint256 rewardClaimed;
        uint256 stakingTimestamp;
    }
     
    mapping (address => Staker) public stakers;

    function initialize(
        address _stakableTokenAddress, 
        address _rewardTokenAddress,
        uint256 _rewardPercentage,
        uint256 _claimFrozenTimeInMinutes,
        uint256 _unstakeFrozenTimeInMinutes) external onlyInitialized{
        stakableToken = IERC20(_stakableTokenAddress);
        rewardToken = IERC20(_rewardTokenAddress);
        rewardPercentage = _rewardPercentage;
        claimFrozenTimeInMinutes = _claimFrozenTimeInMinutes;
        unstakeFrozenTimeInMinutes = _unstakeFrozenTimeInMinutes;
        _grantRole(ADMIN, msg.sender);
        initialized = true;
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount of tokens to stake should be positive");
        stakers[msg.sender].stake += _amount;
        stakers[msg.sender].stakingTimestamp = block.timestamp;
        stakableToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    function unstake() external onlyAfterUnstakeFrozenPeriod() {
        require(stakers[msg.sender].stake > 0, "You don't have tokens to unstake");
        uint256 currentStake = stakers[msg.sender].stake;
        stakers[msg.sender].stake = 0;
        stakableToken.safeTransfer(msg.sender, currentStake);
        emit Unstaked(msg.sender, currentStake);
    }

    function claim() external onlyAfterClaimFrozenPeriod {
        uint256 currentReward = calculateReward(msg.sender) - stakers[msg.sender].rewardClaimed;
        require(currentReward > 0, "You don't have tokens to claim");
        stakers[msg.sender].reward = 0;
        stakers[msg.sender].rewardClaimed += currentReward;
        rewardToken.safeTransfer(msg.sender, currentReward);
        emit Claimed(msg.sender, currentReward);
    }

    function changeStakingSettings(uint256 _rewardPercentage, uint256 _claimFrozenTimeInMinutes, uint256 _unstakeFrozenTimeInMinutes) external onlyRole(ADMIN) {
        rewardPercentage = _rewardPercentage;
        claimFrozenTimeInMinutes = _claimFrozenTimeInMinutes;
        unstakeFrozenTimeInMinutes = _unstakeFrozenTimeInMinutes;
    }

    function calculateReward(address _staker) internal returns(uint256) {
        stakers[_staker].reward = stakers[_staker].stake * rewardPercentage / 100;
        return stakers[_staker].reward;
    }

    function calculateTimestampDifferenceInMinutes (uint256 _startingTimestamp) internal view returns(uint256) {
        return (block.timestamp - _startingTimestamp) / 60;
    }


    modifier onlyInitialized() {
        require(!initialized, "Contract has already initialized!");
        _;
    }

    modifier onlyAfterUnstakeFrozenPeriod() {
        require(calculateTimestampDifferenceInMinutes(stakers[msg.sender].stakingTimestamp) > unstakeFrozenTimeInMinutes, "You can not unstake tokens now, please try later");
        _;
    }

    modifier onlyAfterClaimFrozenPeriod() {
        require(calculateTimestampDifferenceInMinutes(stakers[msg.sender].stakingTimestamp) > claimFrozenTimeInMinutes, "You can not claim tokens now, please try later");
        _;
    }

    event Staked(address indexed _staker, uint256 _amount);

    event Claimed(address indexed _claimer, uint256 _amount);

    event Unstaked(address indexed _staker, uint256 _amount);
}
