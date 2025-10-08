import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { loadContractFromProjectDefinition, resolveNumericValue } from '@/lib/harvestflow-contract';
import type { Project } from '@/lib/project';
import { getNetworkConfig } from '@/lib/network-config';

async function findProjectIdByPolicy(policyId: string): Promise<string | null> {
  const { isMainnet } = getNetworkConfig();
  const fileName = isMainnet ? 'projects.json' : 'dev-projects.json';
  const dataPath = path.join(process.cwd(), 'public', 'data', fileName);

  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    const projects = JSON.parse(raw) as Array<{ id?: string; policyId?: string }>;
    const entry = projects.find((p) => p.policyId && p.policyId.toLowerCase() === policyId.toLowerCase());
    return entry?.id ?? null;
  } catch (error) {
    console.error(`[minted-count] Failed to read project data from ${dataPath}:`, error);
    return null;
  }
}

async function loadProjectDefinition(projectId: string): Promise<Record<string, unknown> | null> {
  const { isMainnet } = getNetworkConfig();
  const fileName = isMainnet ? 'projects.json' : 'dev-projects.json';
  const dataPath = path.join(process.cwd(), 'public', 'data', fileName);

  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    const projects = JSON.parse(raw) as Array<Record<string, unknown>>;
    return projects.find((p) => typeof p.id === 'string' && p.id.toLowerCase() === projectId.toLowerCase()) ?? null;
  } catch (error) {
    console.error(`[minted-count] Failed to load project definition from ${dataPath}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    const policyIdParam = searchParams.get('policyId');

    if (!projectIdParam && !policyIdParam) {
      return NextResponse.json(
        { error: 'projectId or policyId is required' },
        { status: 400 }
      );
    }

    let projectId = projectIdParam ?? undefined;

    if (!projectId && policyIdParam) {
      const resolvedProjectId = await findProjectIdByPolicy(policyIdParam);
      projectId = resolvedProjectId ?? undefined;
      if (!projectId) {
        return NextResponse.json(
          { error: `No project configured for policy ${policyIdParam}` },
          { status: 404 }
        );
      }
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Unable to resolve project from provided parameters' },
        { status: 400 }
      );
    }

    const projectDefinitionRaw = await loadProjectDefinition(projectId);
    if (!projectDefinitionRaw) {
      return NextResponse.json(
        { error: `Project ${projectId} not found` },
        { status: 404 }
      );
    }

    const projectDefinition = projectDefinitionRaw as unknown as Project;

    projectDefinition.mintedAmount ??= 0;
    projectDefinition.raisedAmount ??= 0;
    projectDefinition.totalAmount ??= 0;
    projectDefinition.contractAddress ??= '0x';

    const context = await loadContractFromProjectDefinition(projectDefinition, { requireWallet: false });
    const oracle = await context.contract.getOracleData();
    const mintedCount = resolveNumericValue(oracle.nftIndex, 0);

    return NextResponse.json({
      success: true,
      projectId,
      policyId: context.project.policyId,
      mintedCount,
      paramUtxo: context.paramUtxo,
    });
  } catch (error) {
    console.error('Error fetching minted count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch minted count' },
      { status: 500 }
    );
  }
}
