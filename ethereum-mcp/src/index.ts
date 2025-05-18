import 'dotenv/config';
import axios from 'axios';
import { ethers } from 'ethers';

const RPC_URL = process.env.ETHEREUM_RPC_URL || '';
const MNEMONIC = process.env.SEED_PHRASE || '';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC).connect(provider);

export async function getBalance(address: string) {
  const bal = await provider.getBalance(address);
  return ethers.formatEther(bal);
}

export async function getTransaction(hash: string) {
  return provider.getTransaction(hash);
}

export async function swapToken(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: number
) {
  const oneInchApiKey = process.env.ONEINCH_API_KEY || '';
  const fromAddress = await wallet.getAddress();
  const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true&apikey=${oneInchApiKey}`;
  const { data } = await axios.get(url);
  const tx = data.tx;
  const txResponse = await wallet.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value ? ethers.toBigInt(tx.value) : 0n,
    gasLimit: tx.gas,
    maxFeePerGas: tx.gasPrice,
  });
  return await txResponse.wait();
}

export async function stakeEthWithLido(amount: string) {
  const LIDO_CONTRACT = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
  const tx = await wallet.sendTransaction({
    to: LIDO_CONTRACT,
    value: ethers.parseEther(amount),
  });
  return await tx.wait();
}

if (require.main === module) {
  (async () => {
    const addr = await wallet.getAddress();
    const bal = await getBalance(addr);
    console.log(`Wallet: ${addr} - Balance: ${bal} ETH`);
  })();
}
