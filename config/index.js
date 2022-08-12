require('dotenv').config();
const convict = require('convict');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const lowerCaseString = {
  name: 'lowercase-string',
  validate: (val) => true,
  coerce: (val) => val.toLowerCase(),
};

const accountsFromMnemonic = (mnemonic = ethers.Wallet.createRandom().mnemonic.phrase, count = 1) => {
  const addressesKeys = [];
  for (let i = 0; i < count; i++) {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);

    addressesKeys.push(`${wallet.privateKey}`);
  }

  return addressesKeys.filter((x) => !!x);
};

convict.addFormat(lowerCaseString);

const config = convict({
  network: {
    name: {
      format: 'lowercase-string',
      default: 'development',
      env: 'NETWORK',
    },
    providerHttp: {
      format: String,
      default: 'http://localhost:8545',
      env: 'PROVIDER_HTTP',
    },
    mnemonic: {
      format: String,
      default: null,
      env: 'ACCOUNT_MNEMONIC',
    },
    accountsCount: {
      format: 'nat',
      default: 10,
      env: 'ACCOUNTS_COUNT',
    },
    providerHttpHardhat: {
      format: String,
      default: 'http://localhost:8545',
      env: 'PROVIDER_HTTP_TEST',
    },
    hardhatTestBlock: {
      format: String,
      default: '0',
      env: 'TEST_BLOCK',
    },
  },
  etherscan: {
    apiKey: {
      format: String,
      default: 'none',
      env: 'ETHERSCAN_API_KEY',
    },
  },
  gasPrice: {
    maxGasPrice: {
      format: String,
      default: '3000000000000000',
      env: 'MAX_GAS_PRICE',

    },
    maxPriorityFeePerGas: {
      format: String,
      default: '3000000000000000',
      env: 'MAX_PRIORITY_FEE_PER_GAS',
    },
  },
});

config.validate({ allowed: 'strict' });

config.isHardhat = () => config.get('network.name') == 'hardhat';

config.set('network.accounts', accountsFromMnemonic(config.get('network.mnemonic'), config.get('network.accountsCount')));

module.exports = config;
