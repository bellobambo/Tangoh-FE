import React, { useState } from 'react';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser';

// --- Component: Fund Ticket Modal ---
const FundModal = ({
  ticketId,
  ticketTitle,
  onClose,
}: {
  ticketId: bigint;
  ticketTitle: string;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');

  // Use the hook internally
  const { 
    fundTicket, 
    isPending, 
    isConfirming, 
    isSuccess,
    hash
  } = useCollegeFundraiser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }

    try {
      await fundTicket(ticketId, amount);
    } catch (error) {
      console.error('Funding error:', error);
      setLocalError('Transaction failed or rejected');
    }
  };

  // 1. Success State
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 animate-fade-in-up">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💸</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Contribution Received!</h3>
            <p className="text-gray-600 mb-6">Thank you for supporting this project.</p>
            {hash && (
               <a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 underline block mb-4">
                 View Transaction
               </a>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Close & Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isPending || isConfirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {isPending ? 'Check Wallet...' : 'Processing Contribution...'}
            </h3>
            <p className="text-gray-500 text-sm">
              Transaction is being confirmed on Arbitrum Sepolia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Input Form State
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Fund Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Project:</span> {ticketTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contribution Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                placeholder="0.05"
                required
              />
              <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium">ETH</span>
            </div>
          </div>

          {localError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {localError}
            </div>
          )}

          <button
            type="submit"
            disabled={!amount}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm text-base"
          >
            Confirm Contribution
          </button>
        </form>
      </div>
    </div>
  );
};

export default FundModal;