import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faCoins, faSpinner, faCopy } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const WalletInfo = ({ wallet, solBalance, tokenBalances, activeTokens, isLoading }) => {
  return (
    <div className="card wallet-info-card">
      <div className="card-body">
        <h5 className="card-title">
          <FontAwesomeIcon icon={faWallet} className="me-2" />
          Wallet Information
        </h5>
        <div className="wallet-details">
          <div className="info-group">
            <label>Wallet Address</label>
            <div className="address-text">
              {wallet.publicKey.toString()}
              <button 
                className="btn btn-link btn-sm copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(wallet.publicKey.toString());
                  toast.success('Address copied!');
                }}
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </div>
          <div className="info-group">
            <label>SOL Balance</label>
            <div className="balance-text">
              <FontAwesomeIcon icon={faCoins} className="me-2" />
              {solBalance.toFixed(4)} SOL
              {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="ms-2" />}
            </div>
          </div>
          {activeTokens.length > 0 && (
            <div className="info-group">
              <label>Token Balances</label>
              {activeTokens.map(token => (
                <div key={token.address} className="token-balance">
                  <span className="token-name">{token.symbol}</span>
                  <span className="token-amount">
                    {tokenBalances[token.address]?.toFixed(4) || '0'}
                    {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="ms-2" />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
