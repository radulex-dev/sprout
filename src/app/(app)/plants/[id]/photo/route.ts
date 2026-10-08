// Constants
import { HttpStatus } from '@/lib/http/constants';

// Services
import { readPlantPhoto } from '@/services/server/plants';

// Auth
import { requireUser } from '@/lib/auth/session';

// Types
import type { PageParameters } from '../types';

interface Props {
    params: Promise<PageParameters>;
}

export const GET = async (_request: Request, { params }: Props) => {
    const session = await requireUser();
    const { id } = await params;
    const photo = await readPlantPhoto(session.user.id, id);

    if (!photo) {
        return new Response('Not found', {
            status: HttpStatus.NotFound
        });
    }

    return new Response(new Uint8Array(photo), {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'private, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
        }
    });
};
