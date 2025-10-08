function buildApiUrl(policyId: string): string {
  if (typeof window !== 'undefined') {
    return `/api/project/minted-count?policyId=${encodeURIComponent(policyId)}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
    || 'http://localhost:3000';

  return `${baseUrl.replace(/\/$/, '')}/api/project/minted-count?policyId=${encodeURIComponent(policyId)}`;
}

// Fetch minted count for a specific policy ID using the API route (works on both client and server)
export async function fetchMintedCount(policyId: string): Promise<number> {
  try {
    const response = await fetch(buildApiUrl(policyId), {
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error('Failed to fetch minted count from API', response.status);
      return 0;
    }

    const data = await response.json();
    return typeof data.mintedCount === 'number' ? data.mintedCount : 0;
  } catch (error) {
    console.error('Error fetching minted count:', error);
    return 0;
  }
}

// Deprecated helper (kept for compatibility)
export async function fetchAllMintedCounts(): Promise<Record<string, number>> {
  return {};
}
