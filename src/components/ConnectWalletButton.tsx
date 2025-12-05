import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectWalletButton = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors.find(c => c.id === 'injected');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isMounted) {
    return (
      <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed" disabled>
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          {formatAddress(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        disabled={isConnecting || isPending}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isConnecting || isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-1">
          Error: {error.message}
        </div>
      )}
      
      {!injectedConnector && (
        <div className="text-yellow-600 text-sm mt-1">
          Please install a wallet like MetaMask
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;