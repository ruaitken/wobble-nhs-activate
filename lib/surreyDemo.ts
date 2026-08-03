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
          { town: "Guildford", n: 9 },
          { town: "Ash", n: 3 },
          { town: "Shalford", n: 2 },
          { town: "Send", n: 1 },
        ],
      },
      {
        borough: "Woking",
        towns: [
          { town: "Woking", n: 8 },
          { town: "Knaphill", n: 3 },
          { town: "Horsell", n: 2 },
          { town: "West Byfleet", n: 2 },
        ],
      },
      {
        borough: "Waverley",
        towns: [
          { town: "Farnham", n: 6 },
          { town: "Godalming", n: 4 },
          { town: "Haslemere", n: 2 },
          { town: "Cranleigh", n: 2 },
        ],
      },
      {
        borough: "Surrey Heath",
        towns: [
          { town: "Camberley", n: 5 },
          { town: "Frimley", n: 3 },
          { town: "Bagshot", n: 1 },
          { town: "Lightwater", n: 1 },
        ],
      },
      {
        borough: "Runnymede",
        towns: [
          { town: "Addlestone", n: 4 },
          { town: "Egham", n: 3 },
          { town: "Chertsey", n: 2 },
          { town: "Virginia Water", n: 1 },
        ],
      },
      {
        borough: "Spelthorne",
        towns: [
          { town: "Staines-upon-Thames", n: 4 },
          { town: "Ashford", n: 3 },
          { town: "Sunbury-on-Thames", n: 2 },
          { town: "Shepperton", n: 1 },
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
          { town: "Walton-on-Thames", n: 5 },
          { town: "Esher", n: 3 },
          { town: "Weybridge", n: 3 },
          { town: "Cobham", n: 2 },
          { town: "Molesey", n: 1 },
        ],
      },
      {
        borough: "Reigate & Banstead",
        towns: [
          { town: "Redhill", n: 6 },
          { town: "Reigate", n: 4 },
          { town: "Banstead", n: 3 },
          { town: "Horley", n: 2 },
          { town: "Tadworth", n: 1 },
        ],
      },
      {
        borough: "Mole Valley",
        towns: [
          { town: "Dorking", n: 4 },
          { town: "Leatherhead", n: 3 },
          { town: "Ashtead", n: 2 },
          { town: "Bookham", n: 1 },
        ],
      },
      {
        borough: "Epsom & Ewell",
        towns: [
          { town: "Epsom", n: 5 },
          { town: "Ewell", n: 3 },
          { town: "Stoneleigh", n: 1 },
        ],
      },
      {
        borough: "Tandridge",
        towns: [
          { town: "Caterham", n: 3 },
          { town: "Oxted", n: 2 },
          { town: "Warlingham", n: 1 },
          { town: "Lingfield", n: 1 },
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
