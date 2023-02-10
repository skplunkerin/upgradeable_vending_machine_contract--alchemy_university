const { expect } = require("chai");

describe("UpgradingV1ToV2", function () {
  it("should upgrade from v1 to v2", async function () {
    const [user] = await ethers.getSigners();
    const VendingMachineV1 = await ethers.getContractFactory(
      "VendingMachineV1"
    );
    const VendingMachineV2 = await ethers.getContractFactory(
      "VendingMachineV2"
    );
    const proxy = await upgrades.deployProxy(VendingMachineV1, [100]);
    const v1Address = await upgrades.erc1967.getImplementationAddress(
      proxy.address
    );
    await proxy.deployed();

    // should start with the 100 sodas
    expect(await proxy.numSodas()).to.equal(100);
    // should decrement after a soda purchase
    await proxy
      .connect(user)
      .purchaseSoda({ value: ethers.utils.parseUnits("1000", "wei") });
    expect(await proxy.numSodas()).to.equal(99);

    const upgraded = await upgrades.upgradeProxy(
      proxy.address,
      VendingMachineV2
    );
    // should still equal 99 sodas
    expect(await upgraded.numSodas()).to.equal(99);

    // the implementation address should have changed
    const v2Address = await upgrades.erc1967.getImplementationAddress(
      proxy.address
    );
    expect(v1Address).to.not.equal(v2Address);
  });
});
