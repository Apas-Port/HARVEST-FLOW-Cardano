import fs from 'node:fs/promises';
import path from 'node:path';

import type { BlockfrostProvider, MeshTxBuilder, MeshWallet } from '@meshsdk/core';
import { deserializeAddress } from '@meshsdk/core';
import { MeshPlutusNFTContract } from '../../HF-cardano-backend/offchain';
import { OracleData, ParamUtxo } from '../../HF-cardano-backend/type';

import { getNetworkConfig } from './network-config';
import { getProjectById, matchNFTPolicyIdWithProjects, Project } from './project';

const DEFAULT_PARAM_PREFIX = 'PARAM_UTXO_';

export interface MintMetadataInput {
  name?: string;
  image?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface MintRequestContext {
  projectId: string;
  metadata: MintMetadataInput;
  recipientAddress?: string;
}

export interface MintPreparedResult {
  unsignedTx: string;
  serverSignedTx: string;
  tokenIndex: number;
  policyId: string;
  assetName: string;
  metadata: Record<string, unknown>;
  lovelacePrice: number;
  maxMints: number;
  mintedCountBefore: number;
  collectionName: string;
}

interface ContractContext {
  contract: MeshPlutusNFTContract;
  wallet?: MeshWallet;
  project: Project;
  paramUtxo: ParamUtxo;
  networkId: 0 | 1;
}

let meshCorePromise: Promise<typeof import('@meshsdk/core')> | null = null;

async function loadMeshCore() {
  if (!meshCorePromise) {
    meshCorePromise = import('@meshsdk/core');
  }
  return meshCorePromise;
}

async function waitForCollateral(wallet: MeshWallet, attempts = 10, delayMs = 3_000): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const collateral = await wallet.getCollateral();
      if (collateral && collateral.length > 0) {
        return true;
      }
    } catch (error) {
      console.warn('[Harvestflow] Failed to query collateral while waiting', error);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

function deserializeRecipientAddress(address: string | undefined | null) {
  if (!address) return null;
  try {
    const info = deserializeAddress(address);
    return info;
  } catch (error) {
    console.warn('[Harvestflow] Failed to deserialize recipient address', error);
    return null;
  }
}

export function resolveNumericValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'object' && value !== null) {
    if ('int' in value) {
      const intValue = (value as any).int;
      if (typeof intValue === 'number') {
        return Number.isFinite(intValue) ? intValue : fallback;
      }
      if (typeof intValue === 'bigint') {
        return Number(intValue);
      }
    }
    if ('value' in value) {
      const innerValue = (value as any).value;
      if (typeof innerValue === 'number') {
        return Number.isFinite(innerValue) ? innerValue : fallback;
      }
      if (typeof innerValue === 'bigint') {
        return Number(innerValue);
      }
    }
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function boolDataToBoolean(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  if ('constructor' in value) {
    return value.constructor === 1;
  }
  if ('alternative' in value) {
    return value.alternative === 1;
  }
  return false;
}

function unwrapQuoted(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === last) && (first === '"' || first === '\'')) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

async function readJsonFromValueOrPath(raw: string): Promise<any> {
  const candidate = unwrapQuoted(raw);
  try {
    return JSON.parse(candidate);
  } catch (parseError) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.join(process.cwd(), candidate);
    const fileContent = await fs.readFile(resolved, 'utf8');
    return JSON.parse(fileContent);
  }
}

async function resolveParamUtxo(project: Project): Promise<ParamUtxo> {
  const key = project.paramUtxoEnvKey ?? `${DEFAULT_PARAM_PREFIX}${project.id}`;
  const raw = key ? process.env[key] : undefined;
  if (!raw) {
    throw new Error(`Missing param UTxO definition in environment variable ${key}`);
  }

  const parsed = await readJsonFromValueOrPath(raw);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.txHash !== 'string') {
    throw new Error(`Invalid param UTxO payload for ${key}`);
  }
  const outputIndex = typeof parsed.outputIndex === 'number' ? parsed.outputIndex : Number(parsed.outputIndex);
  if (!Number.isInteger(outputIndex)) {
    throw new Error(`Invalid outputIndex provided in ${key}`);
  }

  return {
    txHash: parsed.txHash,
    outputIndex,
  };
}

interface WalletCredentials {
  payment: string;
  stake?: string;
}

async function resolveCliKeys(): Promise<WalletCredentials | null> {
  const paymentEnv = process.env.PAYMENT_SKEY;
  const paymentPath = process.env.PAYMENT_SKEY_PATH;
  if (!paymentEnv && !paymentPath) {
    return null;
  }
  const paymentSource = paymentEnv ?? paymentPath!;
  const stakeSource = process.env.STAKE_SKEY ?? process.env.STAKE_SKEY_PATH;

  const payment = await loadKeyValue(paymentSource);
  const stake = stakeSource ? await loadKeyValue(stakeSource) : undefined;

  return { payment, stake };
}

async function loadKeyValue(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Empty key payload provided');
  }
  try {
    const parsed = await readJsonFromValueOrPath(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.cborHex === 'string') {
        return parsed.cborHex;
      }
      if (typeof parsed.key === 'string') {
        return parsed.key;
      }
      if (typeof parsed.payment === 'string') {
        return parsed.payment;
      }
    }
  } catch (err) {
    // fall back to treating as raw hex
  }
  return trimmed;
}

async function createWallet(provider: BlockfrostProvider, networkId: 0 | 1): Promise<MeshWallet> {
  const { MeshWallet } = await loadMeshCore();
  const mnemonicRaw = process.env.PAYMENT_MNEMONIC?.trim();

  let wallet: MeshWallet | null = null;
  if (mnemonicRaw) {
    const words = mnemonicRaw.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      throw new Error('PAYMENT_MNEMONIC is empty');
    }
    wallet = new MeshWallet({
      networkId,
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'mnemonic',
        words,
      },
    });
  } else {
    const cliKeys = await resolveCliKeys();
    if (!cliKeys) {
      throw new Error('PAYMENT_MNEMONIC or PAYMENT_SKEY(_PATH) must be configured');
    }
    wallet = new MeshWallet({
      networkId,
      fetcher: provider,
      submitter: provider,
      key: {
        type: 'cli',
        payment: cliKeys.payment,
        ...(cliKeys.stake ? { stake: cliKeys.stake } : {}),
      },
    });
  }

  await wallet.init();

  const collateral = await wallet.getCollateral();
  if (!collateral || collateral.length === 0) {
    console.info('[Harvestflow] No collateral UTxO detected, attempting to create one');
    const txHash = await wallet.createCollateral();
    console.info('[Harvestflow] Collateral creation transaction submitted', txHash);

    const collateralReady = await waitForCollateral(wallet);
    if (!collateralReady) {
      throw new Error('Collateral creation transaction submitted but collateral UTxO not available yet');
    }

    console.info('[Harvestflow] Collateral UTxO confirmed');
  }

  return wallet;
}

async function createContractContextFromDefinition(project: Project, { requireWallet }: { requireWallet: boolean }): Promise<ContractContext> {
  const { blockfrostApiKey, isMainnet } = getNetworkConfig();
  if (!blockfrostApiKey) {
    throw new Error('Blockfrost API key is not configured for current network');
  }

  const networkId: 0 | 1 = isMainnet ? 1 : 0;
  const { BlockfrostProvider, MeshTxBuilder } = await loadMeshCore();
  const provider = new BlockfrostProvider(blockfrostApiKey);
  const mesh = new MeshTxBuilder({ fetcher: provider, submitter: provider });
  const paramUtxo = await resolveParamUtxo(project);
  const collectionName = project.collectionName ?? project.title ?? 'Harvestflow Collection';

  let wallet: MeshWallet | undefined;
  if (requireWallet) {
    wallet = await createWallet(provider, networkId);
  }

  const contract = new MeshPlutusNFTContract(
    {
      mesh: mesh as unknown as any,
      fetcher: provider as unknown as any,
      wallet: wallet as unknown as any,
      networkId,
    },
    {
      collectionName,
      paramUtxo,
    },
  );

  return {
    contract,
    wallet,
    project,
    paramUtxo,
    networkId,
  };
}

export async function loadContractForProject(projectId: string, options: { requireWallet?: boolean } = {}): Promise<ContractContext> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  return createContractContextFromDefinition(project, { requireWallet: !!options.requireWallet });
}

export async function loadContractForPolicy(policyId: string, options: { requireWallet?: boolean } = {}): Promise<ContractContext> {
  const project = await matchNFTPolicyIdWithProjects(policyId);
  if (!project) {
    throw new Error(`No project configured for policy ${policyId}`);
  }
  return createContractContextFromDefinition(project, { requireWallet: !!options.requireWallet });
}

export async function loadContractFromProjectDefinition(project: Project, options: { requireWallet?: boolean } = {}): Promise<ContractContext> {
  return createContractContextFromDefinition(project, { requireWallet: !!options.requireWallet });
}

export async function getOracleSnapshot(projectId: string): Promise<{ project: Project; oracle: OracleData; collectionName: string; paramUtxo: ParamUtxo }>
{
  const context = await loadContractForProject(projectId, { requireWallet: false });
  const oracle = await context.contract.getOracleData();
  const collectionName = context.project.collectionName ?? context.project.title ?? 'Harvestflow Collection';
  return {
    project: context.project,
    oracle,
    collectionName,
    paramUtxo: context.paramUtxo,
  };
}

export async function mintNftForProject({ projectId, metadata, recipientAddress }: MintRequestContext): Promise<MintPreparedResult> {
  if (!metadata || !metadata.image) {
    throw new Error('Metadata with at least an image field is required to mint');
  }

  const { project, contract, wallet } = await loadContractForProject(projectId, { requireWallet: true });
  if (!wallet) {
    throw new Error('Wallet failed to initialize');
  }

  const oracleBefore = await contract.getOracleData();
  if (!boolDataToBoolean(oracleBefore.nftMintAllowed)) {
    throw new Error('Minting is currently disabled by oracle settings');
  }

  const currentIndex = resolveNumericValue(oracleBefore.nftIndex, 0);
  const maxMints = resolveNumericValue(oracleBefore.maxMints, 0);
  if (maxMints > 0 && currentIndex >= maxMints) {
    throw new Error('Maximum supply reached for this collection');
  }

  const collectionName = project.collectionName ?? project.title ?? 'Harvestflow Collection';
  const assetName = `${collectionName} (${currentIndex})`;
  const tokenMetadata: Record<string, unknown> = {
    name: assetName,
    image: metadata.image,
    description: metadata.description ?? assetName,
  };
  if (metadata.attributes?.length) {
    tokenMetadata.attributes = metadata.attributes;
  }

  const recipientInfo = recipientAddress ? deserializeRecipientAddress(recipientAddress) : null;

  const lovelacePriceValue = resolveNumericValue(oracleBefore.lovelacePrice, 0);
  const minRecipientLovelace = Math.max(2_000_000, lovelacePriceValue);

  const unsignedTx = await contract.mintPlutusNFT(
    tokenMetadata,
    undefined,
    true,
    {
      recipientAddress: recipientAddress ?? undefined,
      requiredSignerHash: recipientInfo?.pubKeyHash,
      minLovelaceForRecipient: String(minRecipientLovelace),
    },
  );

  const serverSignedTx = await wallet.signTx(unsignedTx);

  return {
    unsignedTx,
    serverSignedTx,
    tokenIndex: currentIndex,
    policyId: oracleBefore.policyId,
    assetName,
    metadata: tokenMetadata,
    lovelacePrice: lovelacePriceValue,
    maxMints,
    mintedCountBefore: currentIndex,
    collectionName,
  };
}
