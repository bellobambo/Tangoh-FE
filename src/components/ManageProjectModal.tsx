import { useState } from 'react';
import { isAddress } from 'viem';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser'; // Adjust path if needed

interface ManageModalProps {
  ticketId: bigint;
  status: number; // 1: Fundraising, 2: Project Pending, 3: Completed
  onClose: () => void;
}

const ManageProjectModal = ({ ticketId, status, onClose }: ManageModalProps) => {
  const { 
    closeFundraising, 
    withdrawFunds, 
    markProjectComplete, 
    isPending, 
    isConfirming, 
    isSuccess 
  } = useCollegeFundraiser();

  const [recipient, setRecipient] = useState('');
  const [localError, setLocalError] = useState('');

  // Handle Withdrawal Logic
  const handleWithdraw = async () => {
    setLocalError('');
    
    if (!recipient) {
      setLocalError("Please enter a recipient address");
      return;
    }
    
    if (!isAddress(recipient)) {
      setLocalError("Invalid Ethereum address");
      return;
    }

    try {
      await withdrawFunds(ticketId, recipient as `0x${string}`);
    } catch (e) {
      console.error(e);
      setLocalError("Transaction failed. Check console for details.");
    }
  };

  // 1. Success State
  if (isSuccess) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl p-8 text-center max-w-sm w-full shadow-2xl animate-fade-in-up"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Action Successful!</h3>
          <p className="text-gray-500 text-sm mb-6">The project state has been successfully updated on the blockchain.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg w-full transition shadow-md"
          >
            Close & Refresh
          </button>
        </div>
      </div>
    );
  }

  // 2. Main Modal State
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-bold text-gray-800">Manage Project #{ticketId.toString()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- OPTION 1: Close Fundraising (Status 1) --- */}
        {status === 1 && (
          <div className="space-y-5">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Close Fundraising?
              </h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                Closing fundraising will stop new contributions and lock the funds. This is required before you can withdraw.
              </p>
            </div>
            
            <button
              onClick={() => closeFundraising(ticketId)}
              disabled={isPending || isConfirming}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {isPending ? 'Check Wallet...' : isConfirming ? 'Closing...' : 'Confirm & Close Fundraising'}
            </button>
          </div>
        )}

        {/* --- OPTION 2: Project Pending Actions (Status 2) --- */}
        {status === 2 && (
          <div className="space-y-8">
            
            {/* Action A: Withdraw */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">1</span>
                Withdraw Funds
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Recipient Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 0x123...abc"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={isPending || isConfirming}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isPending || isConfirming || !recipient}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  {isPending ? 'Confirming...' : 'Transfer Funds'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Project Finished?</span></div>
            </div>

            {/* Action B: Finalize */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">2</span>
                Finalize Project
              </h4>
              <button
                onClick={() => markProjectComplete(ticketId)}
                disabled={isPending || isConfirming}
                className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 transition"
              >
                 Mark as Completed
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {localError && (
          <div className="mt-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2 animate-pulse">
             <span className="text-lg">⛔</span>
             <span className="mt-0.5">{localError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProjectModal;