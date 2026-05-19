// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Governance-managed validator set for large cross-chain mint requests.
interface IBridgeValidator {
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    function validators(uint256 index) external view returns (address);
    function isValidator(address validator) external view returns (bool);
    function doubleSigThreshold() external view returns (uint256);

    function addValidator(address validator) external;
    function removeValidator(address validator) external;
    function setDoubleSigThreshold(uint256 newThreshold) external;
}
