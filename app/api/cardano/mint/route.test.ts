import { NextRequest } from 'next/server';
import { POST, GET } from './route';

const mintNftForProjectMock = jest.fn();
const getOracleSnapshotMock = jest.fn();

jest.mock('@meshsdk/core', () => ({
  deserializeAddress: jest.fn(() => ({
    pubKeyHash: 'mockPubKey',
    stakeCredentialHash: 'mockStake',
  })),
}));

jest.mock('@/lib/harvestflow-contract', () => ({
  mintNftForProject: (...args: unknown[]) => mintNftForProjectMock(...args),
  getOracleSnapshot: (...args: unknown[]) => getOracleSnapshotMock(...args),
  boolDataToBoolean: (value: unknown) => Boolean(value),
}));

jest.mock('@/lib/project', () => ({
  getProjectById: jest.fn().mockResolvedValue({ id: 'test-project', title: 'Test Project' }),
  matchNFTPolicyIdWithProjects: jest.fn().mockResolvedValue({ id: 'test-project', title: 'Test Project' }),
}));

describe('/api/cardano/mint POST', () => {
  beforeEach(() => {
    mintNftForProjectMock.mockReset();
    mintNftForProjectMock.mockResolvedValue({
      unsignedTx: 'mock-unsigned-tx',
      serverSignedTx: 'mock-server-signed-tx',
      tokenIndex: 0,
      policyId: 'mock-policy',
      assetName: 'Test Project (0)',
      metadata: { name: 'Test Asset', image: 'https://example.com/image.png' },
      lovelacePrice: 1000000,
      maxMints: 100,
      mintedCountBefore: 0,
      collectionName: 'Test Project',
    });
  });

  it('returns success when minting succeeds', async () => {
    const request = new NextRequest('http://localhost/api/cardano/mint', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        metadata: { image: 'https://example.com/nft.png' },
        recipientAddress: 'addr_test1...',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.unsignedTx).toBe('mock-unsigned-tx');
    expect(payload.serverSignedTx).toBe('mock-server-signed-tx');
    expect(payload.assetName).toBe('Test Project (0)');
    expect(payload.mintedCount).toBe(1);
    expect(mintNftForProjectMock).toHaveBeenCalledWith({
      projectId: 'test-project',
      metadata: { image: 'https://example.com/nft.png' },
      recipientAddress: 'addr_test1...',
    });
  });

  it('rejects requests missing metadata', async () => {
    const request = new NextRequest('http://localhost/api/cardano/mint', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'test-project' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('required');
    expect(mintNftForProjectMock).not.toHaveBeenCalled();
  });

  it('rejects multiple quantity requests', async () => {
    const request = new NextRequest('http://localhost/api/cardano/mint', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test-project',
        metadata: { image: 'https://example.com/nft.png' },
        quantity: 2,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('single NFT');
    expect(mintNftForProjectMock).not.toHaveBeenCalled();
  });
});

describe('/api/cardano/mint GET', () => {
  beforeEach(() => {
    getOracleSnapshotMock.mockReset();
    getOracleSnapshotMock.mockResolvedValue({
      project: { id: 'test-project', title: 'Test Project' },
      collectionName: 'Test Project',
      paramUtxo: { txHash: 'hash', outputIndex: 0 },
      oracle: {
        nftIndex: 1,
        policyId: 'mock-policy',
        lovelacePrice: 2000000,
        maxMints: { int: 100 },
        nftMintAllowed: { constructor: 1, fields: [] },
      },
    });
  });

  it('returns oracle snapshot data', async () => {
    const request = new NextRequest('http://localhost/api/cardano/mint?projectId=test-project');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.projectId).toBe('test-project');
    expect(payload.policyId).toBe('mock-policy');
    expect(payload.nextTokenId).toBe(2);
    expect(getOracleSnapshotMock).toHaveBeenCalledWith('test-project');
  });
});
