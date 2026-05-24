// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";

/// @notice LP 流动性池合约 — ERC20 LP 代币，支持添加/移除流动性
contract LiquidityPool is ERC20, ReentrancyGuard {
    address public immutable tokenA;
    address public immutable tokenB;
    address public dexContract;
    AdminManager public admin;

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 lpMinted);
    event RemoveLiquidity(address indexed user, uint256 lpBurned, uint256 amountA, uint256 amountB);

    constructor(
        string memory name,
        string memory symbol,
        address _tokenA,
        address _tokenB,
        address _admin,
        address _dex
    ) ERC20(name, symbol) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        admin = AdminManager(_admin);
        dexContract = _dex;
    }

    modifier onlyWhenRunning() {
        require(!admin.paused(), "Paused");
        _;
    }

    /// @notice 添加流动性
    function addLiquidity(
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant onlyWhenRunning returns (uint256 lpAmount) {
        require(amountA > 0 && amountB > 0, "Amount zero");

        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "TF fail");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "TF fail");

        if (totalSupply() == 0) {
            lpAmount = _sqrt(amountA * amountB);
            require(lpAmount >= 1e3, "Min LP not met");
        } else {
            uint256 shareA = (amountA * totalSupply()) / IERC20(tokenA).balanceOf(address(this));
            uint256 shareB = (amountB * totalSupply()) / IERC20(tokenB).balanceOf(address(this));
            lpAmount = shareA < shareB ? shareA : shareB;
        }

        _mint(msg.sender, lpAmount);
        emit AddLiquidity(msg.sender, amountA, amountB, lpAmount);
    }

    /// @notice 移除流动性
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

    /// @notice 设置 DEX 合约地址
    function setDexContract(address _dex) external {
        require(msg.sender == address(admin) || msg.sender == owner(), "Not authorized");
        dexContract = _dex;
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
