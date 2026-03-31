export interface Stats {
    totalProducts: number;
    totalValue: number;
    avgPrice: number;
}

export async function fetchStats(): Promise<Stats> {
    const res = await fetch("/api/stats");
    if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
    return res.json();
}
