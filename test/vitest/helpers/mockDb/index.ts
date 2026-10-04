import { vi } from 'vitest';

export const mockSelectChain = <T>(rows: T[]) => {
    const orderBy = vi.fn(() => {
        return Object.assign(Promise.resolve(rows), {
            limit: vi.fn(() => {
                return Promise.resolve(rows);
            })
        });
    });

    const where = vi.fn(() => {
        return Object.assign(Promise.resolve(rows), {
            orderBy,
            limit: vi.fn(() => {
                return Promise.resolve(rows);
            })
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

export const mockInsertChain = () => {
    return {
        values: vi.fn(() => {
            return {
                returning: vi.fn(() => {
                    return Promise.resolve([{
                        id: 'generated-id'
                    }]);
                })
            };
        })
    };
};
