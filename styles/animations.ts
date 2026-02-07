/**
 * Design Tokens & Micro-interaction Animations
 * Apple-like smooth transitions & premium feel
 */

export const animations = {
    // Keyframes
    keyframes: {
        fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
        slideUp: `
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `,
        pulse: `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `,
        shimmer: `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `,
        float: `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
    `,
        scan: `
      @keyframes scan {
        0% { top: 0%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
    `,
    },

    // Transition Classes
    transitions: {
        default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },

    // Interactive Styles
    interactive: {
        hoverScale: {
            transition: 'transform 0.2s ease',
            ':hover': { transform: 'scale(1.02)' },
        },
        hoverLift: {
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            },
        },
        clickPress: {
            ':active': { transform: 'scale(0.98)' },
        },
    },
};

// Global Style Injection Helper
export function injectGlobalAnimations() {
    if (typeof document === 'undefined') return;

    const styleId = 'loopyck-animations';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = Object.values(animations.keyframes).join('\n');
    document.head.appendChild(style);
}
