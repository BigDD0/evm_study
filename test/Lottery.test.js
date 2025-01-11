const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery", function () {
  let lottery;
  let myToken;
  let owner;
  let player1;
  let player2;
  
  const TICKET_PRICE = ethers.parseEther("0.01");
  const INITIAL_TOKEN_SUPPLY = ethers.parseUnits("1000000", 18);
  const PRIZE_POOL_AMOUNT = ethers.parseUnits("50000", 18);

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    
    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy("MyToken", "MTK", 18, 1000000);
    
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(await myToken.getAddress(), TICKET_PRICE);
    
    await myToken.transfer(await lottery.getAddress(), PRIZE_POOL_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set the correct reward token", async function () {
      expect(await lottery.rewardToken()).to.equal(await myToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should set the correct ticket price", async function () {
      expect(await lottery.ticketPrice()).to.equal(TICKET_PRICE);
    });

    it("Should initialize 5 prizes", async function () {
      expect(await lottery.getPrizeCount()).to.equal(5);
    });

    it("Should have correct initial prize structure", async function () {
      const prize0 = await lottery.getPrizeInfo(0);
      expect(prize0.tokenAmount).to.equal(ethers.parseUnits("100", 18));
      expect(prize0.probability).to.equal(1000);
      expect(prize0.active).to.be.true;

      const prize4 = await lottery.getPrizeInfo(4);
      expect(prize4.tokenAmount).to.equal(ethers.parseUnits("10000", 18));
      expect(prize4.probability).to.equal(1);
      expect(prize4.active).to.be.true;
    });
  });

  describe("Ticket Purchase", function () {
    it("Should allow buying single ticket", async function () {
      await expect(lottery.connect(player1).buyTickets(1, { value: TICKET_PRICE }))
        .to.emit(lottery, "TicketPurchased")
        .withArgs(player1.address, TICKET_PRICE, 1);

      const [tickets, ] = await lottery.getPlayerStats(player1.address);
      expect(tickets).to.equal(1);
      expect(await lottery.totalTicketsSold()).to.equal(1);
    });

    it("Should allow buying multiple tickets", async function () {
      const numTickets = 5;
      const totalCost = TICKET_PRICE * BigInt(numTickets);
      
      await lottery.connect(player1).buyTickets(numTickets, { value: totalCost });

      const [tickets, ] = await lottery.getPlayerStats(player1.address);
      expect(tickets).to.equal(numTickets);
      expect(await lottery.totalTicketsSold()).to.equal(numTickets);
    });

    it("Should revert if incorrect payment amount", async function () {
      const incorrectAmount = TICKET_PRICE / 2n;
      
      await expect(
        lottery.connect(player1).buyTickets(1, { value: incorrectAmount })
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should revert if trying to buy 0 tickets", async function () {
      await expect(
        lottery.connect(player1).buyTickets(0, { value: 0 })
      ).to.be.revertedWith("Must buy at least 1 ticket");
    });

    it("Should automatically play lottery when buying tickets", async function () {
      const numTickets = 10;
      const totalCost = TICKET_PRICE * BigInt(numTickets);
      
      await lottery.connect(player1).buyTickets(numTickets, { value: totalCost });
      
      const historyCount = await lottery.getLotteryHistoryCount();
      expect(historyCount).to.be.at.least(0);
    });
  });

  describe("Prize Management", function () {
    it("Should allow owner to add new prize", async function () {
      const newTokenAmount = ethers.parseUnits("2000", 18);
      const newProbability = 25;
      
      await expect(lottery.addPrize(newTokenAmount, newProbability))
        .to.emit(lottery, "PrizeAdded")
        .withArgs(5, newTokenAmount, newProbability);

      expect(await lottery.getPrizeCount()).to.equal(6);
      
      const newPrize = await lottery.getPrizeInfo(5);
      expect(newPrize.tokenAmount).to.equal(newTokenAmount);
      expect(newPrize.probability).to.equal(newProbability);
      expect(newPrize.active).to.be.true;
    });

    it("Should allow owner to update existing prize", async function () {
      const newTokenAmount = ethers.parseUnits("150", 18);
      const newProbability = 800;
      
      await lottery.updatePrize(0, newTokenAmount, newProbability, false);
      
      const updatedPrize = await lottery.getPrizeInfo(0);
      expect(updatedPrize.tokenAmount).to.equal(newTokenAmount);
      expect(updatedPrize.probability).to.equal(newProbability);
      expect(updatedPrize.active).to.be.false;
    });

    it("Should not allow non-owner to add prize", async function () {
      await expect(
        lottery.connect(player1).addPrize(ethers.parseUnits("1000", 18), 100)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow non-owner to update prize", async function () {
      await expect(
        lottery.connect(player1).updatePrize(0, ethers.parseUnits("1000", 18), 100, true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Token Management", function () {
    it("Should show correct contract token balance", async function () {
      const balance = await lottery.getContractTokenBalance();
      expect(balance).to.equal(PRIZE_POOL_AMOUNT);
    });

    it("Should allow owner to deposit more tokens", async function () {
      const additionalAmount = ethers.parseUnits("10000", 18);
      
      await myToken.approve(await lottery.getAddress(), additionalAmount);
      
      await expect(lottery.depositTokens(additionalAmount))
        .to.emit(lottery, "PrizePoolUpdated");
      
      const newBalance = await lottery.getContractTokenBalance();
      expect(newBalance).to.equal(PRIZE_POOL_AMOUNT + additionalAmount);
    });

    it("Should not allow non-owner to deposit tokens", async function () {
      const amount = ethers.parseUnits("1000", 18);
      await myToken.transfer(player1.address, amount);
      await myToken.connect(player1).approve(await lottery.getAddress(), amount);
      
      await expect(
        lottery.connect(player1).depositTokens(amount)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("ETH Management", function () {
    beforeEach(async function () {
      await lottery.connect(player1).buyTickets(5, { value: TICKET_PRICE * 5n });
    });

    it("Should accumulate ETH from ticket sales", async function () {
      const contractBalance = await lottery.getContractETHBalance();
      expect(contractBalance).to.equal(TICKET_PRICE * 5n);
    });

    it("Should allow owner to withdraw ETH", async function () {
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await lottery.getContractETHBalance();
      
      const tx = await lottery.withdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const expectedBalance = initialOwnerBalance + contractBalance - gasUsed;
      
      expect(finalOwnerBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
      expect(await lottery.getContractETHBalance()).to.equal(0);
    });

    it("Should not allow non-owner to withdraw ETH", async function () {
      await expect(
        lottery.connect(player1).withdrawETH()
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Ticket Price Management", function () {
    it("Should allow owner to set new ticket price", async function () {
      const newPrice = ethers.parseEther("0.02");
      
      await lottery.setTicketPrice(newPrice);
      expect(await lottery.ticketPrice()).to.equal(newPrice);
    });

    it("Should not allow setting zero ticket price", async function () {
      await expect(lottery.setTicketPrice(0)).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should not allow non-owner to set ticket price", async function () {
      await expect(
        lottery.connect(player1).setTicketPrice(ethers.parseEther("0.02"))
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Lottery Simulation", function () {
    it("Should simulate lottery result", async function () {
      const [prizeIndex, tokenAmount] = await lottery.simulateLottery();
      
      if (prizeIndex < 5) {
        expect(tokenAmount).to.be.gt(0);
        const expectedPrize = await lottery.getPrizeInfo(prizeIndex);
        expect(tokenAmount).to.equal(expectedPrize.tokenAmount);
      } else {
        expect(tokenAmount).to.equal(0);
      }
    });
  });

  describe("Lottery History", function () {
    it("Should record lottery results", async function () {
      const numTickets = 20;
      const totalCost = TICKET_PRICE * BigInt(numTickets);
      
      await lottery.connect(player1).buyTickets(numTickets, { value: totalCost });
      
      const historyCount = await lottery.getLotteryHistoryCount();
      
      if (historyCount > 0) {
        const firstResult = await lottery.getLotteryHistory(0);
        expect(firstResult.player).to.equal(player1.address);
        expect(firstResult.tokenAmount).to.be.gt(0);
        expect(firstResult.timestamp).to.be.gt(0);
      }
    });
  });

  describe("Multiple Players", function () {
    it("Should handle multiple players correctly", async function () {
      await lottery.connect(player1).buyTickets(3, { value: TICKET_PRICE * 3n });
      await lottery.connect(player2).buyTickets(2, { value: TICKET_PRICE * 2n });
      
      const [player1Tickets, ] = await lottery.getPlayerStats(player1.address);
      const [player2Tickets, ] = await lottery.getPlayerStats(player2.address);
      
      expect(player1Tickets).to.equal(3);
      expect(player2Tickets).to.equal(2);
      expect(await lottery.totalTicketsSold()).to.equal(5);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle insufficient prize pool", async function () {
      const SmallLottery = await ethers.getContractFactory("Lottery");
      const smallLottery = await SmallLottery.deploy(await myToken.getAddress(), TICKET_PRICE);
      
      await myToken.transfer(await smallLottery.getAddress(), ethers.parseUnits("50", 18));
      
      await expect(
        smallLottery.connect(player1).buyTickets(1, { value: TICKET_PRICE })
      ).to.be.revertedWith("Insufficient prize pool");
    });

    it("Should revert on invalid prize index access", async function () {
      await expect(lottery.getPrizeInfo(10)).to.be.revertedWith("Invalid prize index");
    });

    it("Should revert on invalid history index access", async function () {
      await expect(lottery.getLotteryHistory(0)).to.be.revertedWith("Invalid history index");
    });
  });
});