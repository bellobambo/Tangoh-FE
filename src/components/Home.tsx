import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCollegeFundraiser, useUser } from '../hooks/useCollegeFundraiser';
import { CreateTicket } from '../components/CreateTicket';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
// import Loader from './Loader';

const ROLES = [
  { value: 0, label: 'Student', description: 'Can create tickets and vote' },
  { value: 1, label: 'EXCO (Executive Committee)', description: 'Manage ticket & funding' }
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

  // const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useUser(address as `0x${string}`);
  const { data: userData, isLoading: isLoadingUser } = useUser(address as `0x${string}`);

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
      toast.success('Registration Successful!');

      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isRegSuccess]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (name.length > 31) { setError('Name max 31 chars'); return; }

    try { await registerUser(name.trim(), selectedRole); }
    catch (err: any) { setError(err.message || 'Failed'); }
  };


  const AuthCard = ({ title, children, layoutKey }: { title: string, children: React.ReactNode, layoutKey: string }) => (
    <div className="flex flex-col items-center justify-center pt-10 px-4">

      
      <motion.div
        key={layoutKey}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-[600px] border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-[#596576] mb-6 text-center">{title}</h2>
        {children}
      </motion.div>
    </div>
  );

  const renderRegistrationForm = () => (
    <AuthCard title="Create a TangoH Account" layoutKey="register">
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
          className="w-full bg-[#7D8CA3] cursor-pointer hover:bg-[#596576] disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors"
        >
          {isPending ? 'Loading...' : isConfirming ? 'Registering...' : 'Register'}
        </button>

      </div>
    </AuthCard>
  );

  if (isConnected && isLoadingUser) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">


          <div className="flex items-center justify-center h-12 w-12 mx-auto mb-4 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-white"></span>
          </div>

          <p className="text-white">Loading Blockchain Data...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#7D8CA3] ">
      <main className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <AuthCard title="Welcome to TangoH" layoutKey="welcome" key="welcome">
              <div className="text-center space-y-4">
                <p className="text-[#7D8CA3]">Connect your wallet to raise or fund college concerns.</p>
                <div className="pt-2">
                  <i className="text-[#a4b3c9] whitespace-nowrap">All interactions on TangoH are recorded on the Arbitrum Blockchain</i>
                </div>
              </div>
            </AuthCard>
          ) : !isRegistered ? (
            <div key="reg-form">{renderRegistrationForm()}</div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <CreateTicket />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default Home;