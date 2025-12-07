import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCollegeFundraiser, useUser } from '../hooks/useCollegeFundraiser';
import { CreateTicket } from '../components/CreateTicket';

const ROLES = [
  { value: 0, label: 'Student', description: 'Can create tickets and vote' },
  { value: 1, label: 'EXCO (Executive Committee)', description: 'Can approve tickets and manage fundraising' }
];

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const Home = () => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState(0);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const { address, isConnected } = useAccount();

  const {
    registerUser,
    isPending,
    isConfirming,
    isSuccess: isRegSuccess,
    error: writeError,
  } = useCollegeFundraiser();

  // FETCH USER DATA
  const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useUser(address as `0x${string}`);

  // Check Registration Status
  useEffect(() => {
    if (userData && userData[0]) {
      if (userData[0] !== ZERO_BYTES32) {
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (isRegSuccess) {
      refetchUser();
    }
  }, [isRegSuccess, refetchUser]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (name.length > 31) { setError('Name max 31 chars'); return; }

    try { await registerUser(name.trim(), selectedRole); }
    catch (err: any) { setError(err.message || 'Failed'); }
  };

  const resetForm = () => {
    setName('');
    setSelectedRole(0);
    setError('');
    window.location.reload();
  };

  // --- RENDER HELPERS ---

  const AuthCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center pt-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-[600px] border border-gray-100">
        <h2 className="text-2xl font-bold text-[#596576] mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <AuthCard title="Create a TangoH Account">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={31}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#596576] outline-none"
            disabled={isPending || isConfirming}
          />
          <p className="text-xs text-gray-500 mt-1">{name.length}/31 characters</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Role</label>
          <div className="space-y-3">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${selectedRole === role.value ? 'border-[#7c838e] bg-indigo-50 ring-1 ring-[#7c838e]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={() => setSelectedRole(role.value)}
                  className="mt-1 mr-3 text-[#7D8CA3] focus:ring-[#596576]"
                  disabled={isPending || isConfirming}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{role.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {(error || writeError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">⚠️ {error || writeError?.message}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || isConfirming || !name.trim()}
          className="w-full bg-[#7D8CA3] cursor-pointer hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl shadow-md"
        >
          {isPending ? 'Waiting...' : isConfirming ? 'Registering...' : 'Register'}
        </button>

        {isRegSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold mb-2">✅ Registration Successful!</p>
            <button onClick={resetForm} className="text-sm text-[#7D8CA3] hover:text-indigo-700 font-medium">Refresh</button>
          </div>
        )}
      </div>
    </AuthCard>
  );

  // --- LOADING STATE ---
  if (isConnected && isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D8CA3] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Blockchain Data...</p>
        </div>
      </div>
    );
  }

  // --- MAIN PAGE LAYOUT ---

  return (
    <div className="min-h-screen bg-[#7D8CA3] font-sans">
      {/* Main Content Area */}
      <main className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">

        {/* Logic Tree for Views */}
        {!isConnected ? (
          <AuthCard title="Welcome to TangoH">
            <div className="text-center space-y-4">
              <p className="text-[#7D8CA3]">Connect your wallet to raise or fund college concerns.</p>
              <div className="pt-2">
                <i className="text-[#a4b3c9] whitespace-nowrap">All interactions on TangoH are recorded on the Arbitrum Blockchain</i>              </div>
            </div>
          </AuthCard>
        ) : !isRegistered ? (
          renderRegistrationForm()
        ) : (
          /* 🚀 DASHBOARD VIEW - FULL WIDTH */
          <div className="w-full animate-fade-in">
            <CreateTicket />
          </div>
        )}

      </main>
    </div>
  );
};

export default Home;