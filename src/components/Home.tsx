import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCollegeFundraiser, useOwner, useUser } from '../hooks/useCollegeFundraiser';
import { CreateTicket } from '../components/CreateTicket'; // Import the new component
import { hexToString } from 'viem';

const ROLES = [
  { value: 0, label: 'Student', description: 'Can create tickets and vote' },
  { value: 1, label: 'EXCO (Executive Committee)', description: 'Can approve tickets and manage fundraising' }
];

// The "Empty" bytes32 hash returned by Stylus for non-existent strings
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const Home = () => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState(0);
  const [error, setError] = useState('');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [needsInit, setNeedsInit] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const {
    init,
    registerUser,
    isPending,
    isConfirming,
    isSuccess: isRegSuccess,
    error: writeError,
    hash
  } = useCollegeFundraiser();

  const { data: owner, isLoading: isLoadingOwner } = useOwner();
  
  // FETCH USER DATA
  const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useUser(address as `0x${string}`);

  // Check Registration Status
  useEffect(() => {
    if (userData && userData[0]) {
      // Check if the name hash is NOT the zero hash
      if (userData[0] !== ZERO_BYTES32) {
        setIsRegistered(true);
        try {
            // Attempt to make the bytes32 name readable
            setRegisteredName(hexToString(userData[0], { size: 32 }).replace(/\0/g, ''));
        } catch (e) {
            setRegisteredName('User');
        }
      } else {
        setIsRegistered(false);
      }
    }
  }, [userData]);

  // Check initialization (Previous logic maintained)
  useEffect(() => {
    if (owner) {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const isInitialized = owner !== zeroAddress;
      setNeedsInit(!isInitialized);
    }
  }, [owner]);

  // Refetch user if registration was successful
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
    window.location.reload(); // Simple reload to refresh state
  };

  // --- RENDER HELPERS ---

  const renderConnectWallet = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800 mb-3">Connect your wallet to continue</p>
        <div className="flex flex-col gap-2">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
        {connectError && <p className="text-xs text-red-600 mt-2">{connectError.message}</p>}
      </div>
    </div>
  );

  const renderInitialization = () => (
    <div className="space-y-6">
       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
         <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Contract Not Initialized</p>
         <p className="text-xs text-yellow-700">Only the deployer should do this once.</p>
       </div>
       <div>
         <label className="block text-sm font-semibold text-gray-700 mb-2">Escrow Address</label>
         <input
           type="text"
           value={escrowAddress}
           onChange={(e) => setEscrowAddress(e.target.value)}
           placeholder="0x..."
           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
           disabled={isPending || isConfirming}
         />
       </div>
       {(error || writeError) && <p className="text-sm text-red-800">⚠️ {error || writeError?.message}</p>}
       <button
         onClick={handleInit}
         disabled={isPending || isConfirming || !escrowAddress.trim()}
         className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg"
       >
         {isPending ? 'Waiting...' : isConfirming ? 'Initializing...' : 'Initialize Contract'}
       </button>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={31}
          placeholder="Enter your name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isPending || isConfirming}
        />
        <p className="text-xs text-gray-500 mt-1">{name.length}/31 characters</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Your Role</label>
        <div className="space-y-3">
          {ROLES.map((role) => (
            <label
              key={role.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => setSelectedRole(role.value)}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                disabled={isPending || isConfirming}
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{role.label}</p>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg"
      >
        {isPending ? 'Waiting...' : isConfirming ? 'Registering...' : 'Register'}
      </button>

      {isRegSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold mb-2">✅ Registration Successful!</p>
          <button onClick={resetForm} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Refresh</button>
        </div>
      )}
    </div>
  );

  // --- MAIN RENDER ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">College Fundraiser</h1>
          {isConnected && isRegistered && (
             <p className="text-indigo-600 font-medium">Welcome back, {registeredName}</p>
          )}
        </div>

        {!isConnected ? (
          renderConnectWallet()
        ) : isLoadingOwner || isLoadingUser ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading Data...</p>
          </div>
        ) : (
          <>
            {/* Header: Connected Account Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div>
                   <p className="text-xs text-gray-500 uppercase font-bold">Connected</p>
                   <p className="text-sm font-mono text-gray-700">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>
                <button onClick={() => disconnect()} className="text-xs text-red-500 hover:text-red-700 font-medium">Disconnect</button>
            </div>

            {/* Content Logic */}
            {needsInit ? (
                renderInitialization()
            ) : isRegistered ? (
                // 🚀 SHOW CREATE TICKET COMPONENT IF REGISTERED
                <CreateTicket />
            ) : (
                // OTHERWISE SHOW REGISTRATION
                renderRegistrationForm()
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;