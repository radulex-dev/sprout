import { and, desc, eq, isNull, sql } from 'drizzle-orm';

// Helpers
import { resolveSoilVolumeMl } from '@/helpers/pot';
import { resolveWaterAmountMl, toCareSchedule } from '@/services/server/care-profile/helpers';

// Services
import { getCareIntervals, getWaterPercent } from '@/services/server/care-profile';

// Database
import { database } from '@/lib/db';
import { plants } from '@/lib/db/schema';

const SPACING_MILLISECONDS = 6000;
const isDryRun = process.argv.includes('--dry-run');

const loadWaterAmountMl = async (userId: string, species: string, soilVolumeMl: number): Promise<number> => {
    if (soilVolumeMl === 0) {
        return 0;
    }

    const waterPercent = await getWaterPercent({
        userId,
        species
    });

    return resolveWaterAmountMl(soilVolumeMl, waterPercent);
};

const pairs = await database
    .select({
        species: sql<string>`lower(trim(${plants.species}))`,
        potDiameter: plants.potDiameter,
        soilVolumeLitres: plants.soilVolumeLitres,
        userId: sql<string>`min(${plants.userId})`,
        plantCount: sql<number>`count(*)::int`
    })
    .from(plants)
    .groupBy(sql`lower(trim(${plants.species}))`, plants.potDiameter, plants.soilVolumeLitres)
    .orderBy(desc(sql`count(*)`));

let failed = 0;

for (const pair of pairs) {
    const soilVolumeMl = resolveSoilVolumeMl({
        potDiameter: pair.potDiameter ?? undefined,
        soilVolumeLitres: pair.soilVolumeLitres ?? undefined
    }) ?? 0;

    if (isDryRun) {
        process.stdout.write(`${pair.species} ${soilVolumeMl}ml ${pair.plantCount} plants\n`);
        continue;
    }

    try {
        const intervals = await getCareIntervals({
            userId: pair.userId,
            species: pair.species
        });
        const waterAmountMl = await loadWaterAmountMl(pair.userId, pair.species, soilVolumeMl);

        await database
            .update(plants)
            .set({
                care: sql`${JSON.stringify(toCareSchedule(intervals, waterAmountMl))}::jsonb`
            })
            .where(and(
                eq(sql`lower(trim(${plants.species}))`, pair.species),
                pair.potDiameter === null ? isNull(plants.potDiameter) : eq(plants.potDiameter, pair.potDiameter),
                pair.soilVolumeLitres === null ? isNull(plants.soilVolumeLitres) : eq(plants.soilVolumeLitres, pair.soilVolumeLitres)
            ));

        process.stdout.write(`${pair.species} ${soilVolumeMl}ml: ${pair.plantCount} plants\n`);
    } catch (reason) {
        failed += 1;
        console.error(`Failed ${pair.species} ${soilVolumeMl}ml`, reason);
    }

    await new Promise((resolve) => {
        setTimeout(resolve, SPACING_MILLISECONDS);
    });
}

await database.$client.end();
process.exitCode = failed > 0 ? 1 : 0;
