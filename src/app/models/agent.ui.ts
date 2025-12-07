
export interface Agent {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  agentCount?: number;
  technology?: string;
  stage?: string;

  agentNames?: string[];
  clientName?: string;
  clientType?: string;
  pocName?: string;
  pocEmail?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  resources?: Array<{ url: string; description: string }>;

  businessChallenge?: {
    title: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };
  solutionOverview?: {
    title: string;
    description: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };
  benefits?: {
    title: string;
    subTitle: string;
    points: Array<{ heading: string; description: string }>;
  };

  createdAt?: string;
  updatedAt?: string;
}
