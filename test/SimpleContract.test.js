const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleContract", function () {
  let simpleContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const SimpleContract = await ethers.getContractFactory("SimpleContract");
    simpleContract = await SimpleContract.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simpleContract.getOwner()).to.equal(owner.address);
    });

    it("Should set the initial message", async function () {
      expect(await simpleContract.getMessage()).to.equal("Hello, World!");
    });

    it("Should initialize count to 0", async function () {
      expect(await simpleContract.getCount()).to.equal(0);
    });
  });

  describe("Message functionality", function () {
    it("Should allow owner to set message", async function () {
      const newMessage = "Hello, Blockchain!";
      await simpleContract.setMessage(newMessage);
      expect(await simpleContract.getMessage()).to.equal(newMessage);
    });

    it("Should emit MessageUpdated event", async function () {
      const newMessage = "Test Message";
      await expect(simpleContract.setMessage(newMessage))
        .to.emit(simpleContract, "MessageUpdated")
        .withArgs(newMessage);
    });

    it("Should revert when non-owner tries to set message", async function () {
      await expect(
        simpleContract.connect(addr1).setMessage("Unauthorized")
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Counter functionality", function () {
    it("Should increment count", async function () {
      await simpleContract.increment();
      expect(await simpleContract.getCount()).to.equal(1);
      
      await simpleContract.increment();
      expect(await simpleContract.getCount()).to.equal(2);
    });

    it("Should emit CountIncremented event", async function () {
      await expect(simpleContract.increment())
        .to.emit(simpleContract, "CountIncremented")
        .withArgs(1);
    });

    it("Should allow any address to increment", async function () {
      await simpleContract.connect(addr1).increment();
      expect(await simpleContract.getCount()).to.equal(1);
      
      await simpleContract.connect(addr2).increment();
      expect(await simpleContract.getCount()).to.equal(2);
    });
  });

  describe("View functions", function () {
    it("Should return correct message", async function () {
      const newMessage = "View Test";
      await simpleContract.setMessage(newMessage);
      expect(await simpleContract.message()).to.equal(newMessage);
    });

    it("Should return correct count", async function () {
      await simpleContract.increment();
      await simpleContract.increment();
      expect(await simpleContract.count()).to.equal(2);
    });

    it("Should return correct owner", async function () {
      expect(await simpleContract.owner()).to.equal(owner.address);
    });
  });
});