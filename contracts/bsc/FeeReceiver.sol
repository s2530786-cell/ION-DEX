// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Fee {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
 * @title FeeReceiver
 * @notice Splits collected protocol fees on BSC per docs/02-tokenomics-and-fees.md (bps sum = 10000).
 * @dev Burn 35%, team 25%, staking 20%, treasury 15%, keeper 5%.
 */
contract FeeReceiver {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexTokenTransferFailed();
    error IonDexBpsInvalid();
    error IonDexOnlyIon();

    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant BPS_BURN = 3500;
    uint256 public constant BPS_TEAM = 2500;
    uint256 public constant BPS_STAKING = 2000;
    uint256 public constant BPS_TREASURY = 1500;
    uint256 public constant BPS_KEEPER = 500;

    /// @notice Product burn address on BSC (docs/02-tokenomics-and-fees.md).
    address public constant BSC_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable ionToken;
    address public owner;
    address public treasury;
    address public team;
    address public stakingRewards;
    address public keeper;

    event FeeDistributed(
        address indexed token,
        uint256 amount,
        uint256 toBurn,
        uint256 toTeam,
        uint256 toStaking,
        uint256 toTreasury,
        uint256 toKeeper
    );
    event DestinationsUpdated(address treasury, address team, address stakingRewards, address keeper);

    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    constructor(address owner_, address ionToken_, address treasury_, address team_, address stakingRewards_, address keeper_) {
        if (owner_ == address(0) || ionToken_ == address(0)) revert IonDexZeroAddress();
        if (treasury_ == address(0) || team_ == address(0) || stakingRewards_ == address(0) || keeper_ == address(0)) {
            revert IonDexZeroAddress();
        }
        if (BPS_BURN + BPS_TEAM + BPS_STAKING + BPS_TREASURY + BPS_KEEPER != FEE_DENOMINATOR) {
            revert IonDexBpsInvalid();
        }
        owner = owner_;
        ionToken = ionToken_;
        treasury = treasury_;
        team = team_;
        stakingRewards = stakingRewards_;
        keeper = keeper_;
    }

    function setDestinations(
        address treasury_,
        address team_,
        address stakingRewards_,
        address keeper_
    ) external onlyOwner {
        if (treasury_ == address(0) || team_ == address(0) || stakingRewards_ == address(0) || keeper_ == address(0)) {
            revert IonDexZeroAddress();
        }
        treasury = treasury_;
        team = team_;
        stakingRewards = stakingRewards_;
        keeper = keeper_;
        emit DestinationsUpdated(treasury_, team_, stakingRewards_, keeper_);
    }

    /**
     * @notice Pull `amount` of `token` from caller and split to configured sinks + burn address.
     */
    function distributeFees(address token, uint256 amount) external {
        if (token == address(0)) revert IonDexZeroAddress();
        if (token != ionToken) revert IonDexOnlyIon();
        if (amount == 0) revert IonDexZeroAmount();
        if (!_transferFrom(token, msg.sender, address(this), amount)) revert IonDexTokenTransferFailed();

        uint256 toBurn = (amount * BPS_BURN) / FEE_DENOMINATOR;
        uint256 toTeam = (amount * BPS_TEAM) / FEE_DENOMINATOR;
        uint256 toStaking = (amount * BPS_STAKING) / FEE_DENOMINATOR;
        uint256 toTreasury = (amount * BPS_TREASURY) / FEE_DENOMINATOR;
        uint256 toKeeper = amount - toBurn - toTeam - toStaking - toTreasury;

        if (toBurn > 0 && !_transfer(token, BSC_BURN_ADDRESS, toBurn)) revert IonDexTokenTransferFailed();
        if (toTeam > 0 && !_transfer(token, team, toTeam)) revert IonDexTokenTransferFailed();
        if (toStaking > 0 && !_transfer(token, stakingRewards, toStaking)) revert IonDexTokenTransferFailed();
        if (toTreasury > 0 && !_transfer(token, treasury, toTreasury)) revert IonDexTokenTransferFailed();
        if (toKeeper > 0 && !_transfer(token, keeper, toKeeper)) revert IonDexTokenTransferFailed();

        emit FeeDistributed(token, amount, toBurn, toTeam, toStaking, toTreasury, toKeeper);
    }

    function _transferFrom(address token, address from, address to, uint256 amount) private returns (bool) {
        return IERC20Fee(token).transferFrom(from, to, amount);
    }

    function _transfer(address token, address to, uint256 amount) private returns (bool) {
        return IERC20Fee(token).transfer(to, amount);
    }
}
