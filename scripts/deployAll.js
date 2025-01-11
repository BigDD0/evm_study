const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  console.log("\n=== Deploying MyToken ===");
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy("MyToken", "MTK", 18, 1000000);
  const myTokenAddress = await myToken.getAddress();
  console.log("MyToken deployed to:", myTokenAddress);

  console.log("\n=== Deploying Lottery ===");
  const ticketPrice = hre.ethers.parseEther("0.01");
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(myTokenAddress, ticketPrice);
  const lotteryAddress = await lottery.getAddress();
  console.log("Lottery deployed to:", lotteryAddress);

  console.log("\n=== Setting up lottery prize pool ===");
  const prizePoolAmount = hre.ethers.parseUnits("100000", 18);
  console.log("Transferring", hre.ethers.formatUnits(prizePoolAmount, 18), "MTK to lottery contract");
  await myToken.transfer(lotteryAddress, prizePoolAmount);

  console.log("\n=== Deployment Summary ===");
  console.log("MyToken address:", myTokenAddress);
  console.log("Lottery address:", lotteryAddress);
  console.log("Ticket price:", hre.ethers.formatEther(ticketPrice), "ETH");
  console.log("Prize pool:", hre.ethers.formatUnits(prizePoolAmount, 18), "MTK");
  
  console.log("\n=== Prize Structure ===");
  for (let i = 0; i < 5; i++) {
    const prize = await lottery.getPrizeInfo(i);
    console.log(`Prize ${i}: ${hre.ethers.formatUnits(prize.tokenAmount, 18)} MTK (probability: ${prize.probability}/10000)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });