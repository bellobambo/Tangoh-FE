import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCollegeFundraiser, useOwner } from '../hooks/useCollegeFundraiser';

const ROLES = [
  { value: 0, label: 'Student', description: 'Can create tickets and vote' },
  { value: 1, label: 'EXCO (Executive Committee)', description: 'Can approve tickets and manage fundraising' }
];

const Home = () => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState(0);
  const [error, setError] = useState('');
  const [escrowAddress, setEscrowAddress] = useState('');
  const [needsInit, setNeedsInit] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  const {
    init,
    registerUser,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError,
    hash
  } = useCollegeFundraiser();

  const { data: owner, isLoading: isLoadingOwner } = useOwner();

  // Check if contract needs initialization
  // Check if contract needs initialization
  useEffect(() => {
    if (owner) {
      // In Stylus/Solidity, an uninitialized address is 0x000...000
      const zeroAddress = '0x0000000000000000000000000000000000000000';

      // If the owner is NOT the zero address, it is initialized
      const isInitialized = owner !== zeroAddress;

      // If it is initialized, we don't need init
      setNeedsInit(!isInitialized);

      console.log("Owner fetched:", owner); // Debugging
      console.log("Is Initialized:", isInitialized); // Debugging
    }
  }, [owner]);

  const handleInit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!escrowAddress.trim()) {
      setError('Please enter an escrow address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(escrowAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    try {
      await init(escrowAddress as `0x${string}`);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Failed to initialize contract');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.length > 31) {
      setError('Name must be 31 characters or less (bytes32 limitation)');
      return;
    }

    try {
      await registerUser(name.trim(), selectedRole);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register user');
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedRole(0);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            College Fundraiser
          </h1>
          <p className="text-gray-600">
            {needsInit ? 'Initialize Contract' : 'Register to get started'}
          </p>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 mb-3">
                Connect your wallet to continue
              </p>

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

              {connectError && (
                <p className="text-xs text-red-600 mt-2">
                  {connectError.message}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-1 text-center">
              <p>📌 Network: Arbitrum Sepolia</p>
              <p>📝 Contract: 0xbf16...914d</p>
            </div>
          </div>
        ) : isLoadingOwner ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Checking contract status...</p>
          </div>
        ) : needsInit ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">Connected</p>
                  <p className="text-sm font-mono text-gray-700">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-semibold mb-2">
                ⚠️ Contract Not Initialized
              </p>
              <p className="text-xs text-yellow-700">
                This contract needs to be initialized before users can register.
                Only the deployer should do this once.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="escrow" className="block text-sm font-semibold text-gray-700 mb-2">
                  Escrow Address
                </label>
                <input
                  id="escrow"
                  type="text"
                  value={escrowAddress}
                  onChange={(e) => setEscrowAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
                  disabled={isPending || isConfirming}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the address that will hold escrowed funds
                </p>
              </div>

              {(error || writeError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ⚠️ {error || writeError?.message}
                  </p>
                </div>
              )}

              <button
                onClick={handleInit}
                disabled={isPending || isConfirming || !escrowAddress.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending && 'Waiting for approval...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && 'Initialize Contract'}
              </button>

              {hash && (
                <div className="text-center text-sm space-y-2">
                  <p className="text-gray-600">Transaction Hash:</p>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-mono text-xs break-all"
                  >
                    {hash}
                  </a>
                </div>
              )}

              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-semibold mb-2">
                    ✅ Contract Initialized!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Reloading page...
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">Connected</p>
                  <p className="text-sm font-mono text-gray-700">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={31}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isPending || isConfirming}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {name.length}/31 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Your Role
                </label>
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
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
                  <p className="text-sm text-red-800">
                    ⚠️ {error || writeError?.message}
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending || isConfirming || !name.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending && 'Waiting for approval...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && 'Register'}
              </button>

              {hash && (
                <div className="text-center text-sm space-y-2">
                  <p className="text-gray-600">Transaction Hash:</p>
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-mono text-xs break-all"
                  >
                    {hash}
                  </a>
                </div>
              )}

              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-semibold mb-2">
                    ✅ Registration Successful!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    You are now registered as a {ROLES[selectedRole].label}
                  </p>
                  <button
                    onClick={resetForm}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Register Another User
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Make sure you're connected to Arbitrum Sepolia network
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;