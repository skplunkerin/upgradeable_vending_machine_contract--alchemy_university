// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract VendingMachineV2 is Initializable {
  // these state variables and their values will be preserved forever,
  // regardless of contract upgrades.
  uint public numSodas;
  address public owner;
  mapping(address => uint) public purchasedSodas;

  function initialize(uint _numSodas) public initializer {
    numSodas = _numSodas;
    owner = msg.sender;
  }

  event SodaPurchased(address _customer);

  function purchaseSoda() public payable inStock {
    require(msg.value >= 1000 wei, "You must pay 1000 wei for a soda!");
    numSodas--;
    purchasedSodas[msg.sender]++;
    emit SodaPurchased(msg.sender);
  }

  modifier inStock() {
    require(numSodas > 0, "There are no more sodas to buy!");
    _;
  }

  function withdrawProfits() public onlyOwner {
    require(
      address(this).balance > 0,
      "Profits must be greater than 0 in order to withdraw!"
    );
    (bool sent, ) = owner.call{value: address(this).balance}("");
    require(sent, "Failed to send ether to owner");
  }

  event NewOwnerSet(address _owner, address _newOwner);

  function setNewOwner(address _newOwner) public onlyOwner {
    owner = _newOwner;
    emit NewOwnerSet(owner, _newOwner);
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this function.");
    _;
  }
}
