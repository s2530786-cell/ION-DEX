// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice NFT 拍卖市场合约
contract NFTAuction is ReentrancyGuard {
    IERC721 public nft;
    IERC20 public paymentToken;

    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startPrice;
        uint256 endPrice;
        uint256 duration;
        uint256 startTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public constant ROYALTY_BPS = 250; // 2.5% 版税

    event AuctionCreated(uint256 indexed tokenId, address seller, uint256 startPrice, uint256 duration);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 price);

    constructor(address _nft, address _paymentToken) {
        nft = IERC721(_nft);
        paymentToken = IERC20(_paymentToken);
    }

    /// @notice 创建拍卖
    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external {
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(nft.getApproved(tokenId) == address(this), "Not approved");
        require(duration >= 1 hours && duration <= 7 days, "Invalid duration");

        // 将 NFT 转入合约
        nft.transferFrom(msg.sender, address(this), tokenId);

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startPrice: startPrice,
            endPrice: startPrice,   // 固定价格模式，可扩展为荷兰拍
            duration: duration,
            startTime: block.timestamp,
            highestBidder: address(0),
            highestBid: startPrice,
            ended: false
        });

        emit AuctionCreated(tokenId, msg.sender, startPrice, duration);
    }

    /// @notice 出价
    function bid(uint256 tokenId, uint256 amount) external nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Ended");
        require(block.timestamp < a.startTime + a.duration, "Expired");
        require(amount >= a.startPrice, "Below min price");
        require(amount > a.highestBid, "Low bid");

        // 退回前一个出价
        if (a.highestBidder != address(0)) {
            paymentToken.transfer(a.highestBidder, a.highestBid);
        }

        paymentToken.transferFrom(msg.sender, address(this), amount);
        a.highestBidder = msg.sender;
        a.highestBid = amount;

        emit BidPlaced(tokenId, msg.sender, amount);
    }

    /// @notice 结束拍卖
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Ended");
        require(block.timestamp >= a.startTime + a.duration, "Not ended");

        a.ended = true;

        if (a.highestBidder != address(0)) {
            // 支付给卖家（扣除版税）
            uint256 royalty = (a.highestBid * ROYALTY_BPS) / 10000;
            paymentToken.transfer(a.seller, a.highestBid - royalty);
            nft.transferFrom(address(this), a.highestBidder, tokenId);
        } else {
            // 无人出价，退还给卖家
            nft.transferFrom(address(this), a.seller, tokenId);
        }

        emit AuctionEnded(tokenId, a.highestBidder, a.highestBid);
    }
}
