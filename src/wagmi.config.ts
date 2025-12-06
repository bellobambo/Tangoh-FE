import { createConfig, http } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, sepolia, arbitrumSepolia],
  connectors: [injected()], 
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});