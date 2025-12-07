import React, { useState, useEffect } from 'react';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LoadingOutlined } from '@ant-design/icons';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the hook internally
  const { 
    fundTicket, 
    isPending, 
    isConfirming, 
    isSuccess
  } = useCollegeFundraiser();

  // --- SUCCESS LOGIC: Toast & Reload ---
  useEffect(() => {
    if (isSuccess && isSubmitting) {
      toast.success('Contribution Received! Thank you.');
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await fundTicket(ticketId, amount);
    } catch (error: any) {
      console.error('Funding error:', error);
      toast.error(error.message || 'Transaction failed');
      setIsSubmitting(false); // Reset if error
    }
  };

  const isLoading = isPending || isConfirming || (isSuccess && isSubmitting);

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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Fund Project</h2>
          {!isLoading && (
            <button 
              onClick={onClose} 
              className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Project:</span> {ticketTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contribution Amount (Arbitrum ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0.05"
                required
              />
              {/* <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium">ETH</span> */}
            </div>
          </div>

          {localError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{localError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !amount}
            className="w-full cursor-pointer bg-[#596576] hover:bg-[#7D8CA3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm text-base flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <LoadingOutlined className="text-lg" /> <span>Waiting...</span>
              </>
            ) : isConfirming ? (
              <>
                <LoadingOutlined className="text-lg" /> <span>Confirming...</span>
              </>
            ) : (
              'Confirm Contribution'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default FundModal;