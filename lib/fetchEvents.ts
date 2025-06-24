// lib/fetchEvents.ts
import { ethers, EventLog } from "ethers";

const RPC_URL = "https://rpc.buildbear.io/dual-magma-e6ae5bf5";

// Minimal ABI with only the event
const ABI = [
  "event PairInitiated(address indexed _deriveToken, address indexed _vixHighToken, address indexed _vixLowToken, uint256 _initiatedTime, uint256 initiatedIV)"
];

export interface PairInitiatedEvent {
  deriveToken: string;
  vixHighToken: string;
  vixLowToken: string;
  initiatedTime: number;
  initiatedIV: number;
  blockNumber: number;
  transactionHash: string;
}

export const fetchPairInitiatedEvents = async (): Promise<PairInitiatedEvent[]> => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!
, ABI, provider);

    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 5000); // Ensure we don't go below block 0

    console.log(`Fetching events from block ${fromBlock} to ${latestBlock}`);

    const events = await contract.queryFilter(
      contract.filters.PairInitiated(),
      fromBlock,
      latestBlock
    );

    console.log(`Found ${events.length} PairInitiated events`);

    return events.map((event) => {
      const eventLog = event as EventLog;
      
      return {
        deriveToken: eventLog.args._deriveToken,
        vixHighToken: eventLog.args._vixHighToken,
        vixLowToken: eventLog.args._vixLowToken,
        initiatedTime: Number(eventLog.args._initiatedTime),
        initiatedIV: Number(eventLog.args.initiatedIV),
        blockNumber: eventLog.blockNumber,
        transactionHash: eventLog.transactionHash,
      };
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

// Alternative function with custom block range
export const fetchPairInitiatedEventsWithRange = async (
  fromBlock: number,
  toBlock?: number
): Promise<PairInitiatedEvent[]> => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    const contract = new ethers.Contract(          process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
ABI, provider);

    const latestBlock = toBlock || await provider.getBlockNumber();

    console.log(`Fetching events from block ${fromBlock} to ${latestBlock}`);

    const events = await contract.queryFilter(
      contract.filters.PairInitiated(),
      fromBlock,
      latestBlock
    );

    console.log(`Found ${events.length} PairInitiated events`);

    return events.map((event) => {
      const eventLog = event as EventLog;
      
      return {
        deriveToken: eventLog.args._deriveToken,
        vixHighToken: eventLog.args._vixHighToken,
        vixLowToken: eventLog.args._vixLowToken,
        initiatedTime: Number(eventLog.args._initiatedTime),
        initiatedIV: Number(eventLog.args.initiatedIV),
        blockNumber: eventLog.blockNumber,
        transactionHash: eventLog.transactionHash,
      };
    });
  } catch (error) {
    console.error('Failed to fetch events with custom range:', error);
    throw error;
  }
};