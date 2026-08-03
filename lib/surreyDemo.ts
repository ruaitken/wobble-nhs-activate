// Front-end-only mock data for the Surrey County Council falls-prevention demo.
//
// This file powers TWO standalone demo routes and does NOT touch any real
// campaign, Supabase table, or the existing production demo:
//   - /activate/demo-surrey-falls   (council-branded activation mock)
//   - /dashboard/demo-surrey-falls   (impact dashboard with location drill-down)
//
// The geography reflects Surrey's move to two unitary councils from April 2027
// (Surrey (Structural Changes) Order 2026): East Surrey and West Surrey, each
// made up of the current borough/district councils, which in turn contain towns.

export type TownStat = { town: string; n: number };
export type BoroughStat = { borough: string; towns: TownStat[] };
export type RegionStat = { region: "East Surrey" | "West Surrey"; boroughs: BoroughStat[] };

export const SURREY_GEO: RegionStat[] = [
  {
    region: "West Surrey",
    boroughs: [
      {
        borough: "Guildford",
        towns: [
          { town: "Guildford", n: 140 },
          { town: "Ash", n: 46 },
          { town: "Shalford", n: 31 },
          { town: "Send", n: 18 },
        ],
      },
      {
        borough: "Woking",
        towns: [
          { town: "Woking", n: 125 },
          { town: "Knaphill", n: 47 },
          { town: "Horsell", n: 32 },
          { town: "West Byfleet", n: 31 },
        ],
      },
      {
        borough: "Waverley",
        towns: [
          { town: "Farnham", n: 92 },
          { town: "Godalming", n: 62 },
          { town: "Haslemere", n: 31 },
          { town: "Cranleigh", n: 31 },
        ],
      },
      {
        borough: "Surrey Heath",
        towns: [
          { town: "Camberley", n: 78 },
          { town: "Frimley", n: 46 },
          { town: "Bagshot", n: 16 },
          { town: "Lightwater", n: 15 },
        ],
      },
      {
        borough: "Runnymede",
        towns: [
          { town: "Addlestone", n: 62 },
          { town: "Egham", n: 46 },
          { town: "Chertsey", n: 31 },
          { town: "Virginia Water", n: 16 },
        ],
      },
      {
        borough: "Spelthorne",
        towns: [
          { town: "Staines-upon-Thames", n: 62 },
          { town: "Ashford", n: 46 },
          { town: "Sunbury-on-Thames", n: 31 },
          { town: "Shepperton", n: 15 },
        ],
      },
    ],
  },
  {
    region: "East Surrey",
    boroughs: [
      {
        borough: "Elmbridge",
        towns: [
          { town: "Walton-on-Thames", n: 78 },
          { town: "Esher", n: 46 },
          { town: "Weybridge", n: 46 },
          { town: "Cobham", n: 31 },
          { town: "Molesey", n: 16 },
        ],
      },
      {
        borough: "Reigate & Banstead",
        towns: [
          { town: "Redhill", n: 93 },
          { town: "Reigate", n: 62 },
          { town: "Banstead", n: 46 },
          { town: "Horley", n: 31 },
          { town: "Tadworth", n: 16 },
        ],
      },
      {
        borough: "Mole Valley",
        towns: [
          { town: "Dorking", n: 62 },
          { town: "Leatherhead", n: 46 },
          { town: "Ashtead", n: 31 },
          { town: "Bookham", n: 16 },
        ],
      },
      {
        borough: "Epsom & Ewell",
        towns: [
          { town: "Epsom", n: 78 },
          { town: "Ewell", n: 46 },
          { town: "Stoneleigh", n: 15 },
        ],
      },
      {
        borough: "Tandridge",
        towns: [
          { town: "Caterham", n: 46 },
          { town: "Oxted", n: 31 },
          { town: "Warlingham", n: 16 },
          { town: "Lingfield", n: 15 },
        ],
      },
    ],
  },
];

export function boroughTotal(b: BoroughStat): number {
  return b.towns.reduce((sum, t) => sum + t.n, 0);
}

export function regionTotal(r: RegionStat): number {
  return r.boroughs.reduce((sum, b) => sum + boroughTotal(b), 0);
}

export function grandTotal(): number {
  return SURREY_GEO.reduce((sum, r) => sum + regionTotal(r), 0);
}

export function findRegion(region: string): RegionStat | undefined {
  return SURREY_GEO.find((r) => r.region === region);
}

export function townsForRegion(region: string): TownStat[] {
  const r = findRegion(region);
  return r ? r.boroughs.flatMap((b) => b.towns) : [];
}

export function townsForBorough(region: string, borough: string): TownStat[] {
  const r = findRegion(region);
  return r?.boroughs.find((b) => b.borough === borough)?.towns ?? [];
}

export function allTowns(): TownStat[] {
  return SURREY_GEO.flatMap((r) => r.boroughs.flatMap((b) => b.towns));
}
