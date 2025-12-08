import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { hexToString, formatEther } from 'viem' // 1. Added formatEther
import toast from 'react-hot-toast'
import ConnectWalletButton from './ConnectWalletButton'
import { useUser } from '../hooks/useCollegeFundraiser'

const Navbar = () => {
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()

    // 1. Fetch Wallet Balance
    const { data: balanceData, isLoading: balanceLoading } = useBalance({
        address: address,
    })

    // State to store the decoded name and role
    const [registeredName, setRegisteredName] = useState('')
    const [userRole, setUserRole] = useState('')

    // Fetch user data directly in Navbar
    const { data: userData } = useUser(address)

    // 2. Fix: Explicitly type this object so generic numbers can index it
    const ROLE_MAP: Record<number, string> = {
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

    const handleCopyAddress = async () => {
        if (address) {
            try {
                await navigator.clipboard.writeText(address);
                toast.success('Address Copied!');
            } catch (err) {
                console.error('Failed to copy!', err);
                toast.error('Failed to copy');
            }
        }
    }

    return (
        <nav className="bg-white shadow-lg py-2 border-b-[#7D8CA3] sticky top-0 z-50">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Side: Logo & Links */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">


                            <span className="text-xl font-bold text-[#7D8CA3] flex items-center">
                                Tang
                                <span className="bg-[#7D8CA3] text-white px-1 ml-0.5">
                                    oH
                                </span>
                            </span>
                        </Link>
                    </div>

                    {/* Right Side: Wallet & User Profile */}
                    <div className="flex items-center gap-4">
                        {isConnected ? (
                            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">

                                {/* User Info */}
                                <div className="text-right hidden sm:block">
                                    {registeredName && (
                                        <div className="flex flex-col items-end justify-center h-full">

                                            {/* --- ROW 1: Name . Role --- */}
                                            <div className="flex items-center gap-2 leading-none mb-1">
                                                {/* Name */}
                                                <span className="text-sm font-bold text-gray-900">
                                                    {registeredName}
                                                </span>

                                                {/* Dot */}
                                                <span className="text-gray-400 text-[10px]">•</span>

                                                {/* Role */}
                                                <span className="uppercase text-[10px] font-bold tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {userRole || 'USER'}
                                                </span>
                                            </div>

                                            {/* --- ROW 2: Wallet . Balance --- */}
                                            <div className="flex items-center gap-2 text-[16px] font-mono text-gray-500">

                                                {/* Wallet Address */}
                                                <button
                                                    onClick={handleCopyAddress}
                                                    className="hover:text-[#596576] transition-colors cursor-pointer border-b border-transparent hover:border-[#596576] focus:outline-none"
                                                    title="Copy Address"
                                                >
                                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                                </button>

                                                {/* Dot */}
                                                <span className="text-gray-300">•</span>

                                                {/* Balance - 3. Fix: Use formatEther(value) */}
                                                <span className="text-[#596576] text-[16px] font-bold">
                                                    {balanceLoading || !balanceData
                                                        ? '...'
                                                        : `${Number(formatEther(balanceData.value)).toFixed(4)} ${balanceData.symbol}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-[#7D8CA3] font-bold text-sm border-2 border-white shadow-sm ring-1 ring-gray-100">
                                    {registeredName ? registeredName[0].toUpperCase() : 'U'}
                                </div>

                                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                                <button
                                    onClick={() => disconnect()}
                                    className="text-[14px] font-semibold cursor-pointer text-gray-400 hover:text-red-500 px-2 py-1 transition-colors"
                                >
                                    Disconnet
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