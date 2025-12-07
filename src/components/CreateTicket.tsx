import React, { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import {
  useCollegeFundraiser,
  useTicket,
  useTicketCount,
  useUser
} from '../hooks/useCollegeFundraiser';
import FundModal from './FundModal';
import ManageProjectModal from './ManageProjectModal';
import { LikeOutlined, DislikeOutlined, LoadingOutlined } from '@ant-design/icons';

// --- FIXED: Decode Bytes32 ---
const decodeBytes32String = (hex: string) => {
  try {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    let result = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexByte = cleanHex.substring(i, i + 2);
      const byte = parseInt(hexByte, 16);
      if (byte === 0) break;
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte);
      }
    }
    return result.trim() || "Unknown";
  } catch (e) {
    console.error('Decode error:', e);
    return "Unknown";
  }
};

const TicketItem = ({ ticketId, userRole }: { ticketId: bigint; userRole: number }) => {
  // const { data: ticket, isLoading, refetch } = useTicket(ticketId);
  const { data: ticket, isLoading } = useTicket(ticketId);
  const { vote, approveTicket, isPending, isConfirming, isSuccess } = useCollegeFundraiser();

  const [votingAction, setVotingAction] = useState<'up' | 'down' | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  React.useEffect(() => {
    if (isSuccess && votingAction) {
      // Small delay to ensure transaction is confirmed before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [isSuccess, votingAction]);

  const handleVote = async (upvote: boolean) => {
    try {
      setVotingAction(upvote ? 'up' : 'down');
      await vote(ticketId, upvote);
    } catch (error) {
      console.error('Vote error:', error);
      setVotingAction(null);
    }
  };

  const handleApprove = async (targetAmount: string, startTime: string, endTime: string) => {
    try {
      const startTimestamp = BigInt(Math.floor(new Date(startTime).getTime() / 1000));
      const endTimestamp = BigInt(Math.floor(new Date(endTime).getTime() / 1000));
      await approveTicket(ticketId, targetAmount, startTimestamp, endTimestamp);
      // Don't close modal here - let success state handle it
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  if (isLoading) return <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />;
  if (!ticket) return null;

  const [
    creator,
    approver,
    titleHex,
    descHex,
    votes,
    targetAmount,
    raisedAmount,
    status
  ] = ticket;

  const title = decodeBytes32String(titleHex);
  const description = decodeBytes32String(descHex);
  const statusNum = Number(status);

  const statusMap = ["Pending", "Fundraising", "Project Pending", "Completed"];
  const statusColors = [
    "bg-yellow-100 text-yellow-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-green-100 text-green-800"
  ];

  const isVoting = isPending || isConfirming;
  const voteNumber = Number(votes);
  const isAdmin = userRole === 1;
  const progressPercent = Math.min((Number(raisedAmount) / (Number(targetAmount) || 1)) * 100, 100);

  return (
    <>
      <div className="bg-white border border-gray-200 h-[280px] rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between">
        <span className='hidden'>{creator} {approver}</span>
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[statusNum] || 'bg-gray-100'}`}>
              {statusMap[statusNum] || "Unknown"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">#{ticketId.toString()}</span>
              {isAdmin && statusNum === 0 && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold transition-all active:scale-95"
                >
                  Approve
                </button>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#596576] mb-2 truncate">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-100">
          {statusNum === 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Votes:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(true)}
                  disabled={isVoting}
                  className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    isVoting && votingAction === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {isVoting && votingAction === 'up' ? (
                    <LoadingOutlined />
                  ) : (
                    <LikeOutlined className="text-lg" />
                  )}
                </button>

                <span className={`font-semibold min-w-5 text-center ${voteNumber > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {voteNumber}
                </span>

                <button
                  onClick={() => handleVote(false)}
                  disabled={isVoting}
                  className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    isVoting && votingAction === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {isVoting && votingAction === 'down' ? (
                    <LoadingOutlined />
                  ) : (
                    <DislikeOutlined className="text-lg" />
                  )}
                </button>
              </div>
            </div>
          )}

          {statusNum === 1 && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Fundraising Live</span>
                <span className="text-xs text-gray-500">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 flex flex-col">
                  <span className="text-gray-900 font-bold">{formatEther(raisedAmount)} ETH</span>
                  <span>of {formatEther(BigInt(targetAmount))} ETH</span>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFundModal(true)}
                    className="bg-[#596576] hover:bg-[#7D8CA3] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm active:scale-95"
                  >
                    Contribute
                  </button>
                )}
              </div>
            </div>
          )}

          {statusNum > 1 && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-green-600 font-semibold">Goal Reached</span>
                <span className="text-xs text-gray-500">Votes: {voteNumber}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 mb-2">
                <div className="bg-[#7D8CA3] h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Raised: {formatEther(raisedAmount)} ETH</span>

                {isAdmin && statusNum === 2 && (
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="bg-gray-800 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded"
                  >
                    Admin Options
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApproveModal && (
        <ApproveModal
          ticketId={ticketId}
          ticketTitle={title}
          onClose={() => setShowApproveModal(false)}
          onApprove={handleApprove}
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
        />
      )}

      {showFundModal && (
        <FundModal
          ticketId={ticketId}
          ticketTitle={title}
          onClose={() => setShowFundModal(false)}
        />
      )}

      {showManageModal && (
        <ManageProjectModal
          ticketId={ticketId}
          status={statusNum}
          onClose={() => setShowManageModal(false)}
        />
      )}
    </>
  );
};

const ApproveModal = ({
  ticketId,
  ticketTitle,
  onClose,
  onApprove,
  isPending,
  isConfirming,
  isSuccess
}: {
  ticketId: bigint;
  ticketTitle: string;
  onClose: () => void;
  onApprove: (targetAmount: string, startTime: string, endTime: string) => Promise<void>;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
}) => {
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    setStartDate(today.toISOString().slice(0, 16));
    setEndDate(future.toISOString().slice(0, 16));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!targetAmount || !startDate || !endDate) {
      setLocalError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      setLocalError('Invalid target amount');
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();

    if (end <= start) {
      setLocalError('End date must be after start date');
      return;
    }

    if (start < now) {
      setLocalError('Start date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    await onApprove(targetAmount, startDate, endDate);
  };

  // Close modal on success after user interaction
  const handleSuccessClose = () => {
    setIsSubmitting(false);
    onClose();
    window.location.reload();
  };

  const isLoading = isPending || isConfirming || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - only clickable when NOT loading */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading && !isSuccess ? onClose : undefined}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        {/* Success State */}
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Transaction Confirmed!</h3>
            <p className="text-gray-600 mb-1">Ticket has been approved successfully.</p>
            <p className="text-sm text-gray-500 mb-6">Fundraising is now active for this ticket.</p>
            <button
              onClick={handleSuccessClose}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Close & Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Header - hide close button when loading */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Approve Ticket</h2>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Ticket #{ticketId.toString()}:</span> {ticketTitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Amount (ETH)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] focus:border-transparent outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g. 0.0002 or 1.5"
                />
                <p className="mt-1 text-xs text-gray-500">Enter any amount (e.g., 0.0002, 0.5, 1.234)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] focus:border-transparent outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] focus:border-transparent outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{localError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !targetAmount || !startDate || !endDate}
                className="w-full bg-[#596576] hover:bg-[#7D8CA3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm text-base flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <LoadingOutlined className="text-lg" />
                    <span>Waiting for Wallet...</span>
                  </>
                ) : isConfirming ? (
                  <>
                    <LoadingOutlined className="text-lg" />
                    <span>Confirming Transaction...</span>
                  </>
                ) : (
                  'Approve & Start Fundraising'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// --- Component 3: Create Ticket Form ---
const CreateTicketForm = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    createTicket,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash
  } = useCollegeFundraiser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!title.trim() || !description.trim()) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (title.length > 31 || description.length > 31) {
      setLocalError('Text too long (max 31 chars)');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTicket(title, description);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSubmitting(false);
    onClose();
    window.location.reload();
  };

  const isLoading = isPending || isConfirming || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - only clickable when NOT loading */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading && !isSuccess ? onClose : undefined}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6 animate-fade-in-up">
        {/* Success State */}
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ticket Created!</h3>
            <p className="text-gray-600 mb-6">Your concern has been submitted successfully.</p>
            <button
              onClick={handleSuccessClose}
              className="bg-[#596576] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#7D8CA3] transition"
            >
              Close & Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Header - hide close button when loading */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Proposal</h2>
              {!isLoading && (
                <button onClick={onClose} className="text-gray-400 cursor-pointer hover:text-gray-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={31}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g. Library AC"
                />
                <div className="text-right text-sm text-gray-500 mt-1">{title.length}/31</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={31}
                  rows={5}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none resize-none text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Explain the issue..."
                />
                <div className="text-right text-sm text-gray-500 mt-1">{description.length}/31</div>
              </div>

              {(localError || error) && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                  ⚠️ {localError || error?.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !title || !description}
                className="w-full bg-[#596576] cursor-pointer hover:bg-[#7D8CA3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition shadow-sm text-base flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <LoadingOutlined className="text-lg" />
                    <span>Waiting for Wallet...</span>
                  </>
                ) : isConfirming ? (
                  <>
                    <LoadingOutlined className="text-lg" />
                    <span>Creating Ticket...</span>
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>

              {hash && (
                <div className="text-center mt-2">
                  <a href={`https://sepolia.arbiscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-[#596576] underline">
                    View Transaction
                  </a>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export const CreateTicket = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address } = useAccount();
  const { data: countData, isLoading: countLoading } = useTicketCount();

  const { data: userData } = useUser(address as `0x${string}`);
  const userRole = userData ? Number(userData[1]) : 0;

  const ticketIds = useMemo(() => {
    if (!countData) return [];
    const count = Number(countData);
    return Array.from({ length: count }, (_, i) => BigInt(i)).reverse();
  }, [countData]);

  return (
    <div className="w-full h-full">
      <div className="flex flex-col gap-3 mb-6 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-white">Concerns</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="border-[#596576] cursor-pointer border text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            + New Ticket
          </button>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {countLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#596576]"></div>
          </div>
        ) : ticketIds.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No concerns raised yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {ticketIds.map((id) => (
              <TicketItem key={id.toString()} ticketId={id} userRole={userRole} />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateTicketForm onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default ApproveModal;