import * as React from 'react';
import { useEffect, useState } from "react";

import styled from 'styled-components';

import Web3Modal from 'web3modal';
// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider';
import Column from './components/Column';
import Wrapper from './components/Wrapper';
import Header from './components/Header';
import Loader from './components/Loader';
import ConnectButton from './components/ConnectButton';

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

let web3Modal: Web3Modal;
const App = () => {

  const [provider, setProvider] = useState<any>();
  const [fetching, setFetching] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [library, setLibrary] = useState<any>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number>(1);
  const [pendingRequest, setPedningRequest] = useState<boolean>(false);
  const [result, setResult] = useState<any>();
  const [libraryContract, setLibraryContract] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    createWeb3Modal();
    
    if (web3Modal.cachedProvider) {
      onConnect();
    }

  }, []);

  function createWeb3Modal() {
    web3Modal = new Web3Modal({
      network: getNetwork(),
      cacheProvider: true,
      providerOptions: getProviderOptions()
    })
  }

  const onConnect = async () => {
    const provider = await web3Modal.connect();
    setProvider(provider);

    const library = new Web3Provider(provider);

    const network = await library.getNetwork();

    const address = provider.selectedAddress ? provider.selectedAddress : provider?.accounts[0];
    setLibrary(library);
    setChainId(network.chainId);
    setAddress(address);
    setConnected(true);
    
    await subscribeToProviderEvents(provider);
  };

  const subscribeToProviderEvents = async (provider:any) => {
    if (!provider.on) {
      return;
    }

    provider.on("accountsChanged", changedAccount);
    provider.on("networkChanged", networkChanged);
    provider.on("close", resetApp);

    await web3Modal.off('accountsChanged');
  };

  const unSubscribe = async (provider:any) => {
    // Workaround for metamask widget > 9.0.3 (provider.off is undefined);
    window.location.reload(false);
    if (!provider.off) {
      return;
    }

    provider.off("accountsChanged", changedAccount);
    provider.off("networkChanged", networkChanged);
    provider.off("close", resetApp);
  }

  const changedAccount = async (accounts: string[]) => {
    if(!accounts.length) {
      // Metamask Lock fire an empty accounts array 
      await resetApp();
    } else {
      setAddress(accounts[0]);
    }
  }

  const networkChanged = async (networkId: number) => {
    const library = new Web3Provider(provider);
    const network = await library.getNetwork();
    const chainId = network.chainId;
    setChainId(chainId);
    setLibrary(library);
  }

  function getNetwork() {
    return getChainData(chainId).network;
  }

  function getProviderOptions() {
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

  const resetApp = async () => {
    
    await web3Modal.clearCachedProvider();
    localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    localStorage.removeItem("walletconnect");
    await unSubscribe(provider);

  };

  const resetState = () => {
    setFetching(false);
    setAddress("");
    setLibrary(null);
    setConnected(false);
    setChainId(1);
    setPedningRequest(false);
    setResult(null);
    setLibraryContract(null);
    setInfo(null);
  }

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header
          connected={connected}
          address={address}
          chainId={chainId}
          killSession={resetApp}
        />
        <SContent>
          {fetching ? (
            <Column center>
              <SContainer>
                <Loader />
              </SContainer>
            </Column>
          ) : (
              <SLanding center>
                {!connected && <ConnectButton onClick={onConnect} />}
              </SLanding>
            )}
        </SContent>
      </Column>
    </SLayout>
  );
}
export default App;
