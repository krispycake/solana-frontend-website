import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStamp, faPaperPlane, faSpinner, faCoins } from '@fortawesome/free-solid-svg-icons';

const TokenActions = ({ onCreateToken, onMintTokens, onSendTokens, isLoading }) => {
  return (
    <>
      {/* Create Token Card */}
      <div className="col-lg-6 mb-4">
        <div className="card create-token-card">
          <div className="card-body">
            <h5 className="card-title">
              <FontAwesomeIcon icon={faStamp} className="me-2" />
              Create Token
            </h5>
            <form onSubmit={onCreateToken}>
              <div className="mb-3">
                <label className="form-label">Token Name</label>
                <input type="text" name="tokenName" className="form-control" placeholder="Enter token name" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Token Symbol</label>
                <input type="text" name="tokenSymbol" className="form-control" placeholder="Enter token symbol" required />
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

      {/* Mint Tokens Card */}
      <div className="col-lg-6 mb-4">
        <div className="card mint-token-card">
          <div className="card-body">
            <h5 className="card-title">
              <FontAwesomeIcon icon={faCoins} className="me-2" />
              Mint Tokens
            </h5>
            <form onSubmit={onMintTokens}>
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

      {/* Send Tokens Card */}
      <div className="col-lg-6 mb-4">
        <div className="card send-token-card">
          <div className="card-body">
            <h5 className="card-title">
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
              Send Tokens
            </h5>
            <form onSubmit={onSendTokens}>
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
    </>
  );
};

export default TokenActions;
