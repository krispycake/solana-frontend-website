import {
    Connection, PublicKey, Keypair, LAMPORTS_PER_SOL,
    SystemProgram, Transaction
  } from '@solana/web3.js';
  import * as splToken from '@solana/spl-token';
  import { toast } from 'react-toastify';
  import { Buffer } from 'buffer';
  window.Buffer = Buffer; 
  
 
  const { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction } = splToken;
  
  /**
   * Creates a new SPL Token.
   * Handles transaction building, signing, sending, confirmation, and ATA creation.
   * Updates transaction history via handleTransactionUpdate.
   *
   * @param {Connection} connection - Solana connection object
   * @param {object} wallet - Wallet provider object (with signAndSendTransaction)
   * @param {PublicKey} publicKey - Connected wallet's public key
   * @param {function} handleTransactionUpdate - Function to update transaction status
   * @param {string} name - Token Name
   * @param {string} symbol - Token Symbol
   * @param {number} decimals - Token Decimals
   * @returns {Promise<{signature: string, tokenAddress: string} | null>} Signature and token address on success, null on failure before sending.
   */
  export const createToken = async (
    connection,
    wallet,
    publicKey,
    handleTransactionUpdate,
    name,
    symbol,
    decimals
  ) => {
    const tempId = Date.now().toString();
    let signature = null;
    let tokenAddress = null;
    const mintKeypair = Keypair.generate();
    tokenAddress = mintKeypair.publicKey.toString();
  
    console.log(`createToken API: Attempting: Name=${name}, Symbol=${symbol}, Decimals=${decimals}`);
    console.log("createToken API: Generated Mint Keypair Public Key:", tokenAddress);
  
    try {
      // Initial processing update
      await handleTransactionUpdate({
        tempId,
        type: 'Create Token',
        details: `Initializing creation of ${symbol}...`,
        status: 'Processing'
      });
  
      // --- Manual Transaction Creation ---
      const lamports = await splToken.getMinimumBalanceForRentExemptMint(connection);
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      });
      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        publicKey,
        publicKey
      );
      const transaction = new Transaction().add(
        createAccountInstruction,
        initializeMintInstruction
      );
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
  
      // Sign and Send
      transaction.partialSign(mintKeypair);
      console.log("createToken API: Requesting user signature and sending transaction...");
      const transactionResult = await wallet.signAndSendTransaction(transaction, connection);
      signature = transactionResult.signature; 
      console.log("createToken API: Transaction sent! Signature:", signature);
  
      // Update status: Sent, awaiting confirmation
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Create Token',
        details: `Mint account created for ${symbol}. Confirming...`,
        status: 'Processing'
      });
  
      // Wait for Confirmation
      console.log(`createToken API: Waiting for confirmation for signature: ${signature}`);
      const confirmation = await connection.confirmTransaction(signature, 'finalized');
      if (confirmation.value.err) {
        console.error("Transaction Confirmation Error:", confirmation.value.err);
        throw new Error(`Transaction failed confirmation: ${confirmation.value.err}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      console.log(`createToken API: Transaction confirmed!`);
  
      // Create ATA
      console.log("createToken API: Creating Associated Token Account...");
      await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet, 
        mintKeypair.publicKey,
        publicKey, 
        undefined, 
        'finalized' 
      );
      console.log("createToken API: Associated Token Account created/found.");
  
      // Final Success Update
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Create Token',
        details: `Token ${symbol} (${name}) created successfully!`,
        status: 'Success'
      });
  
      toast.success(`Token ${symbol} created successfully!`); 
      return { signature, tokenAddress };
  
    } catch (error) {
      console.error('--- Token Creation Error (API) ---');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Error Object:', error);
      console.error('Signature at time of error:', signature);
      console.error('------------------------------------');
  
      // Update transaction to Failed
      await handleTransactionUpdate({
        tempId,
        signature, 
        type: 'Create Token',
        details: `Failed to create token ${symbol || ''}`,
        status: 'Failed',
        error: error
      });
      toast.error(`Failed to create token: ${error.message || 'Unknown error'}`);
      return null; 
    }
  };
  
  /**
   * Mints additional tokens to a specified token account.
   * Handles transaction building, signing, sending, and confirmation.
   * Updates transaction history via handleTransactionUpdate.
   *
   * @param {Connection} connection - Solana connection object
   * @param {object} wallet - Wallet provider object (with signAndSendTransaction)
   * @param {PublicKey} publicKey - Connected wallet's public key (must be the mint authority)
   * @param {function} handleTransactionUpdate - Function to update transaction status
   * @param {string} mintAddress - Address of the token mint
   * @param {string} destinationAddress - Token account to receive the minted tokens (or null to use owner's ATA)
   * @param {number|string} amount - Amount to mint (will be adjusted based on decimals)
   * @param {number} decimals - Token decimals for amount calculation
   * @returns {Promise<{signature: string} | null>} Signature on success, null on failure
   */
  export const mintTokens = async (
    connection,
    wallet,
    publicKey,
    handleTransactionUpdate,
    mintAddress,
    destinationAddress = null, 
    amount,
    decimals
  ) => {
    const tempId = Date.now().toString();
    let signature = null;
    const mintPubkey = new PublicKey(mintAddress);
  
    console.log(`mintTokens API: Attempting to mint ${amount} tokens to mint ${mintAddress}`);
  
    try {
      // Initial processing update
      await handleTransactionUpdate({
        tempId,
        type: 'Mint Tokens',
        details: `Preparing to mint ${amount} tokens...`,
        status: 'Processing'
      });
  
      
      let destinationPubkey;
      if (destinationAddress) {
        
        destinationPubkey = new PublicKey(destinationAddress);
        console.log(`mintTokens API: Using provided destination: ${destinationAddress}`);
      } else {
        
        console.log(`mintTokens API: Finding/creating ATA for owner: ${publicKey.toString()}`);
        const destinationAccount = await splToken.getOrCreateAssociatedTokenAccount(
          connection,
          wallet, 
          mintPubkey, 
          publicKey, 
          undefined, 
          'confirmed' 
        );
        destinationPubkey = destinationAccount.address;
        console.log(`mintTokens API: Using owner's ATA: ${destinationPubkey.toString()}`);
      }
  
      // Calculate the adjusted amount 
      const adjustedAmount = Number(amount) * Math.pow(10, decimals);
      console.log(`mintTokens API: Adjusted amount with decimals: ${adjustedAmount.toString()}`);
  
      // Create Mint Instruction
      const mintInstruction = splToken.createMintToInstruction(
        mintPubkey, 
        destinationPubkey, 
        publicKey, 
        adjustedAmount 
      );
  
      // Build transaction
      const transaction = new Transaction().add(mintInstruction);
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
  
      console.log("mintTokens API: Requesting wallet signature...");
      const transactionResult = await wallet.signAndSendTransaction(transaction, connection);
      signature = transactionResult.signature;
      console.log("mintTokens API: Transaction sent! Signature:", signature);
  
      // Update status: Sent, awaiting confirmation
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Mint Tokens',
        details: `Minting ${amount} tokens. Confirming...`,
        status: 'Processing'
      });
  
      // Wait for confirmation
      console.log(`mintTokens API: Waiting for confirmation...`);
      const confirmation = await connection.confirmTransaction(signature, 'finalized');
      if (confirmation.value.err) {
        console.error("Transaction Confirmation Error:", confirmation.value.err);
        throw new Error(`Transaction failed confirmation: ${confirmation.value.err}`);
      }
      console.log(`mintTokens API: Transaction confirmed!`);
  
      // Final Success Update
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Mint Tokens',
        details: `Successfully minted ${amount} tokens!`,
        status: 'Success'
      });
  
      toast.success(`Successfully minted ${amount} tokens!`);
      return { signature };
  
    } catch (error) {
      console.error('--- Token Minting Error (API) ---');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Error Object:', error);
      console.error('Signature at time of error:', signature);
      console.error('------------------------------------');
  
      // Update transaction to Failed
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Mint Tokens',
        details: `Failed to mint ${amount} tokens`,
        status: 'Failed',
        error: error
      });
  
      toast.error(`Failed to mint tokens: ${error.message || 'Unknown error'}`);
      return null; 
    }
  };
  
  /**
   * Sends tokens from one account to another.
   * Handles transaction building, signing, sending, and confirmation.
   * Updates transaction history via handleTransactionUpdate.
   *
   * @param {Connection} connection - Solana connection object
   * @param {object} wallet - Wallet provider object (with signAndSendTransaction)
   * @param {PublicKey} publicKey - Connected wallet's public key (sender)
   * @param {function} handleTransactionUpdate - Function to update transaction status
   * @param {string} mintAddress - Address of the token mint
   * @param {string} recipientAddress - Wallet address of recipient
   * @param {number|string} amount - Amount to send (will be adjusted based on decimals)
   * @param {number} decimals - Token decimals for amount calculation
   * @returns {Promise<{signature: string} | null>} Signature on success, null on failure
   */
  export const sendTokens = async (
    connection,
    wallet,
    publicKey,
    handleTransactionUpdate,
    mintAddress,
    recipientAddress,
    amount,
    decimals
  ) => {
    const tempId = Date.now().toString();
    let signature = null;
    const mintPubkey = new PublicKey(mintAddress);
    const recipientPubkey = new PublicKey(recipientAddress);
  
    console.log(`sendTokens API: Attempting to send ${amount} tokens to ${recipientAddress}`);
  
    try {
      // Initial processing update
      await handleTransactionUpdate({
        tempId,
        type: 'Send Tokens',
        details: `Preparing to send ${amount} tokens to recipient...`,
        status: 'Processing'
      });
  
      
      console.log(`sendTokens API: Finding sender's token account...`);
      const senderTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet, 
        mintPubkey,
        publicKey, 
        undefined,
        'confirmed'
      );
  
      // Find or create recipient's associated token account
      console.log(`sendTokens API: Finding or creating recipient's token account...`);
      const recipientTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet, 
        mintPubkey,
        recipientPubkey, 
        undefined,
        'confirmed'
      );
  
      // Calculate the adjusted amount 
      const adjustedAmount = Number(amount) * Math.pow(10, decimals);
      console.log(`sendTokens API: Adjusted amount with decimals: ${adjustedAmount.toString()}`);
  
      // Create transfer instruction
      const transferInstruction = splToken.createTransferInstruction(
        senderTokenAccount.address, 
        recipientTokenAccount.address, 
        publicKey, 
        adjustedAmount 
      );
  
      // Build transaction
      const transaction = new Transaction().add(transferInstruction);
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
  
      
      console.log("sendTokens API: Requesting wallet signature...");
      const transactionResult = await wallet.signAndSendTransaction(transaction, connection);
      signature = transactionResult.signature;
      console.log("sendTokens API: Transaction sent! Signature:", signature);
  
      // Update status: Sent, awaiting confirmation
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Send Tokens',
        details: `Sending ${amount} tokens. Confirming...`,
        status: 'Processing'
      });
  
      // Wait for confirmation
      console.log(`sendTokens API: Waiting for confirmation...`);
      const confirmation = await connection.confirmTransaction(signature, 'finalized');
      if (confirmation.value.err) {
        console.error("Transaction Confirmation Error:", confirmation.value.err);
        throw new Error(`Transaction failed confirmation: ${confirmation.value.err}`);
      }
      console.log(`sendTokens API: Transaction confirmed!`);
  
      // Final Success Update
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Send Tokens',
        details: `Successfully sent ${amount} tokens to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        status: 'Success'
      });
  
      toast.success(`Successfully sent ${amount} tokens!`);
      return { signature };
  
    } catch (error) {
      console.error('--- Token Transfer Error (API) ---');
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Error Object:', error);
      console.error('Signature at time of error:', signature);
      console.error('------------------------------------');
  
      // Update transaction to Failed
      await handleTransactionUpdate({
        tempId,
        signature,
        type: 'Send Tokens',
        details: `Failed to send ${amount} tokens to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        status: 'Failed',
        error: error
      });
  
      toast.error(`Failed to send tokens: ${error.message || 'Unknown error'}`);
      return null; 
    }
  };