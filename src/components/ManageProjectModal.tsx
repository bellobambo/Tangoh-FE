import { useState, useEffect } from 'react';
import { isAddress } from 'viem';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingOutlined } from '@ant-design/icons';

interface ManageModalProps {
  ticketId: bigint;
  status: number; // 1: Fundraising, 2: Project Pending, 3: Completed
  onClose: () => void;
}

// Animation Variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

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
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // --- SUCCESS LOGIC: Toast & Reload ---
  useEffect(() => {
    if (isSuccess && activeAction) {
      let message = 'Action Successful!';
      if (activeAction === 'close') message = 'Fundraising Closed Successfully!';
      if (activeAction === 'withdraw') message = 'Funds Withdrawn Successfully!';
      if (activeAction === 'complete') message = 'Project Marked as Completed!';

      toast.success(message);
      
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, activeAction]);

  // Handle Actions
  const handleCloseFundraising = async () => {
    setActiveAction('close');
    try {
      await closeFundraising(ticketId);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to close fundraising');
      setActiveAction(null);
    }
  };

  const handleWithdraw = async () => {
    setLocalError('');
    if (!recipient) { setLocalError("Please enter a recipient address"); return; }
    if (!isAddress(recipient)) { setLocalError("Invalid Ethereum address"); return; }

    setActiveAction('withdraw');
    try {
      await withdrawFunds(ticketId, recipient as `0x${string}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Withdrawal failed');
      setActiveAction(null);
    }
  };

  const handleMarkComplete = async () => {
    setActiveAction('complete');
    try {
      await markProjectComplete(ticketId);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to update status');
      setActiveAction(null);
    }
  };

  const isLoading = isPending || isConfirming || (isSuccess && !!activeAction);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Content */}
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-xl font-bold text-[#596576]">Manage Project #{ticketId.toString()}</h3>
          {!isLoading && (
            <button 
              onClick={onClose} 
              className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* --- OPTION 1: Close Fundraising (Status 1) --- */}
        {status === 1 && (
          <div className="space-y-5">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Close Fundraising?
              </h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                This will stop new contributions. This step is required before you can withdraw funds.
              </p>
            </div>
            
            <button
              onClick={handleCloseFundraising}
              disabled={isLoading}
              className="w-full bg-[#596576] cursor-pointer hover:bg-[#7D8CA3] text-white font-bold py-3.5 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm flex justify-center items-center gap-2"
            >
              {isLoading && activeAction === 'close' ? (
                <><LoadingOutlined /> Processing...</>
              ) : (
                'Confirm & Close Fundraising'
              )}
            </button>
          </div>
        )}

        {/* --- OPTION 2: Project Pending Actions (Status 2) --- */}
        {status === 2 && (
          <div className="space-y-8">
            
            {/* Action A: Withdraw */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#596576] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-bold">1</span>
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
                    disabled={isLoading}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#596576] outline-none transition bg-white"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !recipient}
                  className="w-full bg-[#596576] hover:bg-[#7D8CA3] text-white font-semibold py-2.5 rounded-lg text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm flex justify-center items-center gap-2"
                >
                  {isLoading && activeAction === 'withdraw' ? (
                     <><LoadingOutlined /> Transferring...</>
                  ) : (
                    'Transfer Funds'
                  )}
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
              <h4 className="font-semibold text-[#596576] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center font-bold">2</span>
                Finalize Project
              </h4>
              <button
                onClick={handleMarkComplete}
                disabled={isLoading}
                className="w-full bg-white border-2 border-[#596576] text-[#596576] hover:bg-gray-50 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 transition flex justify-center items-center gap-2"
              >
                 {isLoading && activeAction === 'complete' ? (
                     <><LoadingOutlined /> Updating...</>
                  ) : (
                    'Mark as Completed'
                  )}
              </button>
            </div>
          </div>
        )}

        {/* Local Validation Errors */}
        {localError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
             <span>⚠️ {localError}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageProjectModal;