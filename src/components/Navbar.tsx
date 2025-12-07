import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { hexToString } from 'viem'
import toast from 'react-hot-toast' 
import ConnectWalletButton from './ConnectWalletButton'
import { useUser } from '../hooks/useCollegeFundraiser'

const Navbar = () => {
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()

    // State to store the decoded name and role
    const [registeredName, setRegisteredName] = useState('')
    const [userRole, setUserRole] = useState('')

    // Fetch user data directly in Navbar
    const { data: userData } = useUser(address as `0x${string}`)

    const ROLE_MAP: { [key: number]: string } = {
        0: 'Student',
        1: 'EXCO'
    };

    useEffect(() => {
        const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

        if (userData && userData[0] && userData[0] !== ZERO_BYTES32) {
            try {
                const decodedName = hexToString(userData[0], { size: 32 }).replace(/\0/g, '');
                setRegisteredName(decodedName);

                const roleIndex = Number(userData[1]); 
                const decodedRole = ROLE_MAP[roleIndex] || 'Student';
                setUserRole(decodedRole);
            } catch (e) {
                console.error("Error decoding user data", e);
            }
        } else {
            setRegisteredName('');
            setUserRole('');
        }
    }, [userData]);

    // Function to handle copying address using toast
    const handleCopyAddress = async () => {
        if (address) {
            try {
                await navigator.clipboard.writeText(address);
                toast.success('Address Copied!', {
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            } catch (err) {
                console.error('Failed to copy!', err);
                toast.error('Failed to copy');
            }
        }
    }

    return (
        <nav className="bg-white shadow-lg border-b-[#7D8CA3] sticky top-0 z-50">
            {/* Initialize the Toaster component */}
           

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Side: Logo & Links */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#7D8CA3]">TangoH</span>
                        </Link>
                    </div>

                    {/* Right Side: Wallet & User Profile */}
                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                                
                                {/* User Info */}
                                <div className="text-right hidden sm:block">
                                    {registeredName && (
                                        <div className="flex flex-col items-end">
                                            {/* Name on Top */}
                                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                                {registeredName}
                                            </p>
                                            
                                            {/* Address • Role on Bottom */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                
                                                {/* Clickable Address */}
                                                <button 
                                                    onClick={handleCopyAddress}
                                                    className="hover:text-[#596576]  transition-colors cursor-pointer border-b border-transparent hover:border-[#596576] text-[12px] focus:outline-none"
                                                    title="Click to copy address"
                                                >
                                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                                </button>

                                                {/* Dot Separator */}
                                                <span className="text-gray-400">•</span>

                                                {/* Role (Clean Style) */}
                                                {userRole && (
                                                    <span className="uppercase font-semibold tracking-wide text-gray-500">
                                                        {userRole}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Avatar / Blockie Placeholder */}
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-[#7D8CA3] font-bold text-xs border border-indigo-200">
                                    {registeredName ? registeredName[0].toUpperCase() : 'U'}
                                </div>

                                {/* Separator */}
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* Disconnect Button */}
                                <button
                                    onClick={() => disconnect()}
                                    className="text-xs font-semibold cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <ConnectWalletButton />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar