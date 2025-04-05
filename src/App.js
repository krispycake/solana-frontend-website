import React, { useEffect } from 'react';
import { PublicKey } from '@solana/web3.js'; 
import * as splToken from '@solana/spl-token'; 
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faWallet, faSpinner, faStamp, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

// Local imports
import { useSolanaWallet } from './hooks/useSolanaWallet';
import { useTransactions } from './hooks/useTransactions';
import { getMintDecimals } from './utils/solanaUtils';
import TransactionHistory from './components/TransactionHistory';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { createToken, mintTokens, sendTokens } from './api/tokenOperations'; 



function App() {
  const {
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
  } = useSolanaWallet();

  const { transactions, handleTransactionUpdate } = useTransactions(connection, updateBalances);

  const handleCreateToken = async (e) => {
    e.preventDefault();
    // 1. Wallet Check
    if (!wallet || !publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    // 2. Get Form Data
    let name, symbol, decimals;
    try {
      const formData = new FormData(e.target);
      name = formData.get('tokenName');
      symbol = formData.get('tokenSymbol');
      const decimalsRaw = formData.get('tokenDecimals');
      decimals = parseInt(decimalsRaw);

      if (isNaN(decimals)) {
        throw new Error(`Invalid decimals value: ${decimalsRaw}`);
      }

    } catch (validationError) {
      console.error("Form validation error:", validationError);
      toast.error(validationError.message);
    
      handleTransactionUpdate({
        tempId: Date.now().toString(),
        type: 'Create Token',
        details: validationError.message,
        status: 'Failed',
        error: validationError
      });
      return; 
    }

    // 3. Call the API function
    const result = await createToken(
      connection,
      wallet,
      publicKey,
      handleTransactionUpdate,
      name,
      symbol,
      decimals
    );

    // 4. Handle Result
    if (result && result.tokenAddress) {
      // Add the new token to the active list for balance tracking
      setActiveTokens(prev => [
        ...prev,
        { address: result.tokenAddress, symbol, name, decimals }
      ]);
      e.target.reset(); 
    } else {
     
      console.log("handleCreateToken: createToken API call failed or returned null.");
    }
  };

  const handleMintTokens = async (e) => {
    e.preventDefault();
    // 1. Wallet Check
    if (!wallet || !publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    // 2. Get Form Data
    let tokenAddress, amount;
    try {
      const formData = new FormData(e.target);
      tokenAddress = formData.get('tokenAddress');
      amount = parseFloat(formData.get('amount'));

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      // Validate token address format
      try {
        new PublicKey(tokenAddress);
      } catch (error) {
        throw new Error('Invalid token address format');
      }
    } catch (validationError) {
      console.error("Form validation error:", validationError);
      toast.error(validationError.message);
      handleTransactionUpdate({
        tempId: Date.now().toString(),
        type: 'Mint Tokens',
        details: validationError.message,
        status: 'Failed',
        error: validationError
      });
      return;
    }

    // 3. Get decimals for the token
    let decimals;
    try {
      const mintPublicKey = new PublicKey(tokenAddress);
      decimals = await getMintDecimals(connection, mintPublicKey);
    } catch (error) {
      console.error("Failed to get token decimals:", error);
      toast.error(`Could not retrieve token information: ${error.message}`);
      handleTransactionUpdate({
        tempId: Date.now().toString(),
        type: 'Mint Tokens',
        details: `Failed to get token information: ${error.message}`,
        status: 'Failed',
        error: error
      });
      return;
    }

    // 4. Call the API function to mint tokens
    const result = await mintTokens(
      connection,
      wallet,
      publicKey,
      handleTransactionUpdate,
      tokenAddress,
      null, 
      amount,
      decimals
    );

    // 5. Handle result
    if (result && result.signature) {
      e.target.reset(); 
      
    } else {
      
      console.log("handleMintTokens: mintTokens API call failed or returned null.");
    }
  };

  const handleSendTokens = async (e) => {
    e.preventDefault();
    // 1. Wallet Check
    if (!wallet || !publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    // 2. Get Form Data
    let recipientAddress, tokenAddress, amount;
    try {
      const formData = new FormData(e.target);
      recipientAddress = formData.get('recipientAddress');
      tokenAddress = formData.get('tokenAddress');
      amount = parseFloat(formData.get('amount'));

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      // Validate addresses format
      try {
        new PublicKey(tokenAddress);
        new PublicKey(recipientAddress);
      } catch (error) {
        throw new Error('Invalid address format');
      }
    } catch (validationError) {
      console.error("Form validation error:", validationError);
      toast.error(validationError.message);
      handleTransactionUpdate({
        tempId: Date.now().toString(),
        type: 'Send Tokens',
        details: validationError.message,
        status: 'Failed',
        error: validationError
      });
      return;
    }

    // 3. Get decimals for the token
    let decimals;
    try {
      const mintPublicKey = new PublicKey(tokenAddress);
      decimals = await getMintDecimals(connection, mintPublicKey);
    } catch (error) {
      console.error("Failed to get token decimals:", error);
      toast.error(`Could not retrieve token information: ${error.message}`);
      handleTransactionUpdate({
        tempId: Date.now().toString(),
        type: 'Send Tokens',
        details: `Failed to get token information: ${error.message}`,
        status: 'Failed',
        error: error
      });
      return;
    }

    // 4. Call the API function to send tokens
    const result = await sendTokens(
      connection,
      wallet,
      publicKey,
      handleTransactionUpdate,
      tokenAddress,
      recipientAddress,
      amount,
      decimals
    );

    // 5. Handle result
    if (result && result.signature) {
      e.target.reset(); 
      
    } else {
      
      console.log("handleSendTokens: sendTokens API call failed or returned null.");
    }
  };

  return (
    <div className="App">
      <nav className="navbar navbar-dark">
        <div className="container">
          <span className="navbar-brand">
            <FontAwesomeIcon icon={faCoins} className="me-2" />
            Solana Wallet Integration
          </span>
          <button className="btn btn-connect" onClick={connectWallet}>
            <FontAwesomeIcon icon={faWallet} className="me-2" />
            {wallet ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      <main className="container mt-5">
        {/* First Row: Wallet Info + Create Token */}
        <div className="row g-4 mb-4">
          {/* Wallet Information */}
          <div className="col-md-6">
            <div className="card wallet-info-card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Wallet Info</h5>
                {wallet ? (
                  <div>
                    <p className="address-text mb-2">
                      Address: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                    </p>
                    <p className="balance-text">SOL Balance: {solBalance.toFixed(4)}</p>
                  </div>
                ) : (
                  <p className="text-muted">Please connect your wallet to view details</p>
                )}
              </div>
            </div>
          </div>
          {/* Create Token */}
          <div className="col-md-6">
            <div className="card create-token-card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  <FontAwesomeIcon icon={faCoins} className="me-2" />
                  Create Token
                </h5>
                <form onSubmit={handleCreateToken}>
                  <div className="mb-3">
                    <label className="form-label">Token Name</label>
                    <input type="text" name="tokenName" className="form-control" placeholder="My Token" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Token Symbol</label>
                    <input type="text" name="tokenSymbol" className="form-control" placeholder="MTK" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Decimals</label>
                    <input type="number" name="tokenDecimals" className="form-control" defaultValue="9" required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Creating...
                      </>
                    ) : (
                      <>Create Token</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Mint Token + Send Token */}
        <div className="row g-4 mb-4">
          {/* Mint Tokens */}
          <div className="col-md-6">
            <div className="card mint-token-card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  <FontAwesomeIcon icon={faStamp} className="me-2" />
                  Mint Tokens
                </h5>
                <form onSubmit={handleMintTokens}>
                  <div className="mb-3">
                    <label className="form-label">Token Address</label>
                    <input type="text" name="tokenAddress" className="form-control" placeholder="Token mint address" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount</label>
                    <input type="number" name="amount" className="form-control" placeholder="Amount to mint" required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Minting...
                      </>
                    ) : (
                      <>Mint Tokens</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
          {/* Send Tokens */}
          <div className="col-md-6">
            <div className="card send-token-card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                  Send Tokens
                </h5>
                <form onSubmit={handleSendTokens}>
                  <div className="mb-3">
                    <label className="form-label">Recipient Address</label>
                    <input type="text" name="recipientAddress" className="form-control" placeholder="Recipient's wallet address" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Token Address</label>
                    <input type="text" name="tokenAddress" className="form-control" placeholder="Token mint address" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount</label>
                    <input type="number" name="amount" className="form-control" placeholder="Amount to send" required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Sending...
                      </>
                    ) : (
                      <>Send Tokens</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="row">
          <div className="col-12">
            <TransactionHistory transactions={transactions} />
          </div>
        </div>
      </main>

      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;