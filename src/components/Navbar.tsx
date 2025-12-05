import { Link } from 'react-router-dom'
import ConnectWalletButton from './ConnectWalletButton'

const Navbar = () => {
    return (
        <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className=" px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-gray-800">
                            TangoH
                        </Link>
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link
                                to="/"
                                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                            >
                                Home
                            </Link>
                     
                        </div>
                    </div>
                    <div className="flex items-center">
                        <ConnectWalletButton />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar