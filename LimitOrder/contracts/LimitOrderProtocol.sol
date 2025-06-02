// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LimitOrderProtocol is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum OrderType { BUY, SELL }

    struct LimitOrder {
        uint256 id;
        address user;
        address tokenGive;
        address tokenGet;
        uint256 amountGive;
        uint256 amountGet;
        uint256 price;
        uint256 expiry;
        bool executed;
        OrderType orderType;
    }

    uint256 public orderCount;
    uint256 public feeBps = 25; // 0.25%
    address public feeCollector;

    mapping(uint256 => LimitOrder) public orders;
    mapping(address => uint256[]) public userOrders;

    AggregatorV3Interface public priceFeed;

    event OrderPlaced(uint256 indexed orderId, address indexed user, LimitOrder order);
    event OrderCancelled(uint256 indexed orderId, address indexed user);
    event OrderExecuted(uint256 indexed orderId, address indexed executor);
    event FeeCollectorUpdated(address indexed newCollector);
    event FeeUpdated(uint256 newFeeBps);

    constructor(address _priceFeed, address _feeCollector) Ownable(msg.sender) {
        require(_priceFeed != address(0) && _feeCollector != address(0), "Invalid address");
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeCollector = _feeCollector;
    }

    modifier onlyOrderOwner(uint256 orderId) {
        require(orders[orderId].user == msg.sender, "Not your order");
        _;
    }

    function placeLimitOrder(
        address tokenGive,
        address tokenGet,
        uint256 amountGive,
        uint256 amountGet,
        uint256 price,
        uint256 expiry,
        OrderType orderType
    ) external nonReentrant returns (uint256) {
        require(tokenGive != address(0) && tokenGet != address(0), "Invalid token");
        require(amountGive > 0 && amountGet > 0 && price > 0, "Invalid values");
        require(expiry > block.timestamp, "Invalid expiry");

        uint256 orderId = orderCount++;

        IERC20(tokenGive).safeTransferFrom(msg.sender, address(this), amountGive);

        LimitOrder memory order = LimitOrder({
            id: orderId,
            user: msg.sender,
            tokenGive: tokenGive,
            tokenGet: tokenGet,
            amountGive: amountGive,
            amountGet: amountGet,
            price: price,
            expiry: expiry,
            executed: false,
            orderType: orderType
        });

        orders[orderId] = order;
        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, order);
        return orderId;
    }

    function cancelOrder(uint256 orderId) external nonReentrant onlyOrderOwner(orderId) {
        LimitOrder storage order = orders[orderId];
        require(!order.executed, "Already executed");

        order.executed = true;
        IERC20(order.tokenGive).safeTransfer(order.user, order.amountGive);

        emit OrderCancelled(orderId, msg.sender);
    }

    function executeOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = orders[orderId];
        require(!order.executed, "Already executed");
        require(block.timestamp <= order.expiry, "Order expired");

        uint256 marketPrice = getLatestPrice(); // from oracle
        bool shouldExecute;

        if (order.orderType == OrderType.BUY && marketPrice <= order.price) {
            shouldExecute = true;
        } else if (order.orderType == OrderType.SELL && marketPrice >= order.price) {
            shouldExecute = true;
        }

        require(shouldExecute, "Market price not favorable");

        order.executed = true;

        // Apply fee to tokenGet amount
        uint256 fee = (order.amountGet * feeBps) / 10000;
        uint256 userReceives = order.amountGet - fee;

        IERC20(order.tokenGet).safeTransfer(order.user, userReceives);
        IERC20(order.tokenGet).safeTransfer(feeCollector, fee);

        emit OrderExecuted(orderId, msg.sender);
    }

    function getLatestPrice() public view returns (uint256) {
        (
            , int256 price,,,
        ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Zero address");
        feeCollector = newCollector;
        emit FeeCollectorUpdated(newCollector);
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Max 10%");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }
}