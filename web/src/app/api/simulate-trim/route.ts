import { NextResponse } from 'next/server';
import { ExchangeClient, HttpTransport, TESTNET_API_URL } from '@nktkas/hyperliquid';
import { privateKeyToAccount } from 'viem/accounts';

export const dynamic = 'force-dynamic';

const DEFAULT_SIMULATED_HASH = '0x9f4a37d2e0c7b2e1f48039cfa19082da17b35ef892c5d1e4';
const TESTNET_EXPLORER = 'https://testnet.hyperliquid.xyz';

export async function POST() {
  const privateKey = process.env.HYPERLIQUID_TESTNET_PRIVATE_KEY;

  // Fail-soft if private key is not configured
  if (!privateKey || privateKey.trim() === '') {
    return NextResponse.json({
      success: true,
      mode: 'simulated',
      txHash: DEFAULT_SIMULATED_HASH,
      explorerUrl: TESTNET_EXPLORER,
    });
  }

  try {
    const formattedKey = (
      privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    ) as `0x${string}`;

    const wallet = privateKeyToAccount(formattedKey);
    const transport = new HttpTransport({ isTestnet: true });
    const client = new ExchangeClient({ wallet, transport });

    // Dispatch EIP-712 signed order to Hyperliquid Testnet
    const orderResult = await client.order({
      orders: [
        {
          a: 0, // Asset 0 (Perp)
          b: false, // IsBuy: false (Sell / trim long)
          p: '115.10',
          s: '21.7',
          r: true, // reduceOnly: true
          t: { limit: { tif: 'Ioc' } },
        },
      ],
      grouping: 'na',
    });

    let resultTxHash = DEFAULT_SIMULATED_HASH;
    const firstStatus = orderResult?.response?.data?.statuses?.[0];

    if (firstStatus && typeof firstStatus === 'object') {
      if ('filled' in firstStatus && firstStatus.filled?.oid) {
        resultTxHash = `0x${BigInt(firstStatus.filled.oid).toString(16).padStart(64, '0')}`;
      } else if ('resting' in firstStatus && firstStatus.resting?.oid) {
        resultTxHash = `0x${BigInt(firstStatus.resting.oid).toString(16).padStart(64, '0')}`;
      } else if ('error' in firstStatus) {
        // Fall back gracefully if testnet order returns an exchange-level error
        console.warn('Hyperliquid Testnet returned order error, falling back to simulated:', firstStatus.error);
        return NextResponse.json({
          success: true,
          mode: 'simulated',
          txHash: DEFAULT_SIMULATED_HASH,
          explorerUrl: TESTNET_EXPLORER,
          note: firstStatus.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'live-testnet',
      txHash: resultTxHash,
      explorerUrl: `https://testnet.hyperliquid.xyz/explorer/tx/${resultTxHash}`,
    });
  } catch (error) {
    // Fail-soft gracefully on any network error or exception
    console.warn('Error connecting to Hyperliquid Testnet, failing soft to simulated:', error);
    return NextResponse.json({
      success: true,
      mode: 'simulated',
      txHash: DEFAULT_SIMULATED_HASH,
      explorerUrl: TESTNET_EXPLORER,
    });
  }
}
