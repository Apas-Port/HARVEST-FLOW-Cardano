import { NextRequest, NextResponse } from 'next/server';

import { boolDataToBoolean, getOracleSnapshot, mintNftForProject, MintMetadataInput } from '@/lib/harvestflow-contract';
import { getProjectById, matchNFTPolicyIdWithProjects } from '@/lib/project';

export interface MintRequest {
  projectId: string;
  metadata: MintMetadataInput;
  quantity?: number;
  recipientAddress?: string;
  unitPrice?: number;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MintRequest;
    const projectId = body.projectId?.trim();

    if (!projectId || !body.metadata) {
      return NextResponse.json({ error: 'projectId and metadata are required' }, { status: 400 });
    }

    if (body.quantity !== undefined && body.quantity !== 1) {
      return NextResponse.json({ error: 'Only single NFT minting is supported per request' }, { status: 400 });
    }

    const mintResult = await mintNftForProject({ projectId, metadata: body.metadata, recipientAddress: body.recipientAddress });
 
    const requestedLovelace = body.unitPrice !== undefined ? Math.round(body.unitPrice * 1_000_000) : undefined;
    if (requestedLovelace !== undefined && requestedLovelace !== mintResult.lovelacePrice) {
      console.warn('Unit price mismatch detected during mint request', {
        projectId,
        requestedLovelace,
        onChainPrice: mintResult.lovelacePrice,
      });
    }

    return NextResponse.json({
      success: true,
      projectId,
      policyId: mintResult.policyId,
      tokenId: mintResult.tokenIndex,
      assetName: mintResult.assetName,
      metadata: mintResult.metadata,
      lovelacePrice: mintResult.lovelacePrice,
      maxMints: mintResult.maxMints,
      mintedCount: mintResult.mintedCountBefore + 1,
      collectionName: mintResult.collectionName,
      unsignedTx: mintResult.unsignedTx,
      serverSignedTx: mintResult.serverSignedTx,
      mintedCountBefore: mintResult.mintedCountBefore,
    });
  } catch (error) {
    console.error('Mint preparation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to mint NFT';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get('projectId');
    const policyIdParam = searchParams.get('policyId');

    let projectId = projectIdParam ?? undefined;
    if (!projectId && policyIdParam) {
      const project = await matchNFTPolicyIdWithProjects(policyIdParam);
      projectId = project?.id;
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID or Policy ID is required' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: `Project ${projectId} not found` }, { status: 404 });
    }

    const snapshot = await getOracleSnapshot(project.id);
    const currentIndex = Number(snapshot.oracle.nftIndex ?? 0);
    const maxMints = Number((snapshot.oracle.maxMints && 'int' in snapshot.oracle.maxMints) ? snapshot.oracle.maxMints.int : snapshot.oracle.maxMints ?? 0);
    const lovelacePrice = Number(snapshot.oracle.lovelacePrice ?? 0);

    return NextResponse.json({
      projectId: project.id,
      policyId: snapshot.oracle.policyId,
      currentTokenId: currentIndex,
      nextTokenId: currentIndex + 1,
      maxMints,
      lovelacePrice,
      mintingAllowed: boolDataToBoolean(snapshot.oracle.nftMintAllowed),
      collectionName: snapshot.collectionName,
    });
  } catch (error) {
    console.error('Status query error:', error);
    return NextResponse.json({ error: 'Failed to get minting status' }, { status: 500 });
  }
}
