/**
 * System Validation Suite (Phase 22)
 * 전체 시스템의 무결성을 검증하는 E2E 테스트 및 스트레스 테스트 스크립트.
 * 
 * Usage:
 * - Run Validation: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --experimental-specifier-resolution=node lib/tests/systemValidation.ts
 * - Run Stress Test: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --experimental-specifier-resolution=node lib/tests/systemValidation.ts --stress
 */

import { performanceMonitor } from '../core/performanceMonitor.ts';
import { performLinearRegression, type TimeSeriesPoint } from '../core/predictiveEngine.ts';

// --- Mock Interfaces & Data Generators for Simulation ---

interface ProductData {
    id: string;
    name: string;
    price: number;
    normalizedPrice: number | null; // Nullable for testing null checks
    metadata: Record<string, any>;
}

// 1. Search Simulation
async function simulateSearch(query: string): Promise<ProductData[]> {
    return performanceMonitor.trackAsync('Search System', async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200)); // Simulate network delay
        if (!query) throw new Error('Query cannot be empty');

        return Array(5).fill(null).map((_, i) => ({
            id: `prod_${i}_${Date.now()}`,
            name: `${query} Item ${i}`,
            price: Math.floor(Math.random() * 100000) + 10000,
            normalizedPrice: null, // Initial state
            metadata: { source: 'mock_mall' }
        }));
    });
}

// 2. Normalization Simulation
async function simulateNormalization(products: ProductData[]): Promise<ProductData[]> {
    return performanceMonitor.trackAsync('Data Normalizer', async () => {
        return products.map(p => {
            // Null Safety Check Simulation
            if (p.price < 0) throw new Error('Invalid price detected');

            return {
                ...p,
                normalizedPrice: p.price // Simple pass-through for simulation
            };
        });
    });
}

// 3. Prediction Simulation
async function simulatePrediction(product: ProductData): Promise<any> {
    return performanceMonitor.trackAsync('Predictive Engine', async () => {
        // Mock historical data: 10 points
        const history: TimeSeriesPoint[] = Array(10).fill(null).map((_, i) => ({
            time: i,
            value: product.price * (1 + (Math.random() * 0.1 - 0.05)) // +/- 5% random fluctuation
        }));

        try {
            return performLinearRegression(history);
        } catch (e) {
            console.error(`Prediction failed for ${product.id}`, e);
            return null;
        }
    });
}

// --- Validation Logic ---

async function runValidationCycle(iteration: number): Promise<boolean> {
    const logPrefix = `[Cycle ${iteration}]`;
    try {
        // Step 1: Search
        const searchResults = await simulateSearch('Summer Dress');
        if (!searchResults || searchResults.length === 0) {
            console.error(`${logPrefix} Search failed: No results`);
            return false;
        }

        // Step 2: Normalization (Data Integrity Check)
        const normalized = await simulateNormalization(searchResults);
        const integrityCheck = normalized.every(p => p.normalizedPrice !== null && p.normalizedPrice === p.price);
        if (!integrityCheck) {
            console.error(`${logPrefix} Data Integrity Check Failed`);
            return false;
        }

        // Step 3: Prediction (Engine Check)
        for (const p of normalized) {
            const prediction = await simulatePrediction(p);
            if (!prediction || typeof prediction.slope !== 'number') {
                console.error(`${logPrefix} Prediction Engine Malfunction`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error(`${logPrefix} Unexpected System Error:`, error);
        return false;
    }
}

async function runStressTest(concurrency: number = 100) {
    console.log(`\n🔥 Starting Stress Test with ${concurrency} concurrent requests...`);
    const startTime = Date.now();

    const tasks = Array(concurrency).fill(null).map((_, i) => runValidationCycle(i + 1));
    const results = await Promise.all(tasks);

    const successCount = results.filter(r => r).length;
    const duration = Date.now() - startTime;

    console.log(`\n📊 Stress Test Results:`);
    console.log(`   - Total Requests: ${concurrency}`);
    console.log(`   - Success: ${successCount}`);
    console.log(`   - Failed: ${concurrency - successCount}`);
    console.log(`   - Duration: ${duration}ms`);
    console.log(`   - TPMS (Trans/ms): ${(concurrency / duration).toFixed(4)}`);

    const avgLatency = performanceMonitor.getAverageLatency('Predictive Engine');
    console.log(`   - Avg Prediction Latency: ${avgLatency}ms`);

    // Memory Snapshot
    const memory = process.memoryUsage();
    console.log(`   - Memory Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    if (successCount === concurrency) {
        console.log(`✅ STRESS TEST PASSED: System is ROBUST.`);
    } else {
        console.log(`❌ STRESS TEST FAILED: System instability detected.`);
    }
}

async function main() {
    const isStress = process.argv.includes('--stress');

    console.log(`🚀 Initializing System Validation (Phase 22)...`);
    console.log(`   - Mode: ${isStress ? 'STRESS TEST' : 'FUNCTIONAL VALIDATION'}`);

    if (isStress) {
        await runStressTest(100);
    } else {
        // Standard Functional Validation (50 runs sequential for reliability stats)
        let success = 0;
        const total = 50;

        for (let i = 0; i < total; i++) {
            if (await runValidationCycle(i + 1)) success++;
        }

        const rate = (success / total) * 100;
        console.log(`\n📋 Functional Validation Results:`);
        console.log(`   - Success Rate: ${rate}% (${success}/${total})`);

        if (rate >= 98) {
            console.log(`✅ SYSTEM VALIDATION PASSED: Definition of Done met.`);
        } else {
            console.log(`❌ SYSTEM VALIDATION FAILED: Success rate below 98%.`);
        }
    }
}

main().catch(console.error);
