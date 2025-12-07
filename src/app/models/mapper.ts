
import { UsecaseListItemDTO } from './usecase-list.dto';
import { Agent } from './agent.ui';

export function mapUsecaseItemToAgent(d: UsecaseListItemDTO): Agent {
  const technology = Array.isArray(d.techStack)
    ? d.techStack.filter(Boolean).join(' · ')
    : undefined;

  const agentCount =
    Number.isFinite(d.totalAgents)
      ? d.totalAgents
      : (Array.isArray(d.agentNames) ? d.agentNames.length : undefined);

  return {
    id: d._id,
    name: d.usecaseName?.trim(),
    description: d.description?.trim(),
    industry: d.vertical?.trim(),
    agentCount,
    technology,
    stage: d.stage,

    agentNames: d.agentNames ?? [],
    clientName: d.clientName?.trim(),
    clientType: d.clientType,
    pocName: d.pocName?.trim(),
    pocEmail: d.pocEmail?.trim(),
    thumbnailUrl: d.thumbnailUrl,
    videoUrl: d.videoUrl,
    resources: d.resources ?? [],

    businessChallenge: d.bussinessChallenge && {
      title: d.bussinessChallenge.title,
      subTitle: d.bussinessChallenge.subTitle,
      points: (d.bussinessChallenge.points ?? []).map(p => ({
        heading: p.heading,
        description: p.description
      }))
    },

    solutionOverview: d.solutionOverview && {
      title: d.solutionOverview.title,
      description: d.solutionOverview.description,
      subTitle: d.solutionOverview.subTitle,
      points: (d.solutionOverview.points ?? []).map(p => ({
        heading: p.heading,
        description: p.description
      }))
    },

    benefits: d.benefits && {
      title: d.benefits.title,
      subTitle: d.benefits.subTitle,
      points: (d.benefits.points ?? []).map(p => ({
        heading: p.heading,
        description: p.description
      }))
    },

    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
