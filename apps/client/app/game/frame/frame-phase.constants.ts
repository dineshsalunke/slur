export const FRAME_PHASE = {
    input: -3,
    simulate: -2,
    sync: -1,
    react: 0,
    view: 0.25,
    prerender: 0.5,
    render: 1,
    overlay: 2,
    cleanup: 3,
} as const;
