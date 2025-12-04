import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface Agent {
  id: string;
  imageUrl: string;
  imageAlt?: string;
  name: string;
  description: string;
  industry: string;
  technology: string;
  stage: 'Production' | 'Solution';
  agentCount: number;
}

@Component({
  standalone: true,
  selector: 'app-agents',
  imports: [CommonModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  searchText = signal('');
  selectedIndustry = signal('Banking and Financial');
  selectedTechnology = signal('Azure');
  currentPage = signal(2);
  totalPages = 3;

  agents = signal<Agent[]>([
    {
      id: '1',
      imageUrl: 'assets/images/temp/Mask Group 1.png',
      name: 'Employee Experience',
      description: 'Employee Experience Agent automates the auditing of travel and expense prepayment requests by validating policy compliance and detecting anomalies before disbursement. It enhances financial control and reduces manual review effort through intelligent rule-based checks.',
      industry: 'Finance & Accounting',
      technology: 'Azure | Langchain Langraph',
      stage: 'Production',
      agentCount: 2
    },
    {
      id: '2',
      imageUrl: 'assets/images/temp/Mask Group 2.png',
      name: 'Insurance Assistant',
      description: 'Insurance Assistant Agent automates the auditing of travel and expense prepayment requests by validating policy compliance and detecting anomalies before disbursement. It enhances financial control and reduces manual review effort through intelligent rule-based checks.',
      industry: 'Finance & Accounting',
      technology: 'Azure | Langchain Langraph',
      stage: 'Production',
      agentCount: 1
    },
    {
      id: '3',
      imageUrl: 'assets/images/temp/Mask Group 3.png',
      name: 'Medical Records',
      description: 'Medical Records Agent automates the auditing of travel and expense prepayment requests by validating policy compliance and detecting anomalies before disbursement. It enhances financial control and reduces manual review effort through intelligent rule-based checks.',
      industry: 'Finance & Accounting',
      technology: 'Azure | Langchain Langraph',
      stage: 'Production',
      agentCount: 1
    },
    {
      id: '4',
      imageUrl: 'assets/images/temp/Mask Group 1.png',
      name: 'T&E Pre-Pay Audit',
      description: 'T&E Prepay Audit Agent automates the auditing of travel and expense prepayment requests by validating policy compliance and detecting anomalies before disbursement. It enhances financial control and reduces manual review effort through intelligent rule-based checks.',
      industry: 'Finance & Accounting',
      technology: 'Azure | Langchain Langraph',
      stage: 'Production',
      agentCount: 4
    },
    {
      id: '5',
      imageUrl: 'assets/images/temp/Mask Group 2.png',
      name: 'Inventory Manager',
      description: 'An agent autonomously manages perishable inventory across distributed F&B locations by forecasting demand, adjusting stock levels, and minimizing waste. It responds dynamically to seasonal trends, promotions, and consumer behaviour, ensuring freshness and cost efficiency.',
      industry: 'Supply Chain',
      technology: 'Copilot Studio | UiPath Agentic',
      stage: 'Solution',
      agentCount: 1
    },
    {
      id: '6',
      imageUrl: 'assets/images/temp/Mask Group 3.png',
      name: 'FNOL',
      description: 'First notice of loss - An agent autonomously captures and processes the first notice of loss from policyholders, initiating claims workflows with real-time data validation and triage. It accelerates investigations and support delivery by integrating incident reporting with insurer systems.',
      industry: 'Insurance',
      technology: 'UiPath Agentic',
      stage: 'Solution',
      agentCount: 2
    }
  ]);

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
  }

  onIndustryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedIndustry.set(value);
  }

  onTechnologyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTechnology.set(value);
  }
}
