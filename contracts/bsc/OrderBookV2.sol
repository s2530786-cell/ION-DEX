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
    error IonDexOrderNotFound();
    error IonDexOrderExpired();
    error IonDexOrderFilled();
    error IonDexNotOrderOwner();

    AdminManager public admin;
    address public quoteToken;
    address public baseToken;

    struct Order {
        address user;
        bool isBuy;
        uint256 price;       // quoteToken per baseToken (scaled 1e18)
        uint256 amount;      // baseToken amount
        uint256 filled;      // baseToken filled
        uint256 deadline;
        bool finished;
    }

    Order[] public orders;
    mapping(address => uint256) public quoteBalances;
    mapping(address => uint256) public baseBalances;

    event PlaceOrder(address indexed user, bool isBuy, uint256 price, uint256 amount, uint256 orderId, uint256 deadline);
    event CancelOrder(address indexed user, uint256 orderId);
    event MatchOrder(uint256 orderId, address indexed taker, uint256 fillAmount, uint256 quotePaid);
    event QuoteDeposited(address indexed user, uint256 amount);
    event QuoteWithdrawn(address indexed user, uint256 amount);
    event BaseDeposited(address indexed user, uint256 amount);
    event BaseWithdrawn(address indexed user, uint256 amount);

    constructor(address admin_, address quoteToken_, address baseToken_) {
        if (admin_ == address(0) || quoteToken_ == address(0) || baseToken_ == address(0)) revert IonDexZeroAddress();
        admin = AdminManager(admin_);
        quoteToken = quoteToken_;
        baseToken = baseToken_;
    }

    // ─── Deposits ────────────────────────────────────────────────────────

    function depositQuote(uint256 amount) external {
        if (amount == 0) revert IonDexZeroAmount();
        if (!IERC20(quoteToken).transferFrom(msg.sender, address(this), amount)) revert("TF fail");
        quoteBalances[msg.sender] += amount;
        emit QuoteDeposited(msg.sender, amount);
    }

    function withdrawQuote(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        if (quoteBalances[msg.sender] < amount) revert IonDexInsufficientBalance();
        quoteBalances[msg.sender] -= amount;
        if (!IERC20(quoteToken).transfer(msg.sender, amount)) revert("TF fail");
        emit QuoteWithdrawn(msg.sender, amount);
    }

    function depositBase(uint256 amount) external {
        if (amount == 0) revert IonDexZeroAmount();
        if (!IERC20(baseToken).transferFrom(msg.sender, address(this), amount)) revert("TF fail");
        baseBalances[msg.sender] += amount;
        emit BaseDeposited(msg.sender, amount);
    }

    function withdrawBase(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        if (baseBalances[msg.sender] < amount) revert IonDexInsufficientBalance();
        baseBalances[msg.sender] -= amount;
        if (!IERC20(baseToken).transfer(msg.sender, amount)) revert("TF fail");
        emit BaseWithdrawn(msg.sender, amount);
    }

    // ─── Orders ───────────────────────────────────────────────────────────

    /// @notice Place a buy or sell order.
    /// @param isBuy   true = pay quoteToken to receive baseToken; false = sell baseToken for quoteToken
    /// @param price   quoteToken per baseToken (1e18 precision)
    /// @param amount  baseToken amount
    /// @param deadline  unix timestamp after which the order expires
    function placeOrder(bool isBuy, uint256 price, uint256 amount, uint256 deadline) external nonReentrant {
        if (admin.paused()) revert("Paused");
        if (price == 0 || amount == 0) revert("Invalid order");
        if (block.timestamp > deadline) revert("Order expired");

        if (isBuy) {
            // Buy: lock quoteToken cost = price * amount
            uint256 cost = price * amount / 1e18;
            if (quoteBalances[msg.sender] < cost) revert IonDexInsufficientBalance();
            quoteBalances[msg.sender] -= cost;
        } else {
            // Sell: lock baseToken amount
            if (baseBalances[msg.sender] < amount) revert IonDexInsufficientBalance();
            baseBalances[msg.sender] -= amount;
        }

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
        if (orderId >= orders.length) revert IonDexOrderNotFound();
        Order storage o = orders[orderId];
        if (o.user != msg.sender) revert IonDexNotOrderOwner();
        if (o.finished) revert IonDexOrderFilled();

        o.finished = true;
        uint256 remaining = o.amount - o.filled;

        if (remaining > 0) {
            if (o.isBuy) {
                // Return locked quoteToken
                quoteBalances[msg.sender] += o.price * remaining / 1e18;
            } else {
                // Return locked baseToken
                baseBalances[msg.sender] += remaining;
            }
        }
        emit CancelOrder(msg.sender, orderId);
    }

    /// @notice Match (fill) an order. Transfers tokens between the taker and the maker.
    /// @param orderId    Index of the order to fill
    /// @param fillAmount Amount of baseToken to fill (must ≤ remaining)
    function matchOrder(uint256 orderId, uint256 fillAmount) external nonReentrant {
        if (orderId >= orders.length) revert IonDexOrderNotFound();
        Order storage o = orders[orderId];
        if (o.finished) revert IonDexOrderFilled();
        if (block.timestamp > o.deadline) revert IonDexOrderExpired();
        if (fillAmount == 0) revert IonDexZeroAmount();
        uint256 remaining = o.amount - o.filled;
        if (fillAmount > remaining) revert IonDexInsufficientBalance();

        uint256 quoteAmount = o.price * fillAmount / 1e18;
        o.filled += fillAmount;
        if (o.filled == o.amount) {
            o.finished = true;
        }

        // Token settlement between maker and taker
        if (o.isBuy) {
            // Maker is buyer: maker locked quote, now receives baseToken
            // Taker (msg.sender) sends baseToken, receives quoteToken
            if (baseBalances[msg.sender] < fillAmount) revert IonDexInsufficientBalance();
            baseBalances[msg.sender] -= fillAmount;
            baseBalances[o.user] += fillAmount;

            if (quoteBalances[msg.sender] < quoteAmount) revert IonDexInsufficientBalance();
            quoteBalances[msg.sender] -= quoteAmount;
            quoteBalances[o.user] += quoteAmount; // maker already prepaid quote at order time
        } else {
            // Maker is seller: maker locked baseToken, wants quoteToken
            // Taker (msg.sender) sends quoteToken, receives baseToken
            if (quoteBalances[msg.sender] < quoteAmount) revert IonDexInsufficientBalance();
            quoteBalances[msg.sender] -= quoteAmount;
            quoteBalances[o.user] += quoteAmount;

            if (baseBalances[msg.sender] < fillAmount) revert IonDexInsufficientBalance();
            baseBalances[msg.sender] -= fillAmount;
            baseBalances[o.user] += fillAmount; // maker already prepaid base at order time
        }

        emit MatchOrder(orderId, msg.sender, fillAmount, quoteAmount);
    }

    // ─── Views ────────────────────────────────────────────────────────────

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
