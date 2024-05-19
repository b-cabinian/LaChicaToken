// contracts/LaChicaToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

// solhint-enable

interface WETHInterface{
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function approve(address guy, uint wad) external returns (bool);
}

contract LaChicaToken is ERC20 {

    // Define the supply of LaChicaToken: 1,000,000 
    uint256 constant initialSupply = 1000000 * (10**18);
    WETHInterface WETHContract;
    address mgOwner;

    // Constructor will be called on contract creation
    constructor(address _wethContract) ERC20("LaChicaToken", "LCC") {
        _mint(msg.sender, initialSupply);
        WETHContract = WETHInterface(_wethContract);
        mgOwner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == mgOwner, "Only owner can execute this function");
        _;
    }

    // The code for increaseAllowance and decreaseAllowance was taken from the following link:
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol


     /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }


    function etherExchangeRate(uint256 amountOfEtherOrWETH) external pure returns (uint256) {
        return _etherExchangeRate(amountOfEtherOrWETH);
    }

    function _etherExchangeRate(uint256 amountOfEtherOrWETH) internal pure returns (uint256) {
        return amountOfEtherOrWETH * 100;
    }

    function buyTokensUsingEther() external payable {
        require(msg.value > 0, "You must send some ether");
        _mint(msg.sender, _etherExchangeRate(msg.value));
    }

    function buyTokensUsingWETH(uint256 amountOfWETH) external {
        require(amountOfWETH > 0, "You must send some WETH");
        //transferFrom(msg.sender, address(this), amountOfWETH);
        WETHContract.transferFrom(msg.sender, address(this), amountOfWETH);
        _mint(msg.sender, _etherExchangeRate(amountOfWETH));
    }

    function withdrawEther(uint256 wad) public onlyOwner {
        require(address(this).balance >= wad, "Insufficient ether balance");
        payable(msg.sender).transfer(wad);
    }

    function withdrawWETH(uint256 wad) public onlyOwner {
        WETHContract.approve(address(this), wad);
        WETHContract.transferFrom(address(this), msg.sender, wad);
    }

    
    function ownerWithdraw(uint256 wad, bytes1 moneyType) external onlyOwner {
        require((moneyType == 0x45) || (moneyType == 0x57), "You can only withdraw [E]ther or [W]ETH.");
        
        if (moneyType == 0x45) {
            withdrawEther(wad);
        }
        else if (moneyType == 0x57) {
            withdrawWETH(wad);
        }
        
    }

}