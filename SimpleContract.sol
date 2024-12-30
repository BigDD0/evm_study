// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleContract {
    string public message;
    address public owner;
    uint256 public count;
    
    event MessageUpdated(string newMessage);
    event CountIncremented(uint256 newCount);
    
    constructor() {
        owner = msg.sender;
        message = "Hello, World!";
        count = 0;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function setMessage(string memory _message) public onlyOwner {
        message = _message;
        emit MessageUpdated(_message);
    }
    
    function increment() public {
        count++;
        emit CountIncremented(count);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    function getCount() public view returns (uint256) {
        return count;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
}