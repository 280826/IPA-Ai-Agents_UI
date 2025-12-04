import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  agentCount?: number;
  technology?: string;
  stage?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<Agent[]>(`${environment.apiBaseUrl}/usecase/list`);
  }
}
