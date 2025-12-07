
import { UsecaseListItemDTO } from './usecase-list.dto';
import { Agent } from './agent.ui';

export function mapUsecaseItemToAgent(d: UsecaseListItemDTO): Agent {
  return {
    id: d._id,
    name: d.usecaseName,
    description: d.description,
    industry: d.vertical,
    agentCount: d.totalAgents,
    technology: Array.isArray(d.techStack) ? d.techStack.join(', ') : undefined,
    stage: d.stage,

    agentNames: d.agentNames,
    clientName: d.clientName,
    clientType: d.clientType,
    pocName: d.pocName,
    pocEmail: d.pocEmail,
    thumbnailUrl: d.thumbnailUrl,
    videoUrl: d.videoUrl,
    resources: d.resources,

    businessChallenge: d.bussinessChallenge && {
      title: d.bussinessChallenge.title,
      subTitle: d.bussinessChallenge.subTitle,
      points: d.bussinessChallenge.points?.map(p => ({ heading: p.heading, description: p.description })) ?? []
    },
    solutionOverview: d.solutionOverview && {
      title: d.solutionOverview.title,
      description: d.solutionOverview.description,
      subTitle: d.solutionOverview.subTitle,
      points: d.solutionOverview.points?.map(p => ({ heading: p.heading, description: p.description })) ?? []
    },
    benefits: d.benefits && {
      title: d.benefits.title,
      subTitle: d.benefits.subTitle,
      points: d.benefits.points?.map(p => ({ heading: p.heading, description: p.description })) ?? []
    },

    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
