import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, stringToHex, padHex } from "viem";

// Updated Contract Address
const CONTRACT_ADDRESS =
  "0xcDFb1272Fad230337C553e8c5649d5C5cf361f03" as `0x${string}`;

const CONTRACT_ABI = [
  {
    type: "function",
    name: "init",
    inputs: [{ name: "escrow", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "registerUser",
    inputs: [
      { name: "name", type: "bytes32" },
      { name: "role", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createTicket",
    inputs: [
      { name: "title", type: "bytes32" },
      { name: "description", type: "bytes32" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "ticket_id", type: "uint256" },
      { name: "upvote", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveTicket",
    inputs: [
      { name: "ticket_id", type: "uint256" },
      { name: "target_amount", type: "uint256" },
      { name: "start_time", type: "uint256" },
      { name: "end_time", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closeFundraising",
    inputs: [{ name: "ticket_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFunds",
    inputs: [
      { name: "ticket_id", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "markProjectComplete",
    inputs: [{ name: "ticket_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acknowledgeTicket",
    inputs: [{ name: "ticket_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundTicket",
    inputs: [{ name: "ticket_id", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getTicket",
    inputs: [{ name: "ticket_id", type: "uint256" }],
    outputs: [
      { type: "address" }, // creator
      { type: "address" }, // approver
      { type: "bytes32" }, // title
      { type: "bytes32" }, // description
      { type: "int256" }, // votes
      { type: "uint256" }, // target_amount
      { type: "uint256" }, // raised_amount
      { type: "uint8" }, // status
      { type: "bool" }, // acknowledged (NEW)
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      { name: "ticket_id", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUser",
    inputs: [{ name: "user_address", type: "address" }],
    outputs: [{ type: "bytes32" }, { type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTicketCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEscrowAccount",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
] as const;

export function useCollegeFundraiser() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stringToBytes32 = (str: string): `0x${string}` => {
    const hex = stringToHex(str.slice(0, 31));
    return padHex(hex, { size: 32, dir: "right" });
  };

  const init = async (escrowAddress: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "init",
      args: [escrowAddress],
    });
  };

  const registerUser = async (name: string, role: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "registerUser",
      args: [stringToBytes32(name), role],
      gas: BigInt(400_000),
    });
  };

  const createTicket = async (title: string, description: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createTicket",
      args: [stringToBytes32(title), stringToBytes32(description)],
      gas: BigInt(500_000),
    });
  };

  const vote = async (ticketId: bigint, upvote: boolean) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "vote",
      args: [ticketId, upvote],
      gas: BigInt(250_000),
    });
  };

  const fundTicket = async (ticketId: bigint, amount: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "fundTicket",
      args: [ticketId],
      value: parseEther(amount),
      gas: BigInt(250_000),
    });
  };

  const approveTicket = async (
    ticketId: bigint,
    targetAmount: string,
    startTime: bigint,
    endTime: bigint
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "approveTicket",
      args: [ticketId, parseEther(targetAmount), startTime, endTime],
      gas: BigInt(250_000),
    });
  };

  const closeFundraising = async (ticketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "closeFundraising",
      args: [ticketId],
      gas: BigInt(50_000),
    });
  };

  const withdrawFunds = async (ticketId: bigint, recipient: `0x${string}`) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "withdrawFunds",
      args: [ticketId, recipient],
      gas: BigInt(100_000),
    });
  };

  const markProjectComplete = async (ticketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "markProjectComplete",
      args: [ticketId],
      gas: BigInt(50_000),
    });
  };

  // --- NEW: Acknowledge Ticket ---
  const acknowledgeTicket = async (ticketId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "acknowledgeTicket",
      args: [ticketId],
      gas: BigInt(50_000),
    });
  };

  return {
    init,
    registerUser,
    createTicket,
    vote,
    fundTicket,
    approveTicket,
    closeFundraising,
    withdrawFunds,
    markProjectComplete,
    acknowledgeTicket, // Exported
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// --- Read Hooks ---

export function useTicket(ticketId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTicket",
    args: [ticketId],
  });
}

export function useTicketCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTicketCount",
  });
}

export function useUser(userAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUser",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

// --- NEW: Check if user has voted ---
export function useHasVoted(
  ticketId: bigint,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasVoted",
    args: userAddress ? [ticketId, userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useOwner() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getOwner",
  });
}
