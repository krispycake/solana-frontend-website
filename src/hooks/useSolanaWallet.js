import { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { toast } from 'react-toastify';
import { getMintDecimals } from '../utils/solanaUtils';

export const useSolanaWallet = () => {
  const [wallet, setWallet] = useState(null); 
  const [publicKey, setPublicKey] = useState(null); 
  const [solBalance, setSolBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState({});
  const [activeTokens, setActiveTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  const updateBalances = async () => {
    if (!wallet || !publicKey) return; 

    try {
      setIsLoading(true);
      // Update SOL balance
      const solBalance = await connection.getBalance(publicKey); 
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      // Update token balances
      const updatedBalances = {};
      for (const token of activeTokens) {
        const mintPublicKey = new PublicKey(token.address);
        try {
          const tokenAccount = await splToken.getAssociatedTokenAddress(
            mintPublicKey,
            publicKey 
          );
          const accountInfo = await splToken.getAccount(connection, tokenAccount);
          const decimals = await getMintDecimals(connection, mintPublicKey);
          updatedBalances[token.address] = Number(accountInfo.amount) / Math.pow(10, decimals);
        } catch (e) {
          
          if (e.name === 'TokenAccountNotFoundError') {
              console.log(`Token account not found for ${token.symbol}, assuming balance 0.`);
              updatedBalances[token.address] = 0;
          } else {
              console.error(`Error fetching balance for ${token.symbol}:`, e);
              updatedBalances[token.address] = 0; 
          }
        }
      }
      setTokenBalances(updatedBalances);
    } catch (error) {
      console.error('Error updating balances:', error);
      toast.error('Failed to update balances');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true); 
    try {
      const provider = window.phantom?.solana || window.solana;
      if (!provider) {
        toast.error('Phantom wallet not found! Please install it.');
        setIsLoading(false);
        return;
      }

      

      if (provider.isConnected) {
        
        try {
          await provider.disconnect();
        } catch (disconnectError) {
          console.error("Error during disconnect:", disconnectError);
          
        }
        setWallet(null);
        setPublicKey(null);
        setSolBalance(0);
        setTokenBalances({});
        toast.info('Wallet disconnected.');
        setIsLoading(false);
        return; 
      }

      // Attempt to connect
      await provider.connect();
      if (!provider.publicKey) {
        throw new Error("Wallet connection failed: Public key not available.");
      }

      setWallet(provider); 
      setPublicKey(provider.publicKey); // Store the public key
      console.log("Wallet Connected, Public Key:", provider.publicKey.toString());
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect wallet: ${error.message}`);
      setWallet(null); // Reset on error
      setPublicKey(null);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (wallet && publicKey) { 
      updateBalances();
      
      const interval = setInterval(updateBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, publicKey, activeTokens]); 

  
  useEffect(() => {
    const provider = window.phantom?.solana || window.solana;
    if (provider?.on) {
      const handleAccountChange = (newPublicKey) => {
        console.log("Phantom account changed:", newPublicKey?.toString());
        if (newPublicKey) {
          setPublicKey(newPublicKey);
          setWallet(provider); 
          toast.info("Wallet account changed.");
        } else {
          
          setWallet(null);
          setPublicKey(null);
          setSolBalance(0);
          setTokenBalances({});
          toast.info("Wallet disconnected due to account change.");
        }
      };

      provider.on('accountChanged', handleAccountChange);

    
      return () => {
        provider.removeListener('accountChanged', handleAccountChange);
      };
    }
  }, []); 


  return {
    wallet,
    publicKey,
    solBalance,
    tokenBalances,
    activeTokens,
    isLoading,
    connection,
    connectWallet,
    updateBalances,
    setActiveTokens
  };
};

export default useSolanaWallet;
