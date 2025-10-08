import { NextRequest, NextResponse } from 'next/server';
import { setHighestTokenId, getAllTokenIds } from '@/lib/tokenIdManager';

// Initialize token IDs from known NFTs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { knownNFTs } = body;

    if (!Array.isArray(knownNFTs)) {
      return NextResponse.json(
        { error: 'knownNFTs must be an array' },
        { status: 400 }
      );
    }

    // Process each NFT to find the highest token ID per policy
    const tokenIdsByPolicy = new Map<string, number>();
    
    knownNFTs.forEach((nftCandidate) => {
      if (!nftCandidate || typeof nftCandidate !== 'object') {
        return;
      }

      const nft = nftCandidate as {
        policyId?: unknown;
        tokenId?: unknown;
        serialNumber?: unknown;
      };

      const policyId = typeof nft.policyId === 'string' ? nft.policyId : undefined;
      const tokenIdRaw = typeof nft.tokenId === 'string'
        ? nft.tokenId
        : typeof nft.serialNumber === 'string'
          ? nft.serialNumber
          : undefined;

      if (policyId && tokenIdRaw) {
        const tokenId = parseInt(tokenIdRaw || '0', 10);
        if (!isNaN(tokenId) && tokenId > 0) {
          const current = tokenIdsByPolicy.get(policyId) || 0;
          tokenIdsByPolicy.set(policyId, Math.max(current, tokenId));
        }
      }
    });

    // Update the manager with all found token IDs
    let updatedCount = 0;
    for (const [policyId, highestTokenId] of tokenIdsByPolicy.entries()) {
      setHighestTokenId(policyId, highestTokenId);
      updatedCount++;
      console.log('Initialized token ID for policy:', policyId, 'highest:', highestTokenId);
    }

    return NextResponse.json({
      success: true,
      message: `Initialized ${updatedCount} policy token IDs`,
      tokenIds: Object.fromEntries(getAllTokenIds())
    });

  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize token IDs' },
      { status: 500 }
    );
  }
}

// Get current token ID state
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      tokenIds: Object.fromEntries(getAllTokenIds())
    });
  } catch (error) {
    console.error('Get init state error:', error);
    return NextResponse.json(
      { error: 'Failed to get token ID state' },
      { status: 500 }
    );
  }
}
