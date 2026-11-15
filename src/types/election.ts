export type ElectionDatasetMode = 'lv2026' | 'lv2022';

export type ElectionStage = 'v_teku' | 'delni' | 'koncni';

export interface TurnoutCheckpoint {
  label: string;
  time: string;
  municipalityPct: number | null;
  pragerskoPct: number | null;
  sloveniaPct: number | null;
  municipalityVoters?: number | null;
  municipalityEligible?: number | null;
  certificatesCount?: number | null;
  pragerskoVoters?: number | null;
  pragerskoEligible?: number | null;
}

export interface MayoralCandidate {
  id: string;
  name: string;
  proposer: string;
  color: string;
  votes: number | null;
  isIncumbent?: boolean;
  knownPct2022?: number;
}

export interface CouncilList {
  id: string;
  shortName: string;
  fullName: string;
  color: string;
  votesByUnit: Record<string, number | null>;
  /** Aggregate municipality-wide vote count reported by DVK. */
  dvkTotalVotes?: number | null;
  seats2022: number;
  knownSeatsOverride?: number | null;
}

export interface ElectoralUnit {
  id: string;
  number: number;
  name: string;
  seats: number;
  communities: string[];
  includesPragerskoGaj?: boolean;
}

export interface CouncilCandidate {
  id: string;
  listId: string;
  unitId: string;
  ballotOrder: number;
  name: string;
  birthYear?: number;
  residence?: string;
  preferentialVotes: number | null;
  manualElected?: boolean;
}

export interface KsCandidate {
  id: string;
  ballotNumber: number;
  name: string;
  birthYear?: number;
  residence: string;
  proposer: string;
  votes: number | null;
}

export interface ElectionDataset {
  year: number;
  dateLabel: string;
  stage: ElectionStage;
  hasResults?: boolean;
  casUdelezba?: string | null;
  dvkUpdatedAt?: string | null;
  dvkVotesCounted?: number | null;
  dvkCountedPct?: number | null;
  lastUpdatedLabel: string;
  sourceNote: string;
  eligibleVotersMunicipality: number | null;
  eligibleVotersPragersko: number | null;
  invalidBallotsMayor: number | null;
  invalidBallotsCouncil: number | null;
  invalidBallotsKs: number | null;
  turnout: TurnoutCheckpoint[];
  mayoralCandidates: MayoralCandidate[];
  electoralUnits: ElectoralUnit[];
  councilLists: CouncilList[];
  councilCandidates: CouncilCandidate[];
  ksSeatsTotal: number;
  ksPollingStation: {
    name: string;
    address: string;
    headquarters: string;
    systemNote: string;
  };
  ksCandidates: KsCandidate[];
}
