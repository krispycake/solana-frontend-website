import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useTransactions = (connection, updateBalances) => {
  const [transactions, setTransactions] = useState([]);

  // Function to add or update a transaction 
  const handleTransactionUpdate = useCallback(async (txData) => {
    const { tempId: providedTempId, signature, type, details, status: initialStatus, error } = txData;

    const tempId = providedTempId || Date.now().toString(); 

    setTransactions(prev => {
      const existingIndex = prev.findIndex(tx => tx.tempId === tempId);
      const baseTx = {
        tempId,
        signature: signature !== undefined ? signature : (existingIndex > -1 ? prev[existingIndex].signature : null), // Preserve existing signature if new one isn't provided
        type,
        details: details || (existingIndex > -1 ? prev[existingIndex].details : 'No details'),
        status: initialStatus || 'Processing', 
        error: error ? (error.message || String(error)) : null,
        timestamp: new Date().toISOString()
      };

      if (existingIndex > -1) {
        
        const updatedTransactions = [...prev];
        updatedTransactions[existingIndex] = { ...prev[existingIndex], ...baseTx };
        
        if (signature === null && prev[existingIndex].signature) {
           updatedTransactions[existingIndex].signature = prev[existingIndex].signature;
        }
        return updatedTransactions;
      } else {
        
        return [baseTx, ...prev];
      }
    });

    
    if (signature && initialStatus !== 'Failed') {
      try {
        toast.info(`Confirming transaction: ${signature.slice(0, 8)}...`, { autoClose: 5000 });
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        let finalStatus = 'Success';
        let confirmationError = null;

        if (confirmation.value.err) {
            finalStatus = 'Failed';
            
            confirmationError = new Error(JSON.stringify(confirmation.value.err));
            console.error("Transaction Confirmation Error:", confirmation.value.err);
            toast.error(`Transaction Failed: ${confirmationError.message}`);
        } else {
            toast.success(`Transaction Confirmed: ${signature.slice(0, 8)}...`);
            await updateBalances(); 
        }

        // Update final status
        setTransactions(prev => prev.map(tx =>
          tx.tempId === tempId
            ? { ...tx, status: finalStatus, signature: signature, error: confirmationError ? (confirmationError.message || String(confirmationError)) : null }
            : tx
        ));

      } catch (confirmError) {
        console.error("Confirmation Process Error:", confirmError);
        
        setTransactions(prev => prev.map(tx =>
          tx.tempId === tempId
            ? { ...tx, status: 'Failed', signature: signature, error: confirmError.message || String(confirmError) }
            : tx
        ));
        toast.error(`Transaction Confirmation Failed: ${confirmError.message}`);
      }
    }
  }, [connection, updateBalances]);

  return {
    transactions,
    handleTransactionUpdate
  };
};

export default useTransactions;
