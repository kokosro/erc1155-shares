# Objets selling

## Requirements

Smart contract that will be used to sell an asset to multiple parties.

More specifically, the contract needs to allow anyone to set up an object with a fixed "price" that other users can then "purchase" stakes in. Once a purchase is initiated, the owner of the object receives funds, while the buyer gets stakes. The stakes are stored in the contract and are not transferable further.

contract enhancement:  making the stakes indefinitely transferable.
All transactions need to be traceable and obtainable by a single call.
The minimum transferable stake at any point needs to be equal to the number of previous transfers the stake endured;

i.e., if the stake was previously transferred two times already then currently it can only be transferred if the owner has 2% or more of stakes in the entire asset.

## Deploy

- clone repo
- run `npm install`
- create a `.env` file

example of `.env` contents
```text
NETWORK=development
ACCOUNT_MNEMONIC=twelve word bip39 mnemonic
PROVIDER_HTTP=http://localhost:8545
ACCOUNTS_COUNT=10
ETHERSCAN_API_KEY=changeme
MAX_GAS_PRICE=30000000000
MAX_PRIORITY_FEE_PER_GAS=30000000000
```

- `npm run deploy`

## Test

Start ganache server

```bash
npm run ganache
```

Leave ganache running and on a new terminal

```bash
npm test
```
