require("dotenv").config();
const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const networkName = hre.network.name;

async function main() {
  let proxyAddress = process.env.PROXY_GOERLI_ADDRESS;
  if (networkName == "mainnet") {
    proxyAddress = process.env.PROXY_ADDRESS;
  }

  const VendingMachineV2 = await ethers.getContractFactory("VendingMachineV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, VendingMachineV2);
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  const owner = await upgraded.owner();
  console.log("The current contract owner is: " + owner);
  // TODO: this gave the previous implementation address; find a way to make
  // this script wait long enough to get the correct address. [topher]
  console.log("Implementation contract address: " + implementationAddress);
}

main();
