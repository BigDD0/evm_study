// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Lottery {
    IERC20 public rewardToken;
    address public owner;
    uint256 public ticketPrice;
    uint256 public totalTicketsSold;
    uint256 public totalPrizePool;
    
    struct Prize {
        uint256 tokenAmount;
        uint256 probability;
        bool active;
    }
    
    struct LotteryResult {
        address player;
        uint256 prizeIndex;
        uint256 tokenAmount;
        uint256 timestamp;
    }
    
    Prize[] public prizes;
    LotteryResult[] public lotteryHistory;
    
    mapping(address => uint256) public playerTickets;
    mapping(address => uint256) public playerWinnings;
    
    event TicketPurchased(address indexed player, uint256 amount, uint256 tickets);
    event PrizeWon(address indexed player, uint256 prizeIndex, uint256 tokenAmount);
    event PrizeAdded(uint256 prizeIndex, uint256 tokenAmount, uint256 probability);
    event PrizePoolUpdated(uint256 newAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validPrizeIndex(uint256 _prizeIndex) {
        require(_prizeIndex < prizes.length, "Invalid prize index");
        require(prizes[_prizeIndex].active, "Prize is not active");
        _;
    }
    
    constructor(address _rewardToken, uint256 _ticketPrice) {
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
        ticketPrice = _ticketPrice;
        
        _initializePrizes();
    }
    
    function _initializePrizes() internal {
        prizes.push(Prize({
            tokenAmount: 100 * 10**18,
            probability: 1000,
            active: true
        }));
        
        prizes.push(Prize({
            tokenAmount: 500 * 10**18,
            probability: 200,
            active: true
        }));
        
        prizes.push(Prize({
            tokenAmount: 1000 * 10**18,
            probability: 50,
            active: true
        }));
        
        prizes.push(Prize({
            tokenAmount: 5000 * 10**18,
            probability: 10,
            active: true
        }));
        
        prizes.push(Prize({
            tokenAmount: 10000 * 10**18,
            probability: 1,
            active: true
        }));
    }
    
    function buyTickets(uint256 _numTickets) external payable {
        require(_numTickets > 0, "Must buy at least 1 ticket");
        require(msg.value == ticketPrice * _numTickets, "Incorrect payment amount");
        
        playerTickets[msg.sender] += _numTickets;
        totalTicketsSold += _numTickets;
        
        emit TicketPurchased(msg.sender, msg.value, _numTickets);
        
        for (uint256 i = 0; i < _numTickets; i++) {
            _playLottery(msg.sender);
        }
    }
    
    function _playLottery(address _player) internal {
        uint256 randomNumber = _generateRandomNumber();
        uint256 prizeIndex = _determinePrize(randomNumber);
        
        if (prizeIndex < prizes.length) {
            uint256 prizeAmount = prizes[prizeIndex].tokenAmount;
            
            require(rewardToken.balanceOf(address(this)) >= prizeAmount, "Insufficient prize pool");
            
            playerWinnings[_player] += prizeAmount;
            totalPrizePool += prizeAmount;
            
            require(rewardToken.transfer(_player, prizeAmount), "Token transfer failed");
            
            lotteryHistory.push(LotteryResult({
                player: _player,
                prizeIndex: prizeIndex,
                tokenAmount: prizeAmount,
                timestamp: block.timestamp
            }));
            
            emit PrizeWon(_player, prizeIndex, prizeAmount);
        }
    }
    
    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            totalTicketsSold,
            blockhash(block.number - 1)
        ))) % 10000;
    }
    
    function _determinePrize(uint256 _randomNumber) internal view returns (uint256) {
        uint256 cumulativeProbability = 0;
        
        for (uint256 i = 0; i < prizes.length; i++) {
            if (prizes[i].active) {
                cumulativeProbability += prizes[i].probability;
                if (_randomNumber < cumulativeProbability) {
                    return i;
                }
            }
        }
        
        return prizes.length;
    }
    
    function addPrize(uint256 _tokenAmount, uint256 _probability) external onlyOwner {
        prizes.push(Prize({
            tokenAmount: _tokenAmount,
            probability: _probability,
            active: true
        }));
        
        emit PrizeAdded(prizes.length - 1, _tokenAmount, _probability);
    }
    
    function updatePrize(uint256 _prizeIndex, uint256 _tokenAmount, uint256 _probability, bool _active) 
        external 
        onlyOwner 
        validPrizeIndex(_prizeIndex) 
    {
        prizes[_prizeIndex].tokenAmount = _tokenAmount;
        prizes[_prizeIndex].probability = _probability;
        prizes[_prizeIndex].active = _active;
    }
    
    function setTicketPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        ticketPrice = _newPrice;
    }
    
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "ETH withdrawal failed");
    }
    
    function depositTokens(uint256 _amount) external onlyOwner {
        require(rewardToken.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        require(rewardToken.transfer(address(this), _amount), "Token deposit failed");
        
        emit PrizePoolUpdated(rewardToken.balanceOf(address(this)));
    }
    
    function getContractTokenBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
    
    function getContractETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getPrizeCount() external view returns (uint256) {
        return prizes.length;
    }
    
    function getLotteryHistoryCount() external view returns (uint256) {
        return lotteryHistory.length;
    }
    
    function getLotteryHistory(uint256 _index) external view returns (LotteryResult memory) {
        require(_index < lotteryHistory.length, "Invalid history index");
        return lotteryHistory[_index];
    }
    
    function getPrizeInfo(uint256 _prizeIndex) external view returns (Prize memory) {
        require(_prizeIndex < prizes.length, "Invalid prize index");
        return prizes[_prizeIndex];
    }
    
    function getPlayerStats(address _player) external view returns (uint256 tickets, uint256 winnings) {
        return (playerTickets[_player], playerWinnings[_player]);
    }
    
    function simulateLottery() external view returns (uint256 prizeIndex, uint256 tokenAmount) {
        uint256 randomNumber = _generateRandomNumber();
        uint256 _prizeIndex = _determinePrize(randomNumber);
        
        if (_prizeIndex < prizes.length) {
            return (_prizeIndex, prizes[_prizeIndex].tokenAmount);
        } else {
            return (prizes.length, 0);
        }
    }
}