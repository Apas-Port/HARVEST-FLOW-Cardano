import { useState, useCallback } from 'react';
import { useWallet } from '@meshsdk/react';
import { BrowserWallet } from '@meshsdk/core';
import { Project } from '@/lib/project';

export interface APIMintStatus {
  status: 'idle' | 'preparing' | 'signing' | 'submitting' | 'confirming' | 'success' | 'error';
  txHash?: string;
  error?: string;
  tokenIds?: number[];
}

export interface MintResult {
  txHash: string;
  tokenIds: number[];
  policyId: string;
}

export function useCardanoAPIMint() {
  const { connected, name: walletName } = useWallet();
  const [mintStatus, setMintStatus] = useState<APIMintStatus>({ status: 'idle' });
  const [isProcessing, setIsProcessing] = useState(false);

  const mintProjectNFT = useCallback(async (
    project: Project,
    quantity: number = 1
  ): Promise<MintResult | undefined> => {
    if (!connected || !walletName) {
      setMintStatus({ 
        status: 'error', 
        error: 'Please connect your wallet first' 
      });
      return;
    }

    setIsProcessing(true);
    setMintStatus({ status: 'preparing' });

    try {
      // Get recipient address
      const wallet = await BrowserWallet.enable(walletName);
      const recipientAddress = await wallet.getChangeAddress();

      // Step 1: Request mint execution via API
      const prepareResponse = await fetch('/api/cardano/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          metadata: {
            name: 'Harvestflow', // Will be replaced with "Harvestflow #<tokenId>" in API
            image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
            description: 'Harvestflow' // Will be replaced with "Harvestflow #<tokenId>" in API
          },
          quantity,
          recipientAddress,
          unitPrice: project.unitPrice
        })
      });

      if (!prepareResponse.ok) {
        const error = await prepareResponse.json();
        throw new Error(error.error || 'Failed to prepare mint transaction');
      }

      const prepareData = await prepareResponse.json();

      if (!prepareData.success) {
        throw new Error(prepareData.error || 'Mint API returned an unsuccessful response');
      }

      const tokenId = Number(prepareData.tokenId);
      const policyId: string = prepareData.policyId;
      const unsignedTx: string | undefined = prepareData.unsignedTx;
      const serverSignedTx: string | undefined = prepareData.serverSignedTx;
      const lovelacePrice: number | undefined = prepareData.lovelacePrice;

      if (!unsignedTx && !serverSignedTx) {
        throw new Error('Mint API response is missing transaction payloads');
      }

      setMintStatus({ status: 'signing' });

      const signingPayload = serverSignedTx ?? unsignedTx!;
      const clientSignedTx = await wallet.signTx(signingPayload, Boolean(serverSignedTx));

      setMintStatus({ status: 'submitting' });

      let txHash: string;
      const humanReadablePrice = lovelacePrice ? lovelacePrice / 1_000_000 : project.unitPrice;

      try {
        txHash = await wallet.submitTx(clientSignedTx);
      } catch (walletSubmitError) {
        console.error('Wallet submission failed, trying server submission:', walletSubmitError);

        const submitResponse = await fetch('/api/cardano/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedTx: clientSignedTx,
            txId: `${project.id}-${tokenId}`,
            projectId: project.id,
            tokenId,
            alreadySubmitted: false,
          }),
        });

        if (!submitResponse.ok) {
          const submitError = await submitResponse.json().catch(() => ({}));
          throw new Error(submitError.error || 'Failed to submit transaction');
        }

        const submitData = await submitResponse.json();
        if (!submitData.success || !submitData.txHash) {
          throw new Error(submitData.error || 'Transaction submission failed');
        }

        txHash = submitData.txHash;
      }

      try {
        await fetch('/api/cardano/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedTx: clientSignedTx,
            txId: `${project.id}-${tokenId}`,
            projectId: project.id,
            tokenId,
            alreadySubmitted: true,
            txHash,
          }),
        });
      } catch (trackError) {
        console.warn('Failed to notify backend of submitted transaction', trackError);
      }

      setMintStatus({ status: 'confirming' });

      try {
        await fetch('/api/token-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: recipientAddress,
            projectId: project.id,
            tokenIds: Number.isFinite(tokenId) ? [tokenId.toString()] : [],
            amount: humanReadablePrice,
            event: 'mint',
            txHash,
          }),
        });
        console.log('Token mint event recorded successfully');
      } catch (eventError) {
        console.error('Failed to record token event:', eventError);
        // Minting succeeded even if analytics logging fails
      }

      setMintStatus({
        status: 'success',
        txHash,
        tokenIds: Number.isFinite(tokenId) ? [tokenId] : undefined,
      });

      return {
        txHash,
        tokenIds: Number.isFinite(tokenId) ? [tokenId] : [],
        policyId,
      };

    } catch (error) {
      console.error('Minting error:', error);

      let errorMessage = 'Failed to mint NFT';

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('UTxO Balance Insufficient') || error.message.includes('Insufficient')) {
          errorMessage = `Insufficient wallet balance. NFT minting requires approximately 3-4 ADA (${project.unitPrice} ADA for the NFT + ~2-3 ADA for transaction fees). Please add more ADA to your wallet and try again.`;
        } else if (error.message.includes('User declined')) {
          errorMessage = 'Transaction cancelled by user';
        } else {
          errorMessage = error.message;
        }
      }

      setMintStatus({
        status: 'error',
        error: errorMessage
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [connected, walletName]);

  const resetMintStatus = useCallback(() => {
    setMintStatus({ status: 'idle' });
  }, []);

  // Get project minting status
  const getProjectStatus = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/cardano/status?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to get project status');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get project status:', error);
      return null;
    }
  }, []);

  // Get NFT status by token ID
  const getNFTStatus = useCallback(async (projectId: string, tokenId: number) => {
    try {
      const response = await fetch(`/api/cardano/status?projectId=${projectId}&tokenId=${tokenId}`);
      if (!response.ok) {
        throw new Error('Failed to get NFT status');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get NFT status:', error);
      return null;
    }
  }, []);

  return {
    mintProjectNFT,
    mintStatus,
    isProcessing,
    resetMintStatus,
    getProjectStatus,
    getNFTStatus
  };
}
