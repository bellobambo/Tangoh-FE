import { useState, useEffect } from 'react';
import { isAddress, formatEther } from 'viem';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser';
import { Drawer } from 'antd';
import toast from 'react-hot-toast';
import { LoadingOutlined } from '@ant-design/icons';

interface ManageModalProps {
  ticketId: bigint;
  status: number; // 1: Fundraising, 2: Project Pending, 3: Completed
  ticketTitle: string;
  raisedAmount: bigint;
  targetAmount: bigint;
  onClose: () => void;
}

const ManageProjectModal = ({
  ticketId,
  status,
  ticketTitle,
  raisedAmount,
  targetAmount,
  onClose
}: ManageModalProps) => {
  const {
    closeFundraising,
    withdrawFunds,
    markProjectComplete,
    isPending,    // Wallet is opening/signing
    isConfirming, // Transaction sent, waiting for block confirmation
    isSuccess,    // Transaction confirmed on blockchain
  } = useCollegeFundraiser();

  const [recipient, setRecipient] = useState('');
  const [localError, setLocalError] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // --- LOGIC CHECK: Are funds 0? ---
  const isFundsWithdrawn = raisedAmount === 0n;

  // --- SUCCESS LISTENER ---
  // This ensures we only reload AFTER the blockchain has confirmed the action
  useEffect(() => {
    if (isSuccess && activeAction) {
      let message = 'Action Successful!';
      
      // Customize message based on action
      if (activeAction === 'close') message = 'Fundraising Closed Successfully!';
      if (activeAction === 'withdraw') message = 'Funds Withdrawn Successfully!';
      if (activeAction === 'complete') message = 'Project Marked as Completed!';

      toast.success(message);

      // Wait 1.5s for toast to be read, then reload
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
      // NOTE: We do NOT put success logic here. 
      // The code awaits the SIGNATURE, not the confirmation.
      // We let the useEffect handle the rest.
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to close fundraising');
      setActiveAction(null); // Reset on error so we can try again
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

  // Loading state covers: Wallet interaction (Pending) OR Blockchain Confirmation (Confirming)
  const isLoading = isPending || isConfirming || (isSuccess && !!activeAction);

  return (
    <Drawer
      title={
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-[#596576] leading-tight">
            {ticketTitle}
          </h3>
          <div className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-900">{formatEther(targetAmount)} ETH</span> Target
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={true}
      width={500}
      closable={!isLoading}
      maskClosable={!isLoading}
      styles={{
        body: { padding: '24px' }
      }}
    >
      <div className="space-y-6">
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
              {/* <div className="flex justify-between items-center">
                <h4 className={`font-semibold flex items-center gap-2 ${isFundsWithdrawn ? 'text-green-600' : 'text-[#596576]'}`}>
                  <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${isFundsWithdrawn ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-700'}`}>
                    {isFundsWithdrawn ? <CheckCircleOutlined /> : '1'}
                  </span>
                  Withdraw Funds
                </h4>
                {isFundsWithdrawn && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">COMPLETED</span>}
              </div> */}

              <div className={`p-4 rounded-xl border space-y-3 ${isFundsWithdrawn ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Recipient Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 0x123...abc"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={isLoading || isFundsWithdrawn}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#596576] outline-none transition bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || !recipient || isFundsWithdrawn}
                  className={`w-full font-semibold py-2.5 rounded-lg text-sm transition shadow-sm flex justify-center items-center gap-2
                    ${isFundsWithdrawn 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#596576] cursor-pointer hover:bg-[#7D8CA3] text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                >
                  {isLoading && activeAction === 'withdraw' ? (
                    <><LoadingOutlined /> Transferring...</>
                  ) : isFundsWithdrawn ? (
                    'Funds Already Withdrawn'
                  ) : (
                    'Transfer Funds'
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Then</span></div>
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
                className="w-full cursor-pointer bg-white border-2 border-[#596576] text-[#596576] hover:bg-gray-50 font-bold py-2.5 rounded-lg text-sm disabled:opacity-50 transition flex justify-center items-center gap-2"
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
      </div>
    </Drawer>
  );
};

export default ManageProjectModal;