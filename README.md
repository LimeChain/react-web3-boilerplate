# Web3 Boilerplate

Web3 Boilerplate is an easy-to-use starting project to help developers add support for multiple providers in their apps with a simple customizable configuration and use ethers for contract interactions.

- [web3modal](https://github.com/Web3Modal/web3modal/)
- [ethers](https://docs.ethers.io/v5/)

## Usage

1. Install packages

```bash
npm install

# OR

yarn add web3modal
```

2. Start the app

```bash
npm run start

# OR

yarn start
```

## Contract interaction tips
- create ethers Web3Provider from the web3modal provider;
```
...
import { Web3Provider } from '@ethersproject/providers';
...
const provider = await this.web3Modal.connect();
const library = new Web3Provider(provider);
...
```
- get ethers contract instance(check `ethers.ts` within `./helpers` folder);
- use contract instance to interact with the contract - check `currentLeader`, `submitElectionResult` and `endElection`;