# EVMBot - Ethereum Smart Contract Demo

A collection of Solidity smart contracts demonstrating various blockchain concepts including basic contract functionality, ERC20 tokens, and lottery mechanics.

## 📋 Project Overview

This project contains three main smart contracts:

1. **SimpleContract** - Basic contract demonstrating ownership, message storage, and counter functionality
2. **MyToken** - Custom ERC20 token implementation with mint/burn capabilities
3. **Lottery** - Token-based lottery system with configurable prizes and probabilities

## 🛠 Tech Stack

- **Solidity**: ^0.8.0
- **Hardhat**: ^2.19.0
- **Node.js**: Development environment
- **Hardhat Toolbox**: Testing and development tools

## 📁 Project Structure

```
├── contracts/
│   ├── SimpleContract.sol    # Basic contract with message and counter
│   ├── MyToken.sol          # ERC20 token implementation
│   └── Lottery.sol          # Token lottery system
├── scripts/
│   ├── deploy.js           # Individual contract deployment
│   └── deployAll.js        # Deploy all contracts
├── test/
│   ├── SimpleContract.test.js
│   ├── MyToken.test.js
│   └── Lottery.test.js
└── hardhat.config.js       # Hardhat configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd evmbot
```

2. Install dependencies
```bash
npm install
```

### Compilation

Compile all smart contracts:
```bash
npm run compile
```

### Testing

Run all tests:
```bash
npm test
```

### Deployment

Deploy contracts to local network:
```bash
npm run deploy
```

## 📊 Smart Contracts

### SimpleContract

A basic contract demonstrating:
- Owner-only message updates
- Public counter with increment functionality
- Event emissions for state changes

**Key Functions:**
- `setMessage(string)` - Update stored message (owner only)
- `increment()` - Increment counter (public)
- `getMessage()` - Get current message
- `getCount()` - Get current counter value

### MyToken (ERC20)

A fully functional ERC20 token with additional features:
- Standard ERC20 functionality (transfer, approve, allowance)
- Mint new tokens to any address
- Burn tokens from sender's balance
- Custom token name, symbol, and decimals

**Key Features:**
- Configurable token parameters
- Public mint function (no restrictions)
- Self-burn functionality

### Lottery

An advanced lottery system using ERC20 tokens as prizes:
- ETH-based ticket purchases
- Configurable prize tiers with different probabilities
- Automatic prize distribution
- Comprehensive lottery history tracking

**Prize Structure (Default):**
- Tier 1: 100 tokens (10% chance)
- Tier 2: 500 tokens (2% chance)
- Tier 3: 1000 tokens (0.5% chance)
- Tier 4: 5000 tokens (0.1% chance)
- Tier 5: 10000 tokens (0.01% chance)

**Key Functions:**
- `buyTickets(uint256)` - Purchase lottery tickets
- `addPrize()` - Add new prize tier (owner only)
- `updatePrize()` - Modify existing prizes (owner only)
- `withdrawETH()` - Withdraw collected ETH (owner only)
- `depositTokens()` - Add tokens to prize pool (owner only)

## 🔧 Development

### Running Local Network

Start Hardhat local network:
```bash
npx hardhat node
```

### Console Interaction

Access Hardhat console:
```bash
npx hardhat console
```

### Custom Scripts

- `scripts/deploy.js` - Deploy individual contracts
- `scripts/deployAll.js` - Deploy complete system

## ⚠️ Security Considerations

- Lottery uses pseudo-random number generation (not suitable for production)
- MyToken has unrestricted minting (consider adding access controls for production)
- Always audit smart contracts before mainnet deployment

## 📄 License

This project is licensed under the MIT License.
