// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIonFeeReceiver {
    function distributeFees(address token, uint256 amount) external;
    function ionToken() external view returns (address);
}

interface IERC20IonProtocolFee {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

/**
 * @notice Pull ION protocol fees from `payer`, route through `collector`, and split via FeeReceiver.
 */
library IonProtocolFeeLib {
    error IonDexFeeReceiverNotSet();
    error IonDexIonFeeTransferFailed();

    function collectIonFee(address feeReceiver, address collector, address payer, uint256 ionFeeAmount) internal {
        if (ionFeeAmount == 0) {
            return;
        }
        if (feeReceiver == address(0)) {
            revert IonDexFeeReceiverNotSet();
        }
        address ion = IIonFeeReceiver(feeReceiver).ionToken();
        if (!IERC20IonProtocolFee(ion).transferFrom(payer, collector, ionFeeAmount)) {
            revert IonDexIonFeeTransferFailed();
        }
        if (!IERC20IonProtocolFee(ion).approve(feeReceiver, ionFeeAmount)) {
            revert IonDexIonFeeTransferFailed();
        }
        IIonFeeReceiver(feeReceiver).distributeFees(ion, ionFeeAmount);
    }
}
