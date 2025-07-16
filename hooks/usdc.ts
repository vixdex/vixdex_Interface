import {
  createWalletClient,
  custom,
  encodeFunctionData,
  WalletClient,
  Chain,
  TransactionExecutionError,
} from 'viem';
import { useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import {
  CHAIN_IDS_TO_USDC_ADDRESSES,
  CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES,
  CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES,
  DESTINATION_DOMAINS,
  SupportedChainId
} from '@/utils/constant';
import { getPublicClient } from '@/utils/getPublicClient';


type PrivyWalletParams = {
  chain: Chain;
  account: `0x${string}`;
};





export async function connectPrivyClient({ chain, account, wallets }: PrivyWalletParams & { wallets: any[] }): Promise<WalletClient> {
  if (!wallets || wallets.length === 0) {
    throw new Error('No wallet connected');
  }
  
  const wallet = wallets[0];
  if (!wallet.getEthereumProvider) {
    throw new Error('Wallet does not support getEthereumProvider');
  }

  const privyProvider = await wallet.getEthereumProvider();
  const transport = custom(privyProvider);

  return createWalletClient({
    chain,
    transport,
    account,
  });
}

// 1. ADD NETWORK SWITCHING TO YOUR APPROVAL FUNCTION
export async function approveUSDC({
  sourceChainId,
  chain,
  account,
    amount,
  wallets,
}: PrivyWalletParams & { sourceChainId: SupportedChainId; wallets: any[] }) {
  try {
  const usdcAddress = CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId] as `0x${string}`;
  const tokenMessenger = CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES[sourceChainId] as `0x${string}`;
    console.log('Starting USDC approval...', {
      sourceChainId,
      account,
     
    });

    // FIRST: Switch to the correct network
    await switchToNetwork(sourceChainId);

    // THEN: Connect to Privy client
    let client;
    try {
      client = await connectPrivyClient({ chain, account, wallets });
    } catch (error) {
      console.error('Failed to connect Privy client:', error);
      throw new Error(`Failed to connect wallet client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

     const txHash = await client.sendTransaction({
    chain,
    account,
    to: usdcAddress,
    data: encodeFunctionData({
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'approve',
      args: [tokenMessenger, amount],
    }),
  });

  console.log('Approval Tx:', txHash);
  return txHash;


  } catch (error) {
    console.error('approveUSDC failed:', error);
    throw error;
  }
}

// 2. NETWORK SWITCHING FUNCTION
export async function switchToNetwork(targetChainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Get current network
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainIdDecimal = parseInt(currentChainId, 16);
    
    console.log(`Current chain: ${currentChainIdDecimal}, Target chain: ${targetChainId}`);
    
    if (currentChainIdDecimal === targetChainId) {
      console.log('Already on correct network');
      return;
    }

    // Try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      console.log(`Successfully switched to chain ${targetChainId}`);
      
      // Wait a bit for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        console.log('Network not found, adding network...');
        await addNetwork(targetChainId);
      } else {
        console.error('Network switch failed:', switchError);
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
    
  } catch (error) {
    console.error('Network switching error:', error);
    throw new Error(`Network switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 3. ADD NETWORK FUNCTION (for networks not in MetaMask)
export async function addNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const networkConfigs: Record<number, any> = {
    84532: { // Base Sepolia
      chainId: '0x14a34',
      chainName: 'Base Sepolia',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia-explorer.base.org'],
    },
    8453: { // Base Mainnet
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    },
    // Add more networks as needed
  };

  const networkConfig = networkConfigs[chainId];
  if (!networkConfig) {
    throw new Error(`Network configuration not found for chain ID: ${chainId}`);
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });
    
    console.log(`Successfully added network ${chainId}`);
    
  } catch (error) {
    console.error('Failed to add network:', error);
    throw new Error(`Failed to add network: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Burn USDC
export async function burnUSDC({
  sourceChainId,
  destChainId,
  chain,
  account,
  destinationAddress,
  amount,
  wallets,
}: PrivyWalletParams & {
  sourceChainId: SupportedChainId;
  destChainId: SupportedChainId;
  destinationAddress: string;
  amount: bigint;
  wallets: any[];
}) {
  const client = await connectPrivyClient({ chain, account, wallets });
  const tokenMessenger = CHAIN_IDS_TO_TOKEN_MESSENGER_ADDRESSES[sourceChainId] as `0x${string}`;
  const usdc = CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId] as `0x${string}`;
  const destDomain = DESTINATION_DOMAINS[destChainId];

    const mintRecipient = `0x${destinationAddress
        .replace(/^0x/, "")
        .padStart(64, "0")}`;

  const MIN_FINALITY = 1000;
  const MAX_FEE = 500n;

  const txHash = await client.sendTransaction({
    chain,
    account,
    to: tokenMessenger,
    data: encodeFunctionData({
      abi: [
        {
          name: 'depositForBurn',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'destinationDomain', type: 'uint32' },
            { name: 'mintRecipient', type: 'bytes32' },
            { name: 'burnToken', type: 'address' },
            { name: 'destinationCaller', type: 'bytes32' },
            { name: 'maxFee', type: 'uint256' },
            { name: 'minFinalityThreshold', type: 'uint32' },
          ],
          outputs: [],
        },
      ],
      functionName: 'depositForBurn',
      args: [
        amount,
        destDomain,
        mintRecipient as Hex,
        usdc,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        MAX_FEE,
        MIN_FINALITY,
      ],
    }),
  });

  console.log('Burn Tx:', txHash);
  return txHash;
}

// Wait and retrieve attestation
export async function retrieveAttestation(
  txHash: string,
  sourceChainId: SupportedChainId
): Promise<{ message: `0x${string}`; attestation: `0x${string}` }> {
  const domain = DESTINATION_DOMAINS[sourceChainId];
  console.log(`🔍 Fetching attestation from: https://iris-api-sandbox.circle.com/v2/messages/${domain}?transactionHash=${txHash}`);

  const url = `https://iris-api-sandbox.circle.com/v2/messages/${domain}?transactionHash=${txHash}`;

  while (true) {
    try {
      console.log(`Fetching attestation from: ${url}`);
      const res = await axios.get(url);

      if (res.data?.messages?.[0]?.status === 'complete') {
        console.log('✅ Attestation received.');
        return res.data.messages[0];
        console.log(res.data.message[0])
      }

      console.log('⏳ Waiting for attestation...');
    } catch (err: any) {
      console.error('❌ Attestation fetch error:', err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}



// Utility function to switch chains
async function switchToChain(provider: any, chainId: number) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    console.error("Chain switch error:", error.message || error);
    throw error;
  }
}

// ✅ Mint USDC on destination chain


type AttestationData = {
  message: `0x${string}`;
  attestation: `0x${string}`;
};
export async function mintUSDC({
  destChainId,
  chain,
  account,
  attestation,
  wallets,
}: PrivyWalletParams & {
  destChainId: number;
  attestation: { message: `0x${string}`; attestation: `0x${string}` };
  wallets: any[];
}) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_BASE = 2000; // 2 seconds
  const GAS_BUFFER_PERCENTAGE = 20n;
  
  let retries = 0;

  // Validation
  const wallet = wallets?.[0];
  if (!wallet?.getEthereumProvider) {
    throw new Error("Privy wallet missing or invalid");
  }

  if (!CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[destChainId]) {
    throw new Error(`Unsupported destination chain: ${destChainId}`);
  }

  if (!attestation.message || !attestation.attestation) {
    throw new Error("Invalid attestation data");
  }

  const privyProvider = await wallet.getEthereumProvider();

  // Switch chain BEFORE creating client
  try {
    await switchToChain(privyProvider, destChainId);
  } catch (error) {
    throw new Error(`Failed to switch to chain ${destChainId}: ${error}`);
  }

  // Connect WalletClient for target chain
  const client = await connectPrivyClient({ chain, account, wallets });

  const contractConfig = {
    address: CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[destChainId] as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "receiveMessage",
        stateMutability: "nonpayable",
        inputs: [
          { name: "message", type: "bytes" },
          { name: "attestation", type: "bytes" },
        ],
        outputs: [],
      },
    ] as const,
  };

  const publicClient = getPublicClient(destChainId);

  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Attempting to mint USDC... (attempt ${retries + 1}/${MAX_RETRIES + 1})`);

      // Get latest fee data for each attempt
      const feeData = await publicClient.estimateFeesPerGas();
      
      // Validate fee data
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error("Unable to fetch gas fee data");
      }

      // Estimate gas with buffer
      const gasEstimate = await publicClient.estimateContractGas({
        ...contractConfig,
        functionName: "receiveMessage",
        args: [attestation.message, attestation.attestation],
        account: client.account,
      });

      const gasWithBuffer = (gasEstimate * (100n + GAS_BUFFER_PERCENTAGE)) / 100n;

      // Prepare transaction data
      const txData = encodeFunctionData({
        ...contractConfig,
        functionName: "receiveMessage",
        args: [attestation.message, attestation.attestation],
      });

      // Send transaction
      const tx = await client.sendTransaction({
        to: contractConfig.address,
        data: txData,
        gas: gasWithBuffer,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        account: client.account,
      });

      console.log('✅ Mint Tx successful:', tx);
      
      // Optionally wait for confirmation
      // const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      // console.log('✅ Transaction confirmed:', receipt);
      
      return tx;

    } catch (err) {
      console.error(`❌ Mint attempt ${retries + 1} failed:`, err);

      // Check if we should retry
      if (retries < MAX_RETRIES && shouldRetry(err)) {
        retries++;
        const delay = RETRY_DELAY_BASE * retries; // Linear backoff
        console.warn(`Retrying mintUSDC in ${delay}ms... (${retries}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed or non-retryable error
      const errorMessage = getErrorMessage(err);
      console.error('❌ Mint USDC failed permanently:', errorMessage);
      throw new Error(`USDC mint failed: ${errorMessage}`);
    }
  }

  throw new Error('USDC mint failed after maximum retries');
}

// Helper function to determine if error is retryable
function shouldRetry(error: any): boolean {
  const retryableErrors = [
    'TransactionExecutionError',
    'network error',
    'timeout',
    'gas limit',
    'nonce too low',
    'replacement transaction underpriced'
  ];

  const errorString = String(error).toLowerCase();
  return retryableErrors.some(retryable => errorString.includes(retryable));
}

// Helper function to extract meaningful error messages
function getErrorMessage(error: any): string {
  if (error?.message) return error.message;
  if (error?.reason) return error.reason;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

// Optional: Add transaction status checking
export async function waitForMintConfirmation(
  txHash: `0x${string}`,
  chainId: number,
  maxWaitTime = 300000 // 5 minutes
): Promise<any> {
  const publicClient = getPublicClient(chainId);
  
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: maxWaitTime,
    });
    
    console.log('✅ USDC mint confirmed:', receipt);
    return receipt;
  } catch (error) {
    console.error('❌ Failed to confirm USDC mint:', error);
    throw error;
  }
}