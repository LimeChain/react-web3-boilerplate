import { getAddress } from '@ethersproject/address';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';

export function isAddress(value: string) {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

export function getSigner(library: any, account: any) {
  return library.getSigner(account).connectUnchecked();
}

export function getProviderOrSigner(library: any, account: any) {
  return account ? getSigner(library, account) : library;
}

export function getContract(address: string, ABI: any, library: any, account: any) {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account));
}
