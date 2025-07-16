
export const fetchPairInitiatedEvents = async (): Promise<any[]> => {

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      }/api/events/latest?limit=100`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch events');
    }

    // Transform the data to match the expected format
    return data.data.map((event: any) => ({
      deriveToken: event.deriveToken,
      vixHighToken: event.vixHighToken,
      vixLowToken: event.vixLowToken,
      initiatedTime: event.initiatedTime,
      initiatedIV: event.initiatedIV,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};
