import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';

let registered = false;

/**
 * Register Chart.js components once. Idempotent — safe to call from any chart-using page.
 */
export function registerCharts(): void {
    if (registered) return;
    Chart.register(
        CategoryScale,
        LinearScale,
        BarElement,
        LineElement,
        PointElement,
        ArcElement,
        Filler,
        Tooltip,
        Legend,
    );
    registered = true;
}
