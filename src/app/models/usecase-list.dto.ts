
/** Exact server item shape */
export interface UsecaseListItemDTO {
  _id: string;
  stage: 'Prod' | 'Solution' | 'POC' | string;
  agentNames: string[];
  totalAgents: number;
  techStack: string[];
  usecaseName: string;
  description: string;
  vertical: string;
  clientName: string;
  clientType: 'Client' | 'Prospect' | string;
  pocName: string;
  pocEmail: string;
  thumbnailUrl: string;
  videoUrl: string;
  resources: Array<{ url: string; description: string }>;
  // Server keeps typo "bussinessChallenge"; we map it later.
  bussinessChallenge: {
    title: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };
  solutionOverview: {
    title: string;
    description: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };
  benefits: {
    title: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

/** Paginated envelope */
export interface UsecaseListResponseDTO {
  ok?: boolean;
  data: {
    items: UsecaseListItemDTO[];
    total: number;     // total matches across all pages
    page?: number;     // 1-based (offset mode)
    limit: number;     // page size
    // cursor/seek hints (optional)
    skip?: number;
    id?: string;       // cursor id from server (optional)
  };
}
