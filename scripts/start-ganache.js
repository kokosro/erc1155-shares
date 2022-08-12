const ganache = require('ganache-cli');
const { ethers } = require('ethers');

const config = require('../config');

const GANACHE_PORT = parseInt(process.env.PORT || 8545);
const INITIAL_BALANCE = ethers.utils.parseUnits('10000000.0', 'ether').toHexString();

const generateAccounts = (count = 1) => {
  const privateKeys = config.get('network.accounts');

  const wallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = new ethers.Wallet(privateKeys[i]);
    wallets.push(wallet);
  }
  const accounts = wallets.map((wallet) => ({
    secretKey: wallet.privateKey,
    balance: INITIAL_BALANCE,
    address: wallet.address,
  }));

  console.log(`${accounts.map(({ address, secretKey }) => `${address}: ${secretKey}`).join('\n')}`);
  return accounts;
};

const GANACHE_ACCOUNTS = generateAccounts(config.get('network.accountsCount'));

const startGanache = () => {
  const server = ganache.server({
    accounts: GANACHE_ACCOUNTS,
    logger: console,
    port: GANACHE_PORT,
    db_path: './ganache-db',
    default_balance_ether: 10000000,
  });

  server.listen(GANACHE_PORT, (err, blockchain) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Ganache blockchain started');
  });
};
startGanache();
