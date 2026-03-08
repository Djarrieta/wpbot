import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats, type Stats } from "../api/stats";

function StatCard({
    label,
    value,
    icon,
    gradient,
}: {
    label: string;
    value: string;
    icon: string;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div
                className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${gradient}`}
            />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 m-0 mb-1">
                        {label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white m-0">
                        {value}
                    </p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

export function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchStats();
            setStats(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch stats");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0 mb-1">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 m-0">
                    Overview of your data at a glance
                </p>
            </div>

            {error && (
                <div className="flex justify-between items-center bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-6">
                    {error}
                    <button
                        className="bg-transparent border-none text-red-400 cursor-pointer text-base px-1"
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                    <StatCard
                        label="Total Items"
                        value={String(stats.totalItems)}
                        icon="📦"
                        gradient="bg-indigo-500"
                    />
                    <StatCard
                        label="Total Value"
                        value={`$${stats.totalValue.toFixed(2)}`}
                        icon="💰"
                        gradient="bg-emerald-500"
                    />
                    <StatCard
                        label="Average Price"
                        value={`$${stats.avgPrice.toFixed(2)}`}
                        icon="📈"
                        gradient="bg-amber-500"
                    />
                </div>
            ) : null}

            {/* Quick access */}
            <div className="mt-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white m-0 mb-4">
                    Quick Access
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <Link
                        to="/items"
                        className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 no-underline shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                📦
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white m-0">
                                    Manage Items
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">
                                    View, create, and edit items
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
