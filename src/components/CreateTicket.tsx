import { useState } from 'react';
import { useCollegeFundraiser } from '../hooks/useCollegeFundraiser';

export const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

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

    // Bytes32 limit check
    if (title.length > 31 || description.length > 31) {
      setLocalError('Title and Description must be 31 characters or less');
      return;
    }

    try {
      await createTicket(title, description);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎉</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Ticket Created!</h3>
        <p className="text-gray-600 mb-4">Your proposal has been submitted successfully.</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 font-medium underline"
        >
          Create Another Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create a Proposal</h2>
        <p className="text-gray-600 text-sm">Submit a new ticket for fundraising</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={31}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="e.g. Library Solar Panels"
            disabled={isPending || isConfirming}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {title.length}/31
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={31}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            placeholder="Short description of the goal..."
            disabled={isPending || isConfirming}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {description.length}/31
          </div>
        </div>

        {(localError || error) && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            ⚠️ {localError || error?.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming || !title || !description}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg transform active:scale-95"
        >
          {isPending ? 'Check Wallet...' : isConfirming ? 'Creating Ticket...' : 'Create Ticket'}
        </button>

        {hash && (
          <div className="text-center mt-2">
             <a
                href={`https://sepolia.arbiscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                View Transaction
              </a>
          </div>
        )}
      </form>
    </div>
  );
};