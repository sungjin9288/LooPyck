/**
 * Performance Profiler for Animations
 * 60fps 유지를 위해 Frame Drop을 감지하고 경고를 로그에 남김.
 */

export function profileAnimationPerformance(actionName: string) {
    let lastTime = performance.now();
    let frame = 0;
    let active = true;

    function loop() {
        if (!active) return;

        const now = performance.now();
        const delta = now - lastTime;

        // 16.6ms (60fps)보다 2배 이상 느리면 프레임 드롭으로 간주
        if (delta > 32) {
            console.warn(`[Frame Drop] ${actionName}: ${delta.toFixed(1)}ms (${(1000 / delta).toFixed(1)} fps) at frame ${frame}`);
        }

        lastTime = now;
        frame++;
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
        active = false;
        console.log(`[Profiler] ${actionName} finished. Total frames: ${frame}`);
    };
}
