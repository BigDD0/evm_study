const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let myToken;
  let owner;
  let addr1;
  let addr2;
  
  const TOKEN_NAME = "MyToken";
  const TOKEN_SYMBOL = "MTK";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = 1000000;
  const TOTAL_SUPPLY = ethers.parseUnits(INITIAL_SUPPLY.toString(), TOKEN_DECIMALS);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      expect(await myToken.name()).to.equal(TOKEN_NAME);
    });

    it("Should set the right symbol", async function () {
      expect(await myToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the right decimals", async function () {
      expect(await myToken.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await myToken.balanceOf(owner.address);
      expect(await myToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY);
    });

    it("Should emit Transfer event on deployment", async function () {
      const MyToken = await ethers.getContractFactory("MyToken");
      await expect(MyToken.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY))
        .to.emit(MyToken, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, TOTAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);
      
      await myToken.transfer(addr1.address, transferAmount);
      const addr1Balance = await myToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      const ownerBalance = await myToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY - transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await myToken.balanceOf(owner.address);
      const transferAmount = initialOwnerBalance + 1n;

      await expect(
        myToken.transfer(addr1.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should emit Transfer events", async function () {
      const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

      await expect(myToken.transfer(addr1.address, transferAmount))
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should not allow transfer to zero address", async function () {
      const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

      await expect(
        myToken.transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });
  });

  describe("Allowances", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);
      
      await myToken.approve(addr1.address, approveAmount);
      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should emit Approval event", async function () {
      const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(myToken.approve(addr1.address, approveAmount))
        .to.emit(myToken, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);
    });

    it("Should allow approved spender to transfer tokens", async function () {
      const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);
      const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

      await myToken.approve(addr1.address, approveAmount);
      await myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      expect(await myToken.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should fail if spender tries to transfer more than allowed", async function () {
      const approveAmount = ethers.parseUnits("50", TOKEN_DECIMALS);
      const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await myToken.approve(addr1.address, approveAmount);

      await expect(
        myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not allow approval from zero address", async function () {
      const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);
      
      await expect(
        myToken.approve(ethers.ZeroAddress, approveAmount)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });
  });

  describe("Minting", function () {
    it("Should mint new tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);
      const initialSupply = await myToken.totalSupply();
      const initialBalance = await myToken.balanceOf(addr1.address);

      await myToken.mint(addr1.address, mintAmount);

      expect(await myToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await myToken.balanceOf(addr1.address)).to.equal(initialBalance + mintAmount);
    });

    it("Should emit Transfer event on mint", async function () {
      const mintAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(myToken.mint(addr1.address, mintAmount))
        .to.emit(myToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
    });

    it("Should not allow minting to zero address", async function () {
      const mintAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(
        myToken.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("ERC20: mint to the zero address");
    });
  });

  describe("Burning", function () {
    it("Should burn tokens from caller's balance", async function () {
      const burnAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);
      const initialSupply = await myToken.totalSupply();
      const initialBalance = await myToken.balanceOf(owner.address);

      await myToken.burn(burnAmount);

      expect(await myToken.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await myToken.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should emit Transfer event on burn", async function () {
      const burnAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(myToken.burn(burnAmount))
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, burnAmount);
    });

    it("Should fail if burn amount exceeds balance", async function () {
      const burnAmount = TOTAL_SUPPLY + 1n;

      await expect(myToken.burn(burnAmount)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("Edge cases", function () {
    it("Should handle zero amount transfers", async function () {
      await expect(myToken.transfer(addr1.address, 0)).to.not.be.reverted;
      expect(await myToken.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle maximum allowance", async function () {
      const maxAllowance = ethers.MaxUint256;
      const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await myToken.approve(addr1.address, maxAllowance);
      await myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(maxAllowance);
    });
  });
});