const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("VendingMachineV2", function () {
  // This fixture will be re-run in every test to setup the contract.
  // Using loadFixture() to run this will create a snapshot of the contract
  // state and reset the Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const [owner, user1, user2] = await ethers.getSigners();
    const VendingMachineV2 = await ethers.getContractFactory(
      "VendingMachineV2"
    );
    // deploy the with the starting soda count of 100
    // TODO: will I need to call `initialize()` instead of `deploy`? See
    // deployProxy for possible ways for testing this correctly. [topher]
    const vendingMachineV2 = await VendingMachineV2.deploy(100);
    return { owner, user1, user2, vendingMachineV2 };
  }

  it("should initialize the owner", async function () {
    // TODO
  });
  it("should initialize the correct soda count", async function () {
    // TODO
  });
  it("should increment purchasedSodas", async function () {
    // TODO
  });
  it("should emit SodaPurchased event", async function () {
    // TODO
  });
  it("should prevent purchasing sodas when numSodas is zero", async function () {
    // TODO
  });
  it("should restrict withdrawProfits to the owner", async function () {
    // TODO
  });
  it("should only allow the owner to setNewOwner", async function () {
    // TODO
  });
  it("should emit NewOwnerSet event", async function () {
    // TODO
  });
});
