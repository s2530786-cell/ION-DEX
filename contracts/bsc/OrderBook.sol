// SPDX-License-Identifier: MIT
<<<<<<< HEAD
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";

/// @notice 限价订单簿合约
contract OrderBook is ReentrancyGuard {
    AdminManager public admin;

    struct Order {
        address user;
        bool isBuy;
        uint256 price;
        uint256 amount;
        uint256 filled;
        bool finished;
    }

    Order[] public orders;

    event PlaceOrder(address indexed user, bool isBuy, uint256 price, uint256 amount, uint256 orderId);
    event CancelOrder(address indexed user, uint256 orderId);
    event MatchOrder(uint256 orderId, address indexed taker, uint256 fillAmount);

    constructor(address _admin) {
        admin = AdminManager(_admin);
    }

    /// @notice 挂单
    function placeOrder(bool isBuy, uint256 price, uint256 amount) external nonReentrant {
        require(!admin.paused(), "Paused");
        require(price > 0 && amount > 0, "Invalid order");

        orders.push(Order({
            user: msg.sender,
            isBuy: isBuy,
            price: price,
            amount: amount,
            filled: 0,
            finished: false
        }));

        emit PlaceOrder(msg.sender, isBuy, price, amount, orders.length - 1);
    }

    /// @notice 撤单
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(o.user == msg.sender && !o.finished, "Invalid order");

        o.finished = true;
        emit CancelOrder(msg.sender, orderId);
    }

    /// @notice 吃单（链下撮合完成后，吃单方调用确认）
    function matchOrder(uint256 orderId, uint256 fillAmount) external nonReentrant {
        Order storage o = orders[orderId];
        require(!o.finished, "Order finished");
        require(o.amount - o.filled >= fillAmount, "Exceeds remaining");

        o.filled += fillAmount;
        if (o.filled >= o.amount) {
            o.finished = true;
        }

        emit MatchOrder(orderId, msg.sender, fillAmount);
    }

    /// @notice 查询用户所有订单 ID
    function getUserOrders(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].user == user) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].user == user) {
                result[idx++] = i;
            }
        }
        return result;
    }

    /// @notice 获取订单详情
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /// @notice 获取订单总数
    function orderCount() external view returns (uint256) {
        return orders.length;
    }
=======
pragma solidity 0.8.24;

import {OrderBookV2} from "./OrderBookV2.sol";

/// @notice Legacy name preserved as a funded V2 order book to avoid exposing the unfunded transparent book.
contract OrderBook is OrderBookV2 {
    constructor(address admin_, address quoteToken_) OrderBookV2(admin_, quoteToken_) {}
>>>>>>> codex/audit-follow-up-final
}
