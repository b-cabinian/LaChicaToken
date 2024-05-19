// The following tests were taken from from the following link, with minor modifications:
// https://medium.com/@kaishinaw/erc20-using-hardhat-a-comprehensive-guide-3211efba98d4

const { expect } = require('chai');
const { ethers } = require("hardhat");

// Start test block
describe('LaChicaToken', function () {
  before(async function () {
    this.WethToken = await ethers.getContractFactory('WETH');
    this.FunToken = await ethers.getContractFactory('LaChicaToken');
  });

  beforeEach(async function () {
    this.wethToken = await this.WethToken.deploy();
    await this.wethToken.waitForDeployment();
    
    this.funToken = await this.FunToken.deploy(this.wethToken.target);
    await this.funToken.waitForDeployment();

    this.decimals = await this.funToken.decimals();

    const signers = await ethers.getSigners();

    this.ownerAddress = signers[0].address;
    this.recipientAddress = signers[1].address;

    this.signerContract = this.funToken.connect(signers[1]);
    this.signerWethContract = this.wethToken.connect(signers[1]);
    //console.log(this.signerContract);
    //console.log(this.signerWethContract);
  });

  // Test cases
  it('Creates a token with a name', async function () {
    expect(await this.funToken.name()).to.exist;
    expect(await this.funToken.name()).to.equal('LaChicaToken');
  });

  it('Creates a token with a symbol', async function () {
    expect(await this.funToken.symbol()).to.exist;
    expect(await this.funToken.symbol()).to.equal('LCC');
  });

  it('Has a valid decimal', async function () {
    expect((await this.funToken.decimals()).toString()).to.equal('18');
  })

  it('Has a valid total supply', async function () {
    const expectedSupply = ethers.parseUnits('1000000', this.decimals);
    expect((await this.funToken.totalSupply()).toString()).to.equal(expectedSupply);
  });

  it('Is able to query account balances', async function () {
    const ownerBalance = await this.funToken.balanceOf(this.ownerAddress);
    expect(await this.funToken.balanceOf(this.ownerAddress)).to.equal(ownerBalance);
  });

  it('Transfers the right amount of tokens to/from an account', async function () {
    const transferAmount = 1000;
    await expect(this.funToken.transfer(this.recipientAddress, transferAmount)).to.changeTokenBalances(
        this.funToken,
        [this.ownerAddress, this.recipientAddress],
        [-transferAmount, transferAmount]
      );
  });

  it('Emits a transfer event with the right arguments', async function () {
    const transferAmount = 100000;
    await expect(this.funToken.transfer(this.recipientAddress, ethers.parseUnits(transferAmount.toString(), this.decimals)))
        .to.emit(this.funToken, "Transfer")
        .withArgs(this.ownerAddress, this.recipientAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
  });

  it('Allows for allowance approvals and queries', async function () {
    const approveAmount = 10000;
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(approveAmount.toString(), this.decimals));
    expect((await this.funToken.allowance(this.recipientAddress, this.ownerAddress))).to.equal(ethers.parseUnits(approveAmount.toString(), this.decimals));
  });

  it('Emits an approval event with the right arguments', async function () {
    const approveAmount = 10000;
    await expect(this.signerContract.approve(this.ownerAddress, ethers.parseUnits(approveAmount.toString(), this.decimals)))
        .to.emit(this.funToken, "Approval")
        .withArgs(this.recipientAddress, this.ownerAddress, ethers.parseUnits(approveAmount.toString(), this.decimals))
  }); 

  it('Allows an approved spender to transfer from owner', async function () {
    const transferAmount = 10000;
    await this.funToken.transfer(this.recipientAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
    await expect(this.funToken.transferFrom(this.recipientAddress, this.ownerAddress, transferAmount)).to.changeTokenBalances(
        this.funToken,
        [this.ownerAddress, this.recipientAddress],
        [transferAmount, -transferAmount]
      );
  });

  it('Emits a transfer event with the right arguments when conducting an approved transfer', async function () {
    const transferAmount = 10000;
    await this.funToken.transfer(this.recipientAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
    await expect(this.funToken.transferFrom(this.recipientAddress, this.ownerAddress, ethers.parseUnits(transferAmount.toString(), this.decimals)))
        .to.emit(this.funToken, "Transfer")
        .withArgs(this.recipientAddress, this.ownerAddress, ethers.parseUnits(transferAmount.toString(), this.decimals))
  });

  it('Allows allowance to be increased and queried', async function () {
    const initialAmount = 100;
    const incrementAmount = 10000;
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(initialAmount.toString(), this.decimals))
    const previousAllowance = await this.funToken.allowance(this.recipientAddress, this.ownerAddress);
    await this.signerContract.increaseAllowance(this.ownerAddress, ethers.parseUnits(incrementAmount.toString(), this.decimals));
    const expectedAllowance = BigInt(previousAllowance) + (BigInt(ethers.parseUnits(incrementAmount.toString(), this.decimals)))
    expect((await this.funToken.allowance(this.recipientAddress, this.ownerAddress))).to.equal(expectedAllowance);
  });

  it('Emits approval event when alllowance is increased', async function () {
    const incrementAmount = 10000;
    await expect(this.signerContract.increaseAllowance(this.ownerAddress, ethers.parseUnits(incrementAmount.toString(), this.decimals)))
        .to.emit(this.funToken, "Approval")
        .withArgs(this.recipientAddress, this.ownerAddress, ethers.parseUnits(incrementAmount.toString(), this.decimals))
  });

  it('Allows allowance to be decreased and queried', async function () {
    const initialAmount = 100;
    const decrementAmount = 10;
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(initialAmount.toString(), this.decimals))
    const previousAllowance = await this.funToken.allowance(this.recipientAddress, this.ownerAddress);
    await this.signerContract.decreaseAllowance(this.ownerAddress, ethers.parseUnits(decrementAmount.toString(), this.decimals));
    const expectedAllowance = BigInt(previousAllowance) - BigInt(ethers.parseUnits(decrementAmount.toString(), this.decimals))
    expect((await this.funToken.allowance(this.recipientAddress, this.ownerAddress))).to.equal(expectedAllowance);
  });

  it('Emits approval event when alllowance is decreased', async function () {
    const initialAmount = 100;
    const decrementAmount = 10;
    await this.signerContract.approve(this.ownerAddress, ethers.parseUnits(initialAmount.toString(), this.decimals))
    const expectedAllowance = BigInt(ethers.parseUnits(initialAmount.toString(), this.decimals)) - BigInt(ethers.parseUnits(decrementAmount.toString(), this.decimals))
    await expect(this.signerContract.decreaseAllowance(this.ownerAddress, ethers.parseUnits(decrementAmount.toString(), this.decimals)))
        .to.emit(this.funToken, "Approval")
        .withArgs(this.recipientAddress, this.ownerAddress, expectedAllowance)
  });

  it ('Exchange rate works as intended', async function () {
    const val = 1000;
    const conv = val * 100;
    expect(await this.funToken.etherExchangeRate(val)).to.equal(conv);
  });

  it ('Error when no ether sent to buy tokens', async function () {
    await expect(this.signerContract.buyTokensUsingEther({value: 0})).to.be.revertedWith("You must send some ether");
  });

  it ('Total supply increases when tokens are bought with Ether', async function () {
    const cost = 10;
    const newSupply = await this.signerContract.etherExchangeRate(cost);
    const expectedSupply = BigInt(ethers.parseUnits('1000000', this.decimals)) + newSupply;
    await this.signerContract.buyTokensUsingEther({value: cost});
    expect((await this.funToken.totalSupply()).toString()).to.equal(expectedSupply);
  });

  it ('Spender has LaChicaToken balance after buying with Ether', async function () {
    const cost = 10;
    const newSupply = await this.signerContract.etherExchangeRate(cost);
    const curBalance = await this.funToken.balanceOf(this.recipientAddress);
    const expectedBalance = curBalance + newSupply;
    await this.signerContract.buyTokensUsingEther({value: cost});
    expect((await this.funToken.balanceOf(this.recipientAddress)).toString()).to.equal(expectedBalance);
  });

  it ('LaChicaToken contract owns ether after someone buys with ether', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    expect(await ethers.provider.getBalance(this.funToken.target)).to.equal(cost);
  });

  it ('Error when no WETH sent to purchase tokens', async function () {
    await expect(this.signerContract.buyTokensUsingWETH(0)).to.be.revertedWith("You must send some WETH");
  });

  it ('Total supply increases when tokens are bought with WETH', async function () {
    const cost = 10;
    const newSupply = await this.signerContract.etherExchangeRate(cost);
    const expectedSupply = BigInt(ethers.parseUnits('1000000', this.decimals)) + newSupply;
    //console.log(this.signerContract);
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost)
    await this.signerContract.buyTokensUsingWETH(cost);
    expect((await this.funToken.totalSupply()).toString()).to.equal(expectedSupply);
  });

  it ('Spender has LaChicaToken balance after buying with WETH', async function () {
    const cost = 10;
    const newSupply = await this.signerContract.etherExchangeRate(cost);
    const curBalance = await this.funToken.balanceOf(this.recipientAddress);
    const expectedBalance = curBalance + newSupply;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost)
    await this.signerContract.buyTokensUsingWETH(cost);
    expect((await this.funToken.balanceOf(this.recipientAddress)).toString()).to.equal(expectedBalance);
  });

    it ('LaChicaToken contract owns WETH after someone buys with WETH', async function () {
    const cost = 10;
    const newSupply = await this.signerContract.etherExchangeRate(cost);
    const curBalance = await this.funToken.balanceOf(this.recipientAddress);
    const expectedBalance = curBalance + newSupply;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    expect(await this.wethToken.balanceOf(this.funToken.target)).to.equal(cost);
  });


  it ('Non owner of LaChicaToken tries to withdraw Ether', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await expect(this.signerContract.withdrawEther(cost)).to.be.revertedWith("Only owner can execute this function");
  });

  it ('Ether withdrawal amount too large', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await expect(this.funToken.withdrawEther(20)).to.be.revertedWith("Insufficient ether balance");
  });

  it ('Check ether balance on LaChica contract after withdrawing ether', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await this.funToken.withdrawEther(cost);
    expect(await ethers.provider.getBalance(this.funToken.target)).to.equal(0);
  });

  it ('Check ether balance on owner address after withdrawing ether', async function () {
    const cost = 10n;
    await this.signerContract.buyTokensUsingEther({value: cost});
    const curEtherBalance = await ethers.provider.getBalance(this.ownerAddress);
    
    const tx = await this.funToken.withdrawEther(cost);
    const receipt = await tx.wait();
    const gasUsed = BigInt(receipt.cumulativeGasUsed) * BigInt(receipt.gasPrice);
    const expectedBalance = curEtherBalance + cost - gasUsed;

    expect(await ethers.provider.getBalance(this.ownerAddress)).to.equal(expectedBalance);
  });

  it ('Non owner of LaChicaToken tries to withdraw WETH', async function () {
    const cost = 10;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    await expect(this.signerContract.withdrawWETH(cost)).to.be.revertedWith("Only owner can execute this function");
  });

  it ('WETH withdrawal amount too large', async function () {
    const cost = 10;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    await expect(this.funToken.withdrawWETH(20)).to.be.revertedWith("Sender balance too low");
  });

  //more WETH for contract owner
  it ('Check WETH balance for LaChica contract after withdrawing WETH', async function () {
    const cost = 10;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    await this.funToken.withdrawWETH(cost);
    expect(await this.wethToken.balanceOf(this.funToken.target)).to.equal(0);
  });

  it ('Check WETH balance for owner address after withdrawing WETH', async function () {
    const cost = 10;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    await this.funToken.withdrawWETH(cost);
    expect(await this.wethToken.balanceOf(this.ownerAddress)).to.equal(cost);
  });


  it ('Non owner of LaChicaToken tries to withdraw Ether, ownerWithdraw', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await expect(this.signerContract.ownerWithdraw(cost, '0x45')).to.be.revertedWith("Only owner can execute this function");
  });


  it ('Ether withdrawal amount too large, ownerWithdraw', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await expect(this.funToken.ownerWithdraw(20, '0x45')).to.be.revertedWith("Insufficient ether balance");
  });

  it ('WETH withdrawal amount too large, ownerWithdraw', async function () {
    const cost = 10;
    await this.signerWethContract.deposit({value : (cost + 2)});
    await this.signerWethContract.approve(this.signerContract, cost);
    await this.signerContract.buyTokensUsingWETH(cost);
    await expect(this.funToken.ownerWithdraw(20, '0x57')).to.be.revertedWith("Sender balance too low");
  });

  it ('withdraw with wrong moneyType', async function () {
    const cost = 10;
    await this.signerContract.buyTokensUsingEther({value: cost});
    await expect(this.funToken.ownerWithdraw(20, '0x46')).to.be.revertedWith("You can only withdraw [E]ther or [W]ETH.");
  });


});