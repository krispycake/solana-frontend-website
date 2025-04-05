import { Transaction } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';

export const getMintDecimals = async (connection, mintPubkey) => {
  const mintInfo = await splToken.getMint(connection, mintPubkey);
  return mintInfo.decimals;
};

export const createAndSignTransaction = async (wallet, connection, instructions) => {
  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  return await wallet.signTransaction(transaction);
};

export const handleTransaction = async (signature, type, details, addTransaction) => {
  try {
    await addTransaction(signature, type, details);
    return true;
  } catch (error) {
    console.error(`Error in ${type}:`, error);
    return false;
  }
};
