// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";

contract LiquidityPool is ERC20, ReentrancyGuard {
    uint256 public constant MINIMUM_LIQUIDITY = 1_000;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable tokenA;
    address public immutable tokenB;
    address public dexContract;
    AdminManager public admin;

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 lpMinted);
    event RemoveLiquidity(address indexed user, uint256 lpBurned, uint256 amountA, uint256 amountB);

    constructor(
        string memory name,
        string memory symbol,
        address tokenA_,
        address tokenB_,
        address admin_,
        address dex_
    ) ERC20(name, symbol) {
        require(tokenA_ != address(0) && tokenB_ != address(0), "Token zero");
        require(admin_ != address(0) && dex_ != address(0), "Config zero");
        require(tokenA_ != tokenB_, "Same token");

        tokenA = tokenA_;
        tokenB = tokenB_;
        admin = AdminManager(admin_);
        dexContract = dex_;
    }

    modifier onlyWhenRunning() {
        require(!admin.paused(), "Paused");
        _;
    }

    function addLiquidity(uint256 amountA, uint256 amountB)
        external
        nonReentrant
        onlyWhenRunning
        returns (uint256 lpAmount)
    {
        require(amountA > 0 && amountB > 0, "Amount zero");

        uint256 reserveA = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveB = IERC20(tokenB).balanceOf(address(this));

        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "TF fail");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "TF fail");

        if (totalSupply() == 0) {
            uint256 rootK = _sqrt(amountA * amountB);
            require(rootK > MINIMUM_LIQUIDITY, "Min LP not met");
            _mint(DEAD_ADDRESS, MINIMUM_LIQUIDITY);
            lpAmount = rootK - MINIMUM_LIQUIDITY;
        } else {
            require(amountA * reserveB == amountB * reserveA, "Invalid ratio");
            uint256 shareA = (amountA * totalSupply()) / reserveA;
            uint256 shareB = (amountB * totalSupply()) / reserveB;
            lpAmount = shareA < shareB ? shareA : shareB;
        }

        require(lpAmount > 0, "LP zero");
        _mint(msg.sender, lpAmount);
        emit AddLiquidity(msg.sender, amountA, amountB, lpAmount);
    }

    function removeLiquidity(uint256 lpAmount) external nonReentrant onlyWhenRunning {
        require(lpAmount > 0, "LP zero");
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP");

        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));
        uint256 totalLP = totalSupply();

        uint256 amountA = (lpAmount * balanceA) / totalLP;
        uint256 amountB = (lpAmount * balanceB) / totalLP;

        _burn(msg.sender, lpAmount);
        require(IERC20(tokenA).transfer(msg.sender, amountA), "TF fail");
        require(IERC20(tokenB).transfer(msg.sender, amountB), "TF fail");

        emit RemoveLiquidity(msg.sender, lpAmount, amountA, amountB);
    }

    function setDexContract(address dex_) external {
        require(msg.sender == owner(), "Not authorized");
        require(dex_ != address(0), "Dex zero");
        dexContract = dex_;
    }

    function payout(address token, address to, uint256 amount) external nonReentrant {
        require(msg.sender == dexContract, "Not dex");
        require(token == tokenA || token == tokenB, "Invalid token");
        require(to != address(0), "To zero");
        require(amount > 0, "Amount zero");
        require(IERC20(token).transfer(to, amount), "TF fail");
    }

    function owner() public view returns (address) {
        return admin.owner();
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
