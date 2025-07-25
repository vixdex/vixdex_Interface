import {
  supabase,
  TABLES,
  NewPairInitiatedEvent,
  PairInitiatedEvent,
} from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Type for the real-time subscription payload
type EventInsertPayload = {
  new: NewPairInitiatedEvent;
  old: Record<string, any>;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  errors: Error[] | null;
};

export const saveEvents = async (events: NewPairInitiatedEvent[]) => {
  if (events.length === 0) return [];

  // Batch events in chunks of 100 to avoid hitting Supabase limits
  const BATCH_SIZE = 100;
  const results: PairInitiatedEvent[] = [];

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from(TABLES.PAIR_EVENTS)
      .upsert(batch, { onConflict: 'transaction_hash' })
      .select();

    if (error) {
      console.error('Error saving events batch:', error);
      throw error;
    }

    results.push(...(data || []));
  }

  return results;
};

export const getLatestBlock = async (): Promise<number> => {
  const { data, error } = await supabase
    .from(TABLES.PAIR_EVENTS)
    .select('block_number')
    .order('block_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;
  return data.block_number;
};

let realtimeChannel: RealtimeChannel | null = null;

export const subscribeToNewEvents = (
  callback: (payload: { new: PairInitiatedEvent }) => void
) => {
  // Only create one channel per page load
  if (!realtimeChannel) {
    const subscription = supabase
      .channel('pair_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.PAIR_EVENTS,
        },
        (payload) => {
          try {
            // Cast the payload to our expected type
            const insertPayload = payload as unknown as EventInsertPayload;

            // Ensure the payload has the expected structure
            if (insertPayload?.new) {
              const dbEvent = insertPayload.new;

              // Create a new event object with all required fields
              const event: PairInitiatedEvent = {
                // Map database fields to application model
                deriveToken: String(dbEvent.derive_token || ''),
                vixHighToken: String(dbEvent.vix_high_token || ''),
                vixLowToken: String(dbEvent.vix_low_token || ''),
                initiatedTime: Math.floor(
                  new Date(dbEvent.initiated_time || now).getTime() / 1000
                ),
                initiatedIV: Number(dbEvent.initiated_iv || 0),
                blockNumber: Number(dbEvent.block_number || 0),
                transactionHash: String(dbEvent.transaction_hash || ''),
              };

              // Call the callback with the properly typed event
              callback({ new: event });
            }
          } catch (error) {
            console.error('Error processing real-time event:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error:', err);
        } else if (status === 'CLOSED') {
          console.log('Realtime channel closed');
          realtimeChannel = null;
        }
      });

    realtimeChannel = subscription;
  }

  // Return cleanup function
  return () => {
    if (realtimeChannel) {
      realtimeChannel
        .unsubscribe()
        .then(() => {
          console.log('Unsubscribed from real-time updates');
          realtimeChannel = null;
        })
        .catch((error) => {
          console.error('Error unsubscribing:', error);
        });
    }
  };
};
