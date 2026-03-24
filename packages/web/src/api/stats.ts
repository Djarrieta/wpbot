export interface Stats {
    totalItems: number;
    totalValue: number;
    avgPrice: number;
}

export async function fetchStats(): Promise<Stats> {
    const res = await fetch("/_proxy/api/stats");
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
    return res.json();
}
