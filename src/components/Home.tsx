import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useCollegeFundraiser, useOwner, useUser } from '../hooks/useCollegeFundraiser';
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
  const [escrowAddress, setEscrowAddress] = useState('');
  const [needsInit, setNeedsInit] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // We don't need 'disconnect' here anymore since it's in the Navbar
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();

  const {
    init,
    registerUser,
    isPending,
    isConfirming,
    isSuccess: isRegSuccess,
    error: writeError,
  } = useCollegeFundraiser();

  const { data: owner, isLoading: isLoadingOwner } = useOwner();
  
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

  // Check initialization
  useEffect(() => {
    if (owner) {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const isInitialized = owner !== zeroAddress;
      setNeedsInit(!isInitialized);
    }
  }, [owner]);

  useEffect(() => {
    if (isRegSuccess) {
        refetchUser();
    }
  }, [isRegSuccess, refetchUser]);


  const handleInit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!escrowAddress.trim()) { setError('Please enter an escrow address'); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(escrowAddress)) { setError('Invalid address'); return; }
    try { await init(escrowAddress as `0x${string}`); } 
    catch (err: any) { setError(err.message || 'Failed'); }
  };

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

  // --- RENDER HELPERS (Wrapped in Cards for Login/Register) ---

  const AuthCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center pt-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );

  const renderConnectWallet = () => (
    <AuthCard title="Connect Wallet">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center mb-4">Please connect your wallet to access the fundraiser platform.</p>
        <div className="flex flex-col gap-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
        {connectError && <p className="text-xs text-red-600 mt-2 text-center">{connectError.message}</p>}
      </div>
    </AuthCard>
  );

  const renderInitialization = () => (
    <AuthCard title="Initialize Protocol">
       <div className="space-y-6">
       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
         <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Setup Required</p>
         <p className="text-xs text-yellow-700">Only the deployer should do this once.</p>
       </div>
       <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Escrow Address</label>
         <input
           type="text"
           value={escrowAddress}
           onChange={(e) => setEscrowAddress(e.target.value)}
           placeholder="0x..."
           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
           disabled={isPending || isConfirming}
         />
       </div>
       {(error || writeError) && <p className="text-sm text-red-800">⚠️ {error || writeError?.message}</p>}
       <button
         onClick={handleInit}
         disabled={isPending || isConfirming || !escrowAddress.trim()}
         className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl"
       >
         {isPending ? 'Waiting...' : isConfirming ? 'Initializing...' : 'Initialize Contract'}
       </button>
    </div>
    </AuthCard>
  );

  const renderRegistrationForm = () => (
    <AuthCard title="Create Account">
       <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={31}
          placeholder="Enter your name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${selectedRole === role.value ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => setSelectedRole(role.value)}
                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl shadow-md"
      >
        {isPending ? 'Waiting...' : isConfirming ? 'Registering...' : 'Complete Registration'}
      </button>

      {isRegSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold mb-2">✅ Registration Successful!</p>
          <button onClick={resetForm} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Refresh</button>
        </div>
      )}
    </div>
    </AuthCard>
  );

  // --- LOADING STATE ---
  if (isConnected && (isLoadingOwner || isLoadingUser)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
             <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading Blockchain Data...</p>
             </div>
        </div>
      );
  }

  // --- MAIN PAGE LAYOUT ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar removed from here. 
          Make sure <Navbar /> is present in your App.tsx layout wrapping this component 
      */}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Logic Tree for Views */}
        {!isConnected ? (
          renderConnectWallet()
        ) : needsInit ? (
          renderInitialization()
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