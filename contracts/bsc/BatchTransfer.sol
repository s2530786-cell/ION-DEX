// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice 批量转账 + 一键归集合约
contract BatchTransfer is ReentrancyGuard {
    /// @notice 批量原生币转账
    function batchNative(
        address[] calldata tos,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        require(tos.length == amounts.length, "Length mismatch");
        require(tos.length > 0 && tos.length <= 100, "Batch size");

        for (uint256 i = 0; i < tos.length; i++) {
            (bool ok, ) = payable(tos[i]).call{value: amounts[i]}("");
            require(ok, "Transfer failed");
        }
    }

    /// @notice 批量 ERC20 转账
    function batchErc20(
        address token,
        address[] calldata tos,
        uint256[] calldata amounts
    ) external nonReentrant {
        require(tos.length == amounts.length, "Length mismatch");
        require(tos.length > 0 && tos.length <= 100, "Batch size");

        IERC20 t = IERC20(token);
        for (uint256 i = 0; i < tos.length; i++) {
            require(t.transferFrom(msg.sender, tos[i], amounts[i]), "Transfer failed");
        }
    }

    /// @notice 一键归集到主地址
    function batchCollect(
        address token,
        address mainAddr,
        address[] calldata fromAddrs
    ) external nonReentrant {
        IERC20 t = IERC20(token);
        for (uint256 i = 0; i < fromAddrs.length; i++) {
            uint256 bal = t.balanceOf(fromAddrs[i]);
            if (bal > 0) {
                require(t.transferFrom(fromAddrs[i], mainAddr, bal), "Collect failed");
            }
        }
    }
}
