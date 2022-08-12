const { ethers, waffle } = require('hardhat');
const chai = require('chai');

chai.use(waffle.solidity); // used for testing emitted events

const { expect } = chai;

describe('AssetMarket', async () => {
  let owner;
  let otherAccounts;
  let AssetMarket;
  let assetMarket;
  before(async () => {
    [owner, ...otherAccounts] = await ethers.getSigners();
    AssetMarket = await ethers.getContractFactory('AssetMarket');
  });
  beforeEach(async () => {
    assetMarket = await AssetMarket.deploy();
  });
  it('should revert when creating an asset without a price', async () => {
    const price = ethers.utils.parseUnits('0', 18);
    await expect(assetMarket.createAsset(price)).revertedWith('price must be set');
  });
  it('should create asset', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);

    const assetInfo = await assetMarket.asset(1);
    expect(assetInfo.price).to.equal(price);
    expect(assetInfo.owner).to.equal(owner.address);
    expect(assetInfo.totalSupply).to.equal(0);
    expect(assetInfo.transferEnabled).to.equal(false);

    const assetsOf = await assetMarket.assetsOf(owner.address);
    expect(assetsOf.length).to.equal(1);
    expect(assetsOf[0]).to.equal(1);
  });
  it('should revert when buying stakes in an asset with zero transaction value', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    await expect(assetMarket.connect(otherAccounts[0]).buy(1, { value: 0 })).revertedWith('not enough payment');
  });
  it('should buy stakes in an asset', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    const balanceOfAssetOwnerBeforeBuy = await owner.getBalance();
    await assetMarket.connect(otherAccounts[0]).buy(1, { value: price.mul(2) });
    const balanceOfAssetOwnerAfterBuy = await owner.getBalance();
    const balanceOfStakes = await assetMarket.balanceOf(otherAccounts[0].address, 1);
    expect(balanceOfStakes).to.equal(2);
    expect(balanceOfAssetOwnerAfterBuy).to.equal(balanceOfAssetOwnerBeforeBuy.add(price.mul(2)));
  });
  it('should not allow stakes transfers when asset stakes transfers are not enabled', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    const transferredStakes = 1;
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    await assetMarket.connect(otherAccounts[0]).buy(1, { value: price.mul(2) });
    await expect(assetMarket.connect(otherAccounts[0]).safeTransferFrom(
      otherAccounts[0].address,
      otherAccounts[1].address,
      1,
      transferredStakes,
      [],
    )).revertedWith('asset transfers paused');
  });

  it('should enable transfer per asset', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);

    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    await expect(assetMarket.enableTransfers(1, true)).to.emit(assetMarket, 'TransfersStatusChange')
      .withArgs(1, true);
    const asset = await assetMarket.asset(1);
    expect(asset.transferEnabled).to.equal(true);
  });

  it('should transfer stakes', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    const transferredStakes = 1;
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    await assetMarket.connect(otherAccounts[0]).buy(1, { value: price.mul(2) });
    await assetMarket.enableTransfers(1, true);
    const balanceOf1BeforeTransfer = await assetMarket.balanceOf(otherAccounts[0].address, 1);
    const balanceOf2BeforeTransfer = await assetMarket.balanceOf(otherAccounts[1].address, 1);
    await assetMarket.connect(otherAccounts[0]).safeTransferFrom(otherAccounts[0].address, otherAccounts[1].address, 1, transferredStakes, []);
    const balanceOf1AfterTransfer = await assetMarket.balanceOf(otherAccounts[0].address, 1);
    const balanceOf2AfterTransfer = await assetMarket.balanceOf(otherAccounts[1].address, 1);
    expect(balanceOf1AfterTransfer).to.equal(balanceOf1BeforeTransfer.sub(transferredStakes));
    expect(balanceOf2AfterTransfer).to.equal(balanceOf2BeforeTransfer.add(transferredStakes));
    const minimumRequiredTransferAmountU1 = await assetMarket.minimumRequiredTransfer(otherAccounts[0].address, 1);
    expect(minimumRequiredTransferAmountU1).to.equal(1);
    const minimumRequiredTransferAmountU2 = await assetMarket.minimumRequiredTransfer(otherAccounts[1].address, 1);
    expect(minimumRequiredTransferAmountU2).to.equal(0);
  });

  it('should revert when minimum required balance of account that transfers is not met', async () => {
    const price = ethers.utils.parseUnits('0.001', 18);
    const transferredStakes = 1;
    await expect(assetMarket.createAsset(price)).to.emit(assetMarket, 'AssetCreated')
      .withArgs(1, price, owner.address);
    await assetMarket.connect(otherAccounts[0]).buy(1, { value: price.mul(5) });
    await assetMarket.enableTransfers(1, true);
    const balanceOf1BeforeTransfer = await assetMarket.balanceOf(otherAccounts[0].address, 1);
    const balanceOf2BeforeTransfer = await assetMarket.balanceOf(otherAccounts[1].address, 1);
    await assetMarket.connect(otherAccounts[0]).safeTransferFrom(otherAccounts[0].address, otherAccounts[1].address, 1, transferredStakes, []);
    const balanceOf1AfterTransfer = await assetMarket.balanceOf(otherAccounts[0].address, 1);
    const balanceOf2AfterTransfer = await assetMarket.balanceOf(otherAccounts[1].address, 1);
    expect(balanceOf1AfterTransfer).to.equal(balanceOf1BeforeTransfer.sub(transferredStakes));
    expect(balanceOf2AfterTransfer).to.equal(balanceOf2BeforeTransfer.add(transferredStakes));

    let minimumRequiredTransferAmount = await assetMarket.minimumRequiredTransfer(otherAccounts[0].address, 1);

    expect(minimumRequiredTransferAmount).to.equal(1);
    await assetMarket.connect(otherAccounts[0]).safeTransferFrom(
      otherAccounts[0].address,
      otherAccounts[1].address,
      1,
      transferredStakes,
      [],
    );

    minimumRequiredTransferAmount = await assetMarket.minimumRequiredTransfer(otherAccounts[0].address, 1);

    expect(minimumRequiredTransferAmount).to.equal(2);

    await expect(assetMarket.connect(otherAccounts[0]).safeTransferFrom(
      otherAccounts[0].address,
      otherAccounts[1].address,
      1,
      transferredStakes,
      [],
    )).revertedWith('minimum required transfer amount not met');
  });
});
