const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

const TokenModule = buildModule("LaChicaTokenModule", (m) => {
  const token = m.contract("LaChicaToken", [ethers.getAddress("0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9")]);

  return { token };
});

module.exports = TokenModule;