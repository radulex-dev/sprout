export interface PlantNetTaxon {
    scientificNameWithoutAuthor?: string | null;
}

export interface PlantNetSpecies {
    scientificNameWithoutAuthor?: string | null;
    commonNames?: string[] | null;
    genus?: PlantNetTaxon | null;
    family?: PlantNetTaxon | null;
}

export interface PlantNetRawResult {
    species?: PlantNetSpecies | null;
    score?: number | null;
}

export interface PlantNetResponse {
    results?: PlantNetRawResult[];
}

export interface PlantNetErrorBody {
    message?: string;
}
