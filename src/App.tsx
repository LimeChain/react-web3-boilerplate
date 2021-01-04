import * as React from 'react';
import styled from 'styled-components';

import Web3Modal from 'web3modal';
// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
import Button from './components/Button';
import Column from './components/Column';
import Wrapper from './components/Wrapper';
import Header from './components/Header';
import Loader from './components/Loader';
import ConnectButton from './components/ConnectButton';

import { fonts } from './styles';
import {
  US_ELECTION_ROPSTEN_ADDRESS
} from './constants';
import { getContract } from './helpers/ethers';
import US_ELECTION from './constants/abis/USElection.json';
import { logMsg } from './helpers/dev';
import { Web3Provider } from '@ethersproject/providers';
import { getChainData } from './helpers/utilities';

const SLayout = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

// @ts-ignore
const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

const STestButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const STestButton = styled(Button)`
  border-radius: 8px;
  font-size: ${ fonts.size.medium };
  height: 44px;
  width: 100%;
  max-width: 175px;
  margin: 12px;
`;

interface IAppState {
  fetching: boolean;
  address: string;
  provider: any;
  library: any;
  connected: boolean;
  chainId: number;
  pendingRequest: boolean;
  result: any | null;
  electionContract: any | null;
  info: any | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: '',
  provider: null,
  library: null,
  connected: false,
  chainId: 1,
  pendingRequest: false,
  result: null,
  electionContract: null,
  info: null
};

class App extends React.Component<any, any> {
  // @ts-ignore
  public web3Modal: Web3Modal;
  public state: IAppState;

  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE
    };

    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: true,
      providerOptions: this.getProviderOptions()
    });
  }

  public componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  }

  public onConnect = async () => {
    const provider = await this.web3Modal.connect();

    await this.subscribeProvider(provider);

    const library = new Web3Provider(provider);
    const network = await library.getNetwork();

    const address = provider.selectedAddress ? provider.selectedAddress : provider?.accounts[0];

    const electionContract = getContract(US_ELECTION_ROPSTEN_ADDRESS, US_ELECTION.abi, library, address);

    await this.setState({
      provider,
      library,
      chainId: network.chainId,
      address,
      connected: true,
      electionContract
    });
  };

  public subscribeProvider = async (provider: any) => {
    if (!provider.on) {
      return;
    }
    provider.on("close", () => this.resetApp());
    provider.on("accountsChanged", async (accounts: string[]) => {
      await this.setState({ address: accounts[0] });
    });

    provider.on("networkChanged", async (networkId: number) => {
      const library = new Web3Provider(provider);
      const network = await library.getNetwork();
      const chainId = network.chainId;

      await this.setState({ chainId, library });
    });
  };

  public currentLeader = async () => {
    const { electionContract } = this.state;

    if (!electionContract) {
      return;
    }

    const currentLeader = await electionContract.currentLeader();
    logMsg('Current leader: ', currentLeader);

    await this.setState({ info: { message: `Current Leader: ${ currentLeader }`, link: '#' } });
  };

  public submitElectionResult = async () => {
    const { electionContract } = this.state;

    if (!electionContract) {
      return;
    }

    const dataArr = [
      'Dupnitsa',
      1,
      50,
      24
    ];

    try {
      await this.setState({ fetching: true });
      const transaction = await electionContract.submitStateResult(dataArr);

      logMsg(`Wait for the transaction... State Result Submission Transaction: ${ transaction.hash }`);

      const {chainId} = this.state;
      const chainData = chainId ? getChainData(chainId) : null;
      await this.setState({ info: { message: `Etherscan tx: ${transaction.hash}`, link: `${chainData.explorer}/tx/${transaction.hash}` } });

      const transactionReceipt = await transaction.wait();
      if (transactionReceipt.status !== 1) {
        logMsg('Transaction was not successful');
      }

      await this.setState({ fetching: false });
    } catch (e) {
      await this.setState({ fetching: false });
      await this.setState({ info: { message: e, link: '#' } });
    }
  };

  public endElection = async () => {
    const { electionContract } = this.state;

    if (!electionContract) {
      return;
    }

    try {
      await this.setState({ fetching: true });

      const endTransaction = await electionContract.endElection();
      logMsg('End Transaction: ', endTransaction.hash);

      const endTransactionReceipt = await endTransaction.wait();
      if (endTransactionReceipt.status !== 1) {
        logMsg('Transaction was not successful');
      }
      await this.setState({ info: { message: `Etherscan tx: ${endTransaction.hash}`, link: `${endTransaction.explorer}/tx/${endTransaction.hash}` } });

      await this.setState({ fetching: false });
    } catch (e) {
      await this.setState({ fetching: false });
      await this.setState({ info: { message: e, link: '#' } });
    }
  };

  public getNetwork = () => getChainData(this.state.chainId).network;

  public getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID
        }
      }
    };
    return providerOptions;
  };

  public resetApp = async () => {
    await this.web3Modal.clearCachedProvider();
    this.setState({ ...INITIAL_STATE });
  };

  public render = () => {
    const {
      address,
      connected,
      chainId,
      fetching,
      electionContract,
      info
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={ 1000 } spanHeight>
          <Header
            connected={ connected }
            address={ address }
            chainId={ chainId }
            killSession={ this.resetApp }
          />
          <SContent>
            { fetching ? (
              <Column center>
                <SContainer>
                  <Loader/>
                </SContainer>
              </Column>
            ) : electionContract && connected ? (
              <SBalances>
                <h3>Contract Actions</h3>
                <Column center>
                  <STestButtonContainer>
                    <STestButton left onClick={ this.currentLeader }>
                      Current Leader
                    </STestButton>

                    <STestButton left onClick={ this.submitElectionResult }>
                      Submit Result
                    </STestButton>

                    <STestButton left onClick={ this.endElection }>
                      End election
                    </STestButton>
                  </STestButtonContainer>
                  { info !== null ? (<STestButtonContainer>
                    <a href={ info.link }
                       target="_blank">{ info.message }</a>
                  </STestButtonContainer>) : null }
                </Column>
              </SBalances>
            ) : (
              <SLanding center>
                <ConnectButton onClick={ this.onConnect }/>
              </SLanding>
            ) }
          </SContent>
        </Column>
      </SLayout>
    );
  };
}

export default App;
