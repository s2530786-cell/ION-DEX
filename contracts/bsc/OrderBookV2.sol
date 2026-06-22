// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AdminManager} from "./AdminManager.sol";

contract OrderBookV2 is ReentrancyGuard {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexInsufficientBalance();
    error IonDexUnauthorized();
    error IonDexUnsupportedOrderSide();
    error IonDexSettlementDisabled();

    AdminManager public admin;
    address public quoteToken;

    struct Order {
        address user;
        bool isBuy;
        uint256 price;
        uint256 amount;
        uint256 filled;
        uint256 deadline;
        bool finished;
    }

    Order[] public orders;
    mapping(address => uint256) public balances;

    event PlaceOrder(address indexed user, bool isBuy, uint256 price, uint256 amount, uint256 orderId, uint256 deadline);
    event CancelOrder(address indexed user, uint256 orderId);
    event MatchOrder(uint256 orderId, address indexed taker, uint256 fillAmount);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address admin_, address quoteToken_) {
        if (admin_ == address(0) || quoteToken_ == address(0)) revert IonDexZeroAddress();
        admin = AdminManager(admin_);
        quoteToken = quoteToken_;
    }

    function deposit(uint256 amount) external {
        if (amount == 0) revert IonDexZeroAmount();
        if (!IERC20(quoteToken).transferFrom(msg.sender, address(this), amount)) revert("TF fail");
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        if (balances[msg.sender] < amount) revert IonDexInsufficientBalance();
        balances[msg.sender] -= amount;
        if (!IERC20(quoteToken).transfer(msg.sender, amount)) revert("TF fail");
        emit Withdrawn(msg.sender, amount);
    }

    function placeOrder(bool isBuy, uint256 price, uint256 amount, uint256 deadline) external nonReentrant {
        if (admin.paused()) revert("Paused");
        if (price == 0 || amount == 0) revert("Invalid order");
        if (block.timestamp > deadline) revert("Order expired");
        if (!isBuy) revert IonDexUnsupportedOrderSide();

        uint256 cost = price * amount;
        if (balances[msg.sender] < cost) revert IonDexInsufficientBalance();

        balances[msg.sender] -= cost;
        orders.push(
            Order({
                user: msg.sender,
                isBuy: isBuy,
                price: price,
                amount: amount,
                filled: 0,
                deadline: deadline,
                finished: false
            })
        );
        emit PlaceOrder(msg.sender, isBuy, price, amount, orders.length - 1, deadline);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        if (o.user != msg.sender || o.finished) revert("Invalid order");
        o.finished = true;

        uint256 remaining = o.amount - o.filled;
        if (remaining > 0 && o.isBuy) {
            balances[msg.sender] += o.price * remaining;
        }
        emit CancelOrder(msg.sender, orderId);
    }

    function matchOrder(uint256 orderId, uint256 fillAmount) external nonReentrant {
        Order storage o = orders[orderId];
        if (o.finished) revert("Order finished");
        if (block.timestamp > o.deadline) revert("Order expired");
        if (fillAmount == 0) revert IonDexZeroAmount();
        if (!o.isBuy) revert IonDexUnsupportedOrderSide();
        revert IonDexSettlementDisabled();
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].user == user) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].user == user) result[idx++] = i;
        }
        return result;
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function orderCount() external view returns (uint256) {
        return orders.length;
    }
}
