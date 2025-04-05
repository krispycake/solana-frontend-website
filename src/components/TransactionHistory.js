import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCheck, faTimes, faSpinner, faExternalLinkAlt, faStamp, faCoins, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const TransactionHistory = ({ transactions }) => {
  const getTxIcon = (type) => {
    switch (type) {
      case 'Create Token':
        return faStamp;
      case 'Mint Tokens':
        return faCoins;
      case 'Send Tokens':
        return faPaperPlane;
      default:
        return faHistory;
    }
  };

  return (
    <div className="card transaction-history-card">
      <div className="card-body">
        <h5 className="card-title">
          <FontAwesomeIcon icon={faHistory} className="me-2" />
          Transaction History
        </h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Details</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.signature || Math.random().toString()}>
                  <td>
                    <FontAwesomeIcon icon={getTxIcon(tx.type)} className="me-2" />
                    {tx.type}
                  </td>
                  <td>
                    <span className={`transaction-status status-${tx.status.toLowerCase()}`}>
                      {tx.status === 'Processing' && <FontAwesomeIcon icon={faSpinner} spin />}
                      {tx.status === 'Success' && <FontAwesomeIcon icon={faCheck} />}
                      {tx.status === 'Failed' && <FontAwesomeIcon icon={faTimes} />}
                      {tx.status}
                    </span>
                  </td>
                  <td>{tx.details}</td>
                  <td>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                  <td>
                    <button
                      className="btn btn-link btn-sm"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`, '_blank')}
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
