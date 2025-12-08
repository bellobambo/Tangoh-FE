import React, { useState, useMemo, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import toast from 'react-hot-toast'; // Import Toast
import {
  useCollegeFundraiser,
  useTicket,
  useTicketCount,
  useUser,
  useHasVoted
} from '../hooks/useCollegeFundraiser';
import FundModal from './FundModal';
import ManageProjectModal from './ManageProjectModal';
import { LikeOutlined, DislikeOutlined, LoadingOutlined, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import Loader from './Loader';

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

// Animation Variants for Modals
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

const TicketItem = ({ ticketId, userRole }: { ticketId: bigint; userRole: number }) => {
  const { address } = useAccount();

  // 1. Fetch Ticket Data
  const { data: ticket, isLoading } = useTicket(ticketId);

  // 2. Check if User has Voted
  const { data: hasVoted } = useHasVoted(ticketId, address);

  // 3. Destructure Contract Actions
  const {
    vote,
    approveTicket,
    acknowledgeTicket,
    isPending,
    isConfirming,
    isSuccess
  } = useCollegeFundraiser();

  const [votingAction, setVotingAction] = useState<'up' | 'down' | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // --- SUCCESS TOASTS ---
  useEffect(() => {
    if (isSuccess) {
      if (votingAction) {
        toast.success(votingAction === 'up' ? 'Upvoted Successfully!' : 'Downvoted Successfully!');
        setVotingAction(null);
      } else if (isAcknowledging) {
        toast.success('Ticket Acknowledged!');
        setIsAcknowledging(false);
      }

      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, votingAction, isAcknowledging]);

  const handleVote = async (upvote: boolean) => {
    if (hasVoted) return;
    try {
      setVotingAction(upvote ? 'up' : 'down');
      await vote(ticketId, upvote);
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error(error.message || 'Voting failed');
      setVotingAction(null);
    }
  };

  const handleAcknowledge = async () => {
    try {
      setIsAcknowledging(true);
      await acknowledgeTicket(ticketId);
    } catch (error: any) {
      console.error('Acknowledge error:', error);
      toast.error(error.message || 'Action failed');
      setIsAcknowledging(false);
    }
  };

  const handleApprove = async (targetAmount: string, startTime: string, endTime: string) => {
    try {
      const startTimestamp = BigInt(Math.floor(new Date(startTime).getTime() / 1000));
      const endTimestamp = BigInt(Math.floor(new Date(endTime).getTime() / 1000));
      await approveTicket(ticketId, targetAmount, startTimestamp, endTimestamp);
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.message || 'Approval failed');
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
    status,
    acknowledged
  ] = ticket;

  const title = decodeBytes32String(titleHex);
  const description = decodeBytes32String(descHex);
  const statusNum = Number(status);

  const safeRaised = raisedAmount ? BigInt(raisedAmount) : BigInt(0);
  const safeTarget = targetAmount ? BigInt(targetAmount) : BigInt(0);
  const safeVotes = votes ? Number(votes) : 0;
  const displayRaised = (statusNum > 1 && safeRaised === BigInt(0)) ? safeTarget : safeRaised;

  const statusMap = ["Pending", "Fundraising", "Project Pending", "Completed"];
  const statusColors = [
    "bg-yellow-100 text-yellow-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-green-100 text-green-800"
  ];

  const isActionLoading = isPending || isConfirming;
  const isAdmin = userRole === 1;

  // --- CHECK IF CURRENT USER IS CREATOR ---
  const isCreator = address && creator && address.toLowerCase() === creator.toLowerCase();

  const progressPercent = Math.min((Number(safeRaised) / (Number(safeTarget) || 1)) * 100, 100);

  return (
    <>
      <div className="bg-white border border-gray-200 h-[280px] rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between relative overflow-hidden">

        {acknowledged && (
          <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
            <CheckCircleOutlined /> Resolved
          </div>
        )}

        <span className='hidden'>{creator} {approver}</span>
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[statusNum] || 'bg-gray-100'}`}>
              {statusMap[statusNum] || "Unknown"}
            </span>

            <div className="flex items-center gap-2 mt-6 sm:mt-0">
              <span className="text-xs text-gray-400">#{ticketId.toString()}</span>

              {/* 1. Admin Approve Button (Only visible to Admin when Pending) */}
              {isAdmin && statusNum === 0 && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="bg-[#7D8CA3] hover:bg-[#596576] cursor-pointer text-white px-2 py-1.5 rounded text-xs font-semibold transition-all active:scale-95"
                >
                  Approve
                </button>
              )}

          
              {isCreator && statusNum === 3 && !acknowledged && (
                <button
                  onClick={handleAcknowledge}
                  disabled={isActionLoading}
                  className="bg-white border border-[#7D8CA3] hover:border-[#596576] hover:scale-105 cursor-pointer text-black px-2 py-1.5 rounded text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                  title="Confirm you have received the project/funds"
                >
                  {isActionLoading && isAcknowledging ? <LoadingOutlined /> : <CheckOutlined />}
                  Acknowledge
                </button>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#596576] mb-2 truncate">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-100">
          {/* Status 0: PENDING */}
          {statusNum === 0 && (
            <div className="flex items-center justify-between">
              <div className='flex flex-col'>
                <span className="text-sm text-gray-500">Votes:</span>
                {hasVoted && <span className="text-[10px] text-green-600 font-bold">You voted</span>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(true)}
                  disabled={isActionLoading || hasVoted}
                  className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${isActionLoading && votingAction === 'up'
                      ? 'bg-green-100 text-green-600'
                      : hasVoted
                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                >
                  {isActionLoading && votingAction === 'up' ? <LoadingOutlined /> : <LikeOutlined className="text-lg" />}
                </button>

                <span className={`font-semibold min-w-5 text-center ${safeVotes > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {safeVotes}
                </span>

                <button
                  onClick={() => handleVote(false)}
                  disabled={isActionLoading || hasVoted}
                  className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${isActionLoading && votingAction === 'down'
                      ? 'bg-red-100 text-red-600'
                      : hasVoted
                        ? 'opacity-30 cursor-not-allowed text-gray-400'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                  {isActionLoading && votingAction === 'down' ? <LoadingOutlined /> : <DislikeOutlined className="text-lg" />}
                </button>
              </div>
            </div>
          )}

          {/* Status 1: FUNDRAISING */}
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
                  <span className="text-gray-900 font-bold">{formatEther(safeRaised)} ETH</span>
                  <span>of {formatEther(safeTarget)} ETH</span>
                </div>

                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setShowManageModal(true)}
                      className="bg-gray-800 cursor-pointer hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      Close
                    </button>
                  )}
                  <button
                    onClick={() => setShowFundModal(true)}
                    className="bg-[#596576] cursor-pointer hover:bg-[#7D8CA3] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm active:scale-95"
                  >
                    Contribute
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status > 1: GOAL MET / COMPLETED */}
          {statusNum > 1 && (
            <div className="w-full">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Total Raised</span>
                  <span className="text-base font-600 text-gray-500 tracking-tight">
                    {formatEther(displayRaised)} ETH
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Votes</span>
                  <span className="text-base font-600 text-gray-800 tracking-tight">{safeVotes}</span>
                </div>
              </div>

              {isAdmin && statusNum === 2 && (
                <button
                  onClick={() => setShowManageModal(true)}
                  className="w-full cursor-pointer mt-3 bg-gray-800 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded transition-colors"
                >
                  Manage
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showApproveModal && (
          <ApproveModal
            key="approve-modal"
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
            key="fund-modal"
            ticketId={ticketId}
            ticketTitle={title}
            onClose={() => setShowFundModal(false)}
          />
        )}

        {showManageModal && (
          <ManageProjectModal
            key="manage-modal"
            ticketId={ticketId}
            status={statusNum}
            ticketTitle={title}
            raisedAmount={safeRaised}
            targetAmount={safeTarget}
            onClose={() => setShowManageModal(false)}
          />
        )}
      </AnimatePresence>
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

  // Helper to get formatted "YYYY-MM-DDTHH:mm" string for min attributes
  const getMinDateTime = () => {
    const now = new Date();
    // Adjust for timezone offset to ensure ISO string is local time
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // --- APPROVE SUCCESS LOGIC ---
  useEffect(() => {
    if (isSuccess && isSubmitting) {
      toast.success('Ticket Approved Successfully!');
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isSubmitting]);

  // --- INITIALIZE DATES ---
  useEffect(() => {
    // 1. Calculate time 2 hours from now
    const oneHoursFromNow = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // Adjust for local timezone offset before slicing to ISO string
    oneHoursFromNow.setMinutes(oneHoursFromNow.getMinutes() - oneHoursFromNow.getTimezoneOffset());

    setStartDate(oneHoursFromNow.toISOString().slice(0, 16));

    // 2. Leave End Date empty
    setEndDate('');
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

    // Allow a small buffer (e.g. 1 minute) for "now" validation in case user is slow to click
    if (start < now - 60000) {
      setLocalError('Start date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    await onApprove(targetAmount, startDate, endDate);
  };

  const isLoading = isPending || isConfirming || (isSuccess && isSubmitting);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}

      <span className='hidden'>{ticketId}</span>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Approve Ticket</h2>
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
            <span className="font-semibold">Issue:</span> {ticketTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount (ETH)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100"
              placeholder="e.g. 0.0002"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              min={getMinDateTime()}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100"
            />
            {/* <p className="text-xs text-gray-500 mt-1">Defaults to an hour from now</p> */}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDate}
              min={startDate || getMinDateTime()} // Ensure end date cannot be before start date
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100"
            />
          </div>

          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2">
              <span>⚠️ {localError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !targetAmount || !startDate || !endDate}
            className="w-full bg-[#596576] cursor-pointer hover:bg-[#7D8CA3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm text-base flex items-center justify-center gap-2"
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
              'Approve & Start Fundraising'
            )}
          </button>
        </form>
      </motion.div>
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

  // --- CREATE SUCCESS LOGIC ---
  useEffect(() => {
    if (isSuccess && isSubmitting) {
      toast.success('Concern Ticket Created Successfully!');
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isSubmitting]);

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Creation failed');
      setIsSubmitting(false);
    }
  };

  const isLoading = isPending || isConfirming || (isSuccess && isSubmitting);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <span
        className='hidden'
      >{hash}</span>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6"
      >
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none text-base disabled:bg-gray-100"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none resize-none text-base disabled:bg-gray-100"
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
                <LoadingOutlined className="text-lg" /> <span>Waiting...</span>
              </>
            ) : isConfirming ? (
              <>
                <LoadingOutlined className="text-lg" /> <span>Creating Ticket...</span>
              </>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </form>
      </motion.div>
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
          <div className="flex justify-center ">
            <Loader />
          </div>
        ) : ticketIds.length === 0 ? (
          <div className="text-center py-10 ">
            <p className="text-white text-lg">No concerns raised yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {ticketIds.map((id) => (
              <TicketItem key={id.toString()} ticketId={id} userRole={userRole} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateTicketForm key="create-ticket-modal" onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApproveModal;