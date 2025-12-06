import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { hexToString } from 'viem'
import ConnectWalletButton from './ConnectWalletButton'
import { useUser } from '../hooks/useCollegeFundraiser' // Ensure this path matches your project structure

const Navbar = () => {
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    
    // State to store the decoded name
    const [registeredName, setRegisteredName] = useState('')

    // Fetch user data directly in Navbar so it displays on every page
    const { data: userData } = useUser(address as `0x${string}`)

    useEffect(() => {
        const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
        
        if (userData && userData[0] && userData[0] !== ZERO_BYTES32) {
            try {
                // Decode the bytes32 name
                const decoded = hexToString(userData[0], { size: 32 }).replace(/\0/g, '');
                setRegisteredName(decoded);
            } catch (e) {
                console.error("Error decoding name", e);
            }
        } else {
            setRegisteredName('');
        }
    }, [userData]);

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Side: Logo & Links */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            {/* You can add an icon here if you want */}
                            <span className="text-xl font-bold text-indigo-600">TangoH</span>
                        </Link>
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link
                                to="/"
                                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                            >
                                Home
                            </Link>
                        </div>
                    </div>

                    {/* Right Side: Wallet & User Profile */}
                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                                {/* User Info */}
                                <div className="text-right hidden sm:block">
                                    {registeredName && (
                                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                            {registeredName}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 font-mono">
                                        {address?.slice(0, 6)}...{address?.slice(-4)}
                                    </p>
                                </div>

                                {/* Avatar / Blockie Placeholder */}
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200">
                                    {registeredName ? registeredName[0].toUpperCase() : 'U'}
                                </div>

                                {/* Separator */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Disconnect Button */}
                                <button 
                                    onClick={() => disconnect()}
                                    className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            // Show Connect Button if not connected
                            <ConnectWalletButton />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar