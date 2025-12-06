
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsecaseListResponseDTO } from '../models/usecase-list.dto';

export interface UsecaseFilters {
  vertical?: string;                  // e.g. INS
  techStack?: string | string[];      // e.g. 'UiPath Agentic,Copilot' or ['UiPath Agentic','Copilot']
  stage?: string;                     // e.g. 'Solution'
}

function buildParams(base: Record<string, string | number | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, val] of Object.entries(base)) {
    if (val === undefined || val === null || val === '') continue;
    params = params.set(key, String(val));
  }
  return params;
}

function toCsv(input?: string | string[]): string | undefined {
  if (input === undefined) return undefined;
  return Array.isArray(input) ? input.join(',') : input;
}

function buildFilterParams(filters?: UsecaseFilters): Record<string, string> {
  if (!filters) return {};
  const out: Record<string, string> = {};
  if (filters.vertical) out['vertical'] = filters.vertical;
  if (filters.stage) out['stage'] = filters.stage;
  const csv = toCsv(filters.techStack);
  if (csv) out['techStack'] = csv;
  return out;
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
  constructor(private http: HttpClient) {}

  /** Offset-based pagination (page & limit) */
  listPaged(page = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
    const f = buildFilterParams(filters);
    const params = buildParams({ page, limit, ...f });
    return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
  }

  /** Cursor/seek-based pagination (id, skip & limit) */
  listByCursor(id?: string, skip = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
    const f = buildFilterParams(filters);
    const params = buildParams({ id, skip, limit, ...f });
    return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
  }

  /** Legacy flat list if any other parts require it (keep as any) */
  list(): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/usecase/list`);
  }
}

// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../environments/environment';
// import { UsecaseListResponseDTO } from '../models/usecase-list.dto';

// export interface UsecaseFilters {
//   vertical?: string;
//   techStack?: string | string[]; // 'UiPath Agentic,Copilot' or ['UiPath Agentic','Copilot']
//   stage?: string;
// }

// function buildParams(base: Record<string, string | number | undefined>): HttpParams {
//   let params = new HttpParams();
//   for (const [key, val] of Object.entries(base)) {
//     if (val === undefined || val === null || val === '') continue;
//     params = params.set(key, String(val));
//   }
//   return params;
// }

// function toCsv(input?: string | string[]): string | undefined {
//   if (input === undefined) return undefined;
//   return Array.isArray(input) ? input.join(',') : input;
// }

// function buildFilterParams(filters?: UsecaseFilters): Record<string, string> {
//   if (!filters) return {};
//   const out: Record<string, string> = {};
//   if (filters.vertical) out['vertical'] = filters.vertical;
//   if (filters.stage) out['stage'] = filters.stage;
//   const csv = toCsv(filters.techStack);
//   if (csv) out['techStack'] = csv;
//   return out;
// }

// @Injectable({ providedIn: 'root' })
// export class AgentsService {
//   constructor(private http: HttpClient) {}

//   /** Offset-based pagination */
//   listPaged(page = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
//     const filterParams = buildFilterParams(filters);
//     const params = buildParams({ page, limit, ...filterParams });
//     return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
//   }

//   /** Cursor/seek-based pagination */
//   listByCursor(id?: string, skip = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
//     const filterParams = buildFilterParams(filters);
//     const params = buildParams({ id, skip, limit, ...filterParams });
//     return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
//   }
// }
