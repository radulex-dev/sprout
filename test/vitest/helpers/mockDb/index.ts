import { vi } from 'vitest';

export const mockSelectChain = <T>(rows: T[]) => {
    const orderBy = vi.fn(() => {
        return Promise.resolve(rows);
    });

    const where = vi.fn(() => {
        return Object.assign(Promise.resolve(rows), {
            orderBy
        });
    });

    return {
        from: vi.fn(() => {
            return {
                where
            };
        })
    };
};

export const mockDeleteChain = () => {
    return {
        where: vi.fn(() => {
            return Promise.resolve();
        })
    };
};
