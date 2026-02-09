export const InteractionNarrative = {
    // Parallax Reveal Effect for Text
    parallaxReveal: {
        hidden: { opacity: 0, y: 50 },
        visible: (i: number = 0) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.8,
                ease: "circOut"
            } as any
        })
    },

    // Elastic Bounce for Buttons
    elasticBounce: {
        tap: { scale: 0.95 },
        hover: {
            scale: 1.05,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 10
            } as any // Force cast to avoid strict variant typing issues
        }
    },

    // Staggered Container for Lists
    staggerContainer: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }
};
