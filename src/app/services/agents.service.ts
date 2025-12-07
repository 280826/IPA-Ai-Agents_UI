
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsecaseListResponseDTO } from '../models/usecase-list.dto';

/** Shared filter type across app */
export interface UsecaseFilters {
  vertical?: string;                   // e.g. 'INS'
  techStack?: string | string[];       // 'UiPath Agentic,Copilot' or ['UiPath Agentic','Copilot']
  stage?: 'Prod' | 'Solution' | 'POC' | string;
  search?: string;                     // standardized search param
}

/** --------- Query helpers --------- */

function toCsv(input?: string | string[]): string | undefined {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) {
    const filtered = input.map(s => s?.trim()).filter(Boolean);
    return filtered.length ? filtered.join(',') : undefined;
  }
  const trimmed = input.trim();
  return trimmed ? trimmed : undefined;
}

function buildFilterParams(filters?: UsecaseFilters): Record<string, string> {
  if (!filters) return {};
  const out: Record<string, string> = {};
  if (filters.vertical) out['vertical'] = filters.vertical.trim();
  if (filters.stage)    out['stage']    = filters.stage.trim();
  const csv = toCsv(filters.techStack);
  if (csv) out['techStack'] = csv;
  if (filters.search) out['search'] = filters.search.trim();
  return out;
}

function buildParams(base: Record<string, string | number | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, val] of Object.entries(base)) {
    if (val === undefined || val === null || val === '') continue;
    params = params.set(key, String(val));
  }
  return params;
}

/** A single builder for both offset & cursor modes */
function buildQuery(opts: {
  mode: 'offset' | 'cursor';
  page?: number;            // offset
  id?: string;              // cursor
  skip?: number;            // cursor step: -1 | 1
  limit?: number;
  filters?: UsecaseFilters;
}): HttpParams {
  const { mode, page, id, skip, limit, filters } = opts;

  const f = buildFilterParams(filters);
  const safeLimit = Math.max(1, Number(limit ?? 10));
  const safePage  = Math.max(1, Number(page ?? 1));
  const safeSkip  = (() => {
    const k = Number(skip ?? 1);
    return k === 0 ? 1 : Math.sign(k) || 1; // normalize to -1 or 1
  })();

  return mode === 'offset'
    ? buildParams({ page: safePage, limit: safeLimit, ...f })
    : buildParams({ id, skip: safeSkip, limit: safeLimit, ...f });
}

/** --------- Service --------- */
@Injectable({ providedIn: 'root' })
export class AgentsService {
  constructor(private http: HttpClient) {}

  /** Offset-based pagination (page & limit) */
  listPaged(page = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
    const params = buildQuery({ mode: 'offset', page, limit, filters });
    return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
  }

  /** Cursor/seek-based pagination (id, skip & limit) */
  listByCursor(id?: string, skip = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
    const params = buildQuery({ mode: 'cursor', id, skip, limit, filters });
    return this.http.get<UsecaseListResponseDTO>(`${environment.apiBaseUrl}/usecase/list`, { params });
  }

  /** Legacy flat list */
  list(): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/usecase/list`);
  }
}
