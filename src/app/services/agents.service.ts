import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UsecaseListItemDTO, UsecaseListResponseDTO } from '../models/usecase-list.dto';

/** Shared filter type across app */
export interface UsecaseFilters {
  vertical?: string; // e.g. 'INS'
  techStack?: string | string[]; // 'UiPath Agentic,Copilot' or ['UiPath Agentic','Copilot']
  stage?: 'Prod' | 'Solution' | 'POC' | string;
  search?: string; // standardized search param
}

export interface UsecaseOneResponseDTO {
  ok?: boolean;
  data: UsecaseListItemDTO; // SINGLE item (not array)
}

export interface DropdownItem {
  _id: string;
  label: string;
  value: string;
  __v?: number;
}
export interface DropdownsDTO {
  ok: boolean;
  data: {
    vertical: DropdownItem[];
    stage: DropdownItem[];
    techStack: DropdownItem[];
  };
}

/** --------- Query helpers --------- */

function toCsv(input?: string | string[]): string | undefined {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) {
    const filtered = input.map((s) => s?.trim()).filter(Boolean);
    return filtered.length ? filtered.join(',') : undefined;
  }
  const trimmed = input.trim();
  return trimmed ? trimmed : undefined;
}

function buildFilterParams(filters?: UsecaseFilters): Record<string, string> {
  if (!filters) return {};
  const out: Record<string, string> = {};
  if (filters.vertical) out['vertical'] = filters.vertical.trim();
  if (filters.stage) out['stage'] = filters.stage.trim();
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
  page?: number; // offset
  id?: string; // cursor
  skip?: number; // cursor step: -1 | 1
  limit?: number;
  filters?: UsecaseFilters;
}): HttpParams {
  const { mode, page, id, skip, limit, filters } = opts;

  const f = buildFilterParams(filters);
  const safeLimit = Math.max(1, Number(limit ?? 10));
  const safePage = Math.max(1, Number(page ?? 1));
  const safeSkip = (() => {
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

  // --- lightweight local cache (per params) ---
  private readonly cache = new Map<
    string,
    { ts: number; data: UsecaseListResponseDTO | DropdownsDTO }
  >();
  private readonly ttlMs = 15_000; // 15s; adjust as needed

  private getCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    const fresh = Date.now() - entry.ts < this.ttlMs;
    if (!fresh) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data as T;
  }
  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { ts: Date.now(), data: data as UsecaseListResponseDTO });
  }
  private keyFromParams(url: string, params?: HttpParams): string {
    return params ? `${url}?${params.toString()}` : url;
  }

  /** Offset-based pagination (page & limit) */
  listPaged(page = 1, limit = 10, filters?: UsecaseFilters): Observable<UsecaseListResponseDTO> {
    const params = buildQuery({ mode: 'offset', page, limit, filters });
    const url = `${environment.apiBaseUrl}/usecase/list`;
    const key = this.keyFromParams(url, params);

    const cached = this.getCache(key);
    if (cached) return of(cached as UsecaseListResponseDTO);

    return this.http
      .get<UsecaseListResponseDTO>(url, { params })
      .pipe(tap((data) => this.setCache(key, data)));
  }

  /** Cursor/seek-based pagination (id, skip & limit) */
  listByCursor(
    id?: string,
    skip = 1,
    limit = 10,
    filters?: UsecaseFilters
  ): Observable<UsecaseListResponseDTO> {
    const params = buildQuery({ mode: 'cursor', id, skip, limit, filters });
    const url = `${environment.apiBaseUrl}/usecase/list`;
    const key = this.keyFromParams(url, params);

    const cached = this.getCache(key);
    if (cached) return of(cached as UsecaseListResponseDTO);

    return this.http
      .get<UsecaseListResponseDTO>(url, { params })
      .pipe(tap((data) => this.setCache(key, data)));
  }

  /** Legacy flat list */
  list(): Observable<unknown> {
    return this.http.get<unknown>(`${environment.apiBaseUrl}/usecase/list`);
  }

  /** NEW: dropdowns for vertical, stage, techStack */
  dropdowns(): Observable<DropdownsDTO> {
    const url = "/assets/data/dropdowns.json";
    // const url = `${environment.apiBaseUrl}/usecase/dropdowns`;
    const key = this.keyFromParams(url);
    const cached = this.getCache<DropdownsDTO>(key);
    if (cached) return of(cached);
    return this.http.get<DropdownsDTO>(url).pipe(tap((data) => this.setCache(key, data)));
  }

  /** NEW: Get-by-id, server returns a single item in data */
  getOne(id: string): Observable<UsecaseOneResponseDTO> {
    const params = new HttpParams().set('id', id).set('limit', '1'); // limit optional; keeps parity if server accepts it
    const url = `${environment.apiBaseUrl}/usecase/list`;
    const key = this.keyFromParams(url, params);
    const cached = this.getCache<UsecaseListResponseDTO>(key);
    if (cached) return of(cached as unknown as UsecaseOneResponseDTO);
    return this.http
      .get<UsecaseOneResponseDTO>(url, { params })
      .pipe(tap((data) => this.setCache(key, data as unknown as UsecaseListResponseDTO)));
  }
}
