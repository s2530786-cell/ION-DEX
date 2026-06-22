// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice 管理员风控合约 — 全局暂停 + 所有者控制
contract AdminManager is Ownable, Pausable {
    constructor(address _owner) Ownable(_owner) {}

    /// @notice 全局暂停（紧急风控）
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice 恢复运行
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice 外部合约可以通过此方法检查暂停状态
    function isPaused() external view returns (bool) {
        return paused();
    }
}
