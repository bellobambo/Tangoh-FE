import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, stringToHex, padHex } from "viem";

const CONTRACT_ADDRESS =
  "0xbf16c7ca893c075758bc18f66d5a993372a6914d" as `0x${string}`;

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
      { type: "address" },
      { type: "address" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "int256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint8" },
    ],
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
      gas: BigInt(10_000_000),
    });
  };

  const createTicket = async (title: string, description: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createTicket",
      args: [stringToBytes32(title), stringToBytes32(description)],
    });
  };

  const vote = async (ticketId: bigint, upvote: boolean) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "vote",
      args: [ticketId, upvote],
    });
  };

  const fundTicket = async (ticketId: bigint, amount: string) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "fundTicket",
      args: [ticketId],
      value: parseEther(amount),
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
    });
  };

  return {
    init,
    registerUser,
    createTicket,
    vote,
    fundTicket,
    approveTicket,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

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

export function useUser(userAddress: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUser",
    args: [userAddress],
  });
}

export function useOwner() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getOwner",
  });
}
