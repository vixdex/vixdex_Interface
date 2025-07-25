import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Helper function to add timeout to promises
const withTimeout = <T,>(
  promise: Promise<T>,
  timeout: number,
  errorMessage = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeout)
    )
  ]);
};

export function useTokenData(poolAddress: string) {
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWithRetry = async (fn: () => Promise<any>, retries = 1, delay = 1000) => {
    try {
      return await withTimeout(fn(), 10000); // 10 second timeout
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 1.5);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchTokenData = async () => {
      if (!poolAddress) return;
      
      console.log('Starting to fetch token data for pool:', poolAddress);
      
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Use public RPC provider for read-only operations
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL,
          undefined, // Let ethers detect the network
          { staticNetwork: true }
        );
        
        // Ensure the provider is ready
        await provider.ready;

        console.log('Provider created, fetching contract data...');

        const VIX_CONTRACT_ABI = [
          'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1, address _poolAddress)',
          'function vixTokensPrice(uint contractHoldings) view returns(uint)',
        ];

        // Create read-only contract instance
        const vixContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
          VIX_CONTRACT_ABI,
          provider
        );

        console.log('Fetching VIX data...');
        // Fetch VIX data with retry
        const vixData = await fetchWithRetry(
          () => vixContract.getVixData(poolAddress),
          2 // 2 retries
        );
        console.log('VIX data received:', vixData);

        const MockPool_ABI = [
          'function getRealPoolAddress() external view returns (address)',
        ];

        console.log('Creating mock pool contract...');
        // Create read-only contract instance for mock pool
        const mockPoolContract = new ethers.Contract(
          poolAddress,
          MockPool_ABI,
          provider
        );

        console.log('Fetching real pool address...');
        // Get real pool address with retry
        const realPoolAddress = await fetchWithRetry(
          () => mockPoolContract.getRealPoolAddress(),
          2 // 2 retries
        );
        console.log('Real pool address:', realPoolAddress);

        console.log('Fetching token prices...');
        // Fetch token prices with retry
        const [token0Price, token1Price] = await Promise.all([
          fetchWithRetry(
            () => vixContract.vixTokensPrice(vixData._contractHoldings0),
            2
          ),
          fetchWithRetry(
            () => vixContract.vixTokensPrice(vixData._contractHoldings1),
            2
          ),
        ]);
        console.log('Token prices fetched:', { token0Price, token1Price });

        if (isMounted) {
          setTokenData({
            vixData,
            realPoolAddress,
            token0Price,
            token1Price,
          });
        }
      } catch (err) {
        console.error('Error in fetchTokenData:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch token data'));
          // Auto-retry after 5 seconds if there's an error
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 5000);
          return () => clearTimeout(timer);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTokenData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [poolAddress, retryCount]);

  // Log loading state changes
  useEffect(() => {
    if (loading) {
      console.log('Loading token data...');
    } else if (error) {
      console.warn('Error loading token data:', error);
    } else if (tokenData) {
      console.log('Token data loaded successfully:', tokenData);
    }
  }, [loading, error, tokenData]);

  return { 
    data: tokenData, 
    loading, 
    error,
    retry: () => setRetryCount(prev => prev + 1)
  };
}
