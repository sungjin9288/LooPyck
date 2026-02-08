/**
 * Motion Path Constants
 * Framer Motion을 위한 공통 애니메이션 정의.
 * "Staggered Reveal"과 "Parallax" 효과를 표준화.
 */

import { Variants } from 'framer-motion';

export const EASE_SPRING = {
    type: "spring",
    stiffness: 100,
    damping: 20
};

export const MOTION_VARIANTS = {
    fadeInUp: {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    },
    staggerContainer: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    },
    scaleOnHover: {
        initial: { scale: 1 },
        hover: { scale: 1.05, transition: { duration: 0.3 } }
    },
    glassReveal: {
        hidden: { opacity: 0, backdropFilter: "blur(0px)" },
        visible: {
            opacity: 1,
            backdropFilter: "blur(12px)",
            transition: { duration: 0.4 }
        }
    }
} as const;

export const OBSERVER_OPTIONS = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1
};
