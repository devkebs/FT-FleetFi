import React, { useEffect, useState } from 'react';
import apiService from '../services/api';

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [walletRes, transactionsRes] = await Promise.all([
          apiService.getWallet(),
          apiService.getWalletTransactions(),
        ]);

        setWallet(walletRes.data);
        setTransactions(transactionsRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading wallet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-2">Manage your funds and transactions</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md mb-6">
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">Total Balance</div>
          <div className="text-4xl font-bold text-gray-900">
            {wallet.currency} {(wallet.balance / 100).toFixed(2)}
          </div>
        </div>

        {wallet.public_key && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Public Key</div>
            <div className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-2 rounded">
              {wallet.public_key}
            </div>
          </div>
        )}

        {wallet.trovotech_wallet_id && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">Trovotech Wallet ID</div>
            <div className="text-sm font-mono text-gray-900 break-all bg-gray-50 p-2 rounded">
              {wallet.trovotech_wallet_id}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-gray-900 capitalize">
                    {transaction.type}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}
                  {transaction.currency} {(transaction.amount / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
