const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { assert, expect } = require("chai");

describe("VendingMachineV2", function () {
  // This fixture will be re-run in every test to setup the contract.
  // Using loadFixture() to run this will create a snapshot of the contract
  // state and reset the Hardhat Network to that snapshot in every test.
  async function upgradeContractAndSetVariables() {
    const [owner, user1, user2] = await ethers.getSigners();

    // deploy the v1 contract with 10 sodas
    const VendingMachineV1 = await ethers.getContractFactory(
      "VendingMachineV1"
    );
    const proxy = await upgrades.deployProxy(VendingMachineV1, [10]);
    await proxy.deployed();

    // upgrade to v2 contract
    const VendingMachineV2 = await ethers.getContractFactory(
      "VendingMachineV2"
    );
    const upgradedProxy = await upgrades.upgradeProxy(
      proxy.address,
      VendingMachineV2
    );
    return { owner, user1, user2, upgradedProxy };
  }

  it("should initialize the owner", async function () {
    const { owner, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    expect(await upgradedProxy.owner()).to.equal(owner.address);
  });

  it("should initialize the correct soda count", async function () {
    const { upgradedProxy } = await loadFixture(upgradeContractAndSetVariables);
    expect(await upgradedProxy.numSodas()).to.equal(10);
  });

  it("should increment purchasedSodas and decrement numSodas", async function () {
    const { user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    expect(await upgradedProxy.purchasedSodas(user1.address)).to.equal(0);

    await upgradedProxy
      .connect(user1)
      .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") });
    expect(await upgradedProxy.numSodas()).to.equal(9);
    expect(await upgradedProxy.purchasedSodas(user1.address)).to.equal(1);
  });

  it("should emit SodaPurchased event", async function () {
    const { user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    const response = await upgradedProxy
      .connect(user1)
      .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") });
    const receipt = await response.wait();
    const topic = upgradedProxy.interface.getEventTopic("SodaPurchased");
    const log = receipt.logs.find((x) => x.topics.indexOf(topic) >= 0);
    deployedEvent = upgradedProxy.interface.parseLog(log);
    assert(deployedEvent, "Expected a SodaPurchased event to be emitted!");
  });

  it("should prevent purchasing sodas when numSodas is zero", async function () {
    const { user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    expect(await upgradedProxy.numSodas()).to.equal(10);
    expect(await upgradedProxy.purchasedSodas(user1.address)).to.equal(0);
    for (let i = 1; i <= 10; i++) {
      await upgradedProxy
        .connect(user1)
        .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") });
      expect(await upgradedProxy.purchasedSodas(user1.address)).to.equal(i);
    }
    expect(await upgradedProxy.numSodas()).to.equal(0);
    expect(await upgradedProxy.purchasedSodas(user1.address)).to.equal(10);

    // should now prevent purchasing a soda
    await expect(
      upgradedProxy
        .connect(user1)
        .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") })
    ).to.be.revertedWith("There are no more sodas to buy!");
  });

  it("should restrict withdrawProfits to when a balance exists", async function () {
    const { owner, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    const balance = await ethers.provider.getBalance(upgradedProxy.address);
    expect(balance.eq(0)).to.equal(true);
    await expect(
      upgradedProxy.connect(owner).withdrawProfits()
    ).to.be.revertedWith(
      "Profits must be greater than 0 in order to withdraw!"
    );
  });

  it("should restrict withdrawProfits to the owner", async function () {
    const { owner, user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );

    // starting balance will be 1000 wei
    await upgradedProxy
      .connect(user1)
      .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") });
    const balanceStart = await ethers.provider.getBalance(
      upgradedProxy.address
    );
    expect(balanceStart.eq(ethers.utils.parseUnits("1000", "wei"))).to.equal(
      true
    );

    // restricted to owner
    await expect(
      upgradedProxy.connect(user1).withdrawProfits()
    ).to.be.revertedWith("Only owner can call this function.");

    // ending balance should be 0 after withdrawProfits()
    await upgradedProxy.connect(owner).withdrawProfits();
    const balanceEnd = await ethers.provider.getBalance(upgradedProxy.address);
    expect(balanceEnd.eq(0)).to.equal(true);
  });

  it("should only allow the owner to setNewOwner", async function () {
    const { owner, user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );

    expect(await upgradedProxy.owner()).to.equal(owner.address);

    // restricted to owner
    await expect(
      upgradedProxy.connect(user1).setNewOwner(user1.address)
    ).to.be.revertedWith("Only owner can call this function.");

    await upgradedProxy.connect(owner).setNewOwner(user1.address);
    expect(await upgradedProxy.owner()).to.equal(user1.address);
  });

  it("should emit NewOwnerSet event", async function () {
    const { owner, user1, upgradedProxy } = await loadFixture(
      upgradeContractAndSetVariables
    );
    const response = await upgradedProxy
      .connect(owner)
      .setNewOwner(user1.address);
    const receipt = await response.wait();
    const topic = upgradedProxy.interface.getEventTopic("NewOwnerSet");
    const log = receipt.logs.find((x) => x.topics.indexOf(topic) >= 0);
    deployedEvent = upgradedProxy.interface.parseLog(log);
    assert(deployedEvent, "Expected a NewOwnerSet event to be emitted!");
  });
});
