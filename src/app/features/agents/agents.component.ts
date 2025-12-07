
import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { AgentsService, UsecaseFilters } from '../../services/agents.service';
import { Agent } from '../../models/agent.ui';
import { UsecaseListItemDTO } from '../../models/usecase-list.dto';
import { mapUsecaseItemToAgent } from '../../models/mapper';

type StageApi = 'Prod' | 'Solution' | 'POC' | string;
type StageUi  = 'Production' | 'Solution' | 'POC' | '' | string;

// Stage label mapping (UI ↔ API)
function toUiStage(api: StageApi | undefined): StageUi {
  if (!api) return '';
  switch (api) {
    case 'Prod':     return 'Production';
    case 'POC':      return 'POC';
    case 'Solution': return 'Solution';
    default:         return api;
  }
}
function toApiStage(ui: StageUi | undefined): StageApi | undefined {
  if (!ui) return undefined;
  switch (ui.trim()) {
    case 'Production': return 'Prod';
    case 'POC':        return 'POC';
    case 'Solution':   return 'Solution';
    default:           return ui;
  }
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
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly svc    = inject(AgentsService);

  // ----- UI state -----
  readonly loading = signal<boolean>(true);
  readonly error   = signal<string | null>(null);
  readonly agents  = signal<Agent[]>([]);
  readonly hasData = computed(() => this.agents().length > 0);

  // ----- Filters (UI) -----
  readonly searchText         = signal<string>(''); // shown in pill input
  readonly selectedIndustry   = signal<string>(''); // e.g., 'Banking and Financial' or codes like 'INS'
  readonly selectedTechnology = signal<string>(''); // CSV or single tech
  readonly selectedStage      = signal<StageUi>(''); // 'Production'|'Solution'|'POC'|''

  // ----- Filters (API) -----
  readonly filters = signal<UsecaseFilters>({});      // { vertical?: string; stage?: StageApi; techStack?: string[]; search?: string }

  // ----- Pagination -----
  readonly useCursor = signal<boolean>(false);
  readonly pageIndex = signal<number>(0); // zero-based
  readonly pageSize  = signal<number>(6);
  readonly total     = signal<number>(0);
  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    const t = Math.max(0, this.total());
    return Math.max(1, Math.ceil(t / size));
  });

  // ----- Cursor hints -----
  readonly cursorId   = signal<string | undefined>(undefined);
  readonly cursorSkip = signal<number>(1);

  // ----- Pagination pills -----
  readonly pagePills = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.pageIndex() + 1;
    const pills: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pills.push(i);
      return pills;
    }

    pills.push(1);
    if (current > 3) pills.push('…');

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pills.push(i);

    if (current < total - 2) pills.push('…');
    pills.push(total);
    return pills;
  });

  // ----- Lifecycle -----
  ngOnInit(): void {
    // initialize from query params (deep-linking)
    this.route.queryParamMap.subscribe(params => {
      // helpers
      const toPositiveInt = (v: string | null, d: number) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : d;
      };

      const page   = toPositiveInt(params.get('page'), 1);
      const limit  = toPositiveInt(params.get('limit'), 6);
      const id     = params.get('id') ?? undefined;
      const skipRaw = Number(params.get('skip'));
      const skip   = Number.isFinite(skipRaw) && skipRaw !== 0 ? skipRaw : 1;

      const vertical  = params.get('vertical') ?? undefined;
      const stageApi  = params.get('stage') ?? undefined;       // server expects 'Prod'|'Solution'|'POC'
      const techCsv   = params.get('techStack') ?? undefined;
      const search    = params.get('search') ?? undefined;

      const techStack = techCsv ? techCsv.split(',').filter(Boolean) : undefined;

      // set core
      this.pageIndex.set(Math.max(page - 1, 0));
      this.pageSize.set(limit);
      this.cursorId.set(id);
      this.cursorSkip.set(skip);

      // set API filters
      this.filters.set({ vertical, stage: stageApi, techStack, search });

      // reflect UI selections from URL
      this.selectedIndustry.set(vertical ?? '');
      this.selectedStage.set(toUiStage(stageApi));
      this.selectedTechnology.set(techCsv ?? '');
      this.searchText.set(search ?? '');

      // toggle mode
      this.useCursor.set(Boolean(id));

      // fetch data
      this.fetch();
    });
  }

  // ----- Data fetch -----
  private fetch(): void {
    this.loading.set(true);
    const f = this.filters();

    if (this.useCursor()) {
      this.svc.listByCursor(this.cursorId(), this.cursorSkip(), this.pageSize(), f)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            const data = res?.data;
            const items: UsecaseListItemDTO[] = data?.items ?? [];
            this.agents.set(items.map(mapUsecaseItemToAgent));
            this.total.set(data?.total ?? (this.total() || items.length));
            // advance cursor id using last item or server-provided id
            const last = items[items.length - 1];
            const nextId = last?._id ?? data?.id;
            if (nextId) this.cursorId.set(nextId);
            this.error.set(null);
          },
          error: (err) => {
            console.error('Cursor fetch failed', err);
            this.error.set('Could not load agents. Please try again.');
          }
        });
    } else {
      const page = this.pageIndex() + 1;
      this.svc.listPaged(page, this.pageSize(), f)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            const data = res?.data;
            const items: UsecaseListItemDTO[] = data?.items ?? [];
            this.agents.set(items.map(mapUsecaseItemToAgent));
            this.total.set(data?.total ?? items.length);
            this.pageIndex.set((data?.page ?? page) - 1);
            this.pageSize.set(data?.limit ?? this.pageSize());
            this.error.set(null);
          },
          error: (err) => {
            console.error('Paged fetch failed', err);
            this.error.set('Could not load agents. Please try again.');
          }
        });
    }
  }

  // ----- Pagination actions (offset mode) -----
  gotoPage(p: number | string) {
    if (typeof p !== 'number') return;
    this.navigate({ page: p });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }
  prev() {
    if (this.useCursor()) return this.prevCursor();
    if (this.pageIndex() > 0) this.navigate({ page: this.pageIndex() }); // previous page = index
  }
  next() {
    if (this.useCursor()) return this.nextCursor();
    if (this.pageIndex() + 1 < this.totalPages()) this.navigate({ page: this.pageIndex() + 2 }); // next page = index+2
  }
  changeSize(size: number) {
    const nextLimit = +size;
    if (this.useCursor()) {
      // leave cursor mode & reset to page 1
      this.navigate({ page: 1, limit: nextLimit, id: null, skip: 1 });
    } else {
      this.navigate({ page: 1, limit: nextLimit });
    }
  }

  // ----- Cursor actions -----
  prevCursor() {
    this.navigate({ id: this.cursorId(), skip: -1, limit: this.pageSize() });
  }
  nextCursor() {
    this.navigate({ id: this.cursorId(), skip: 1, limit: this.pageSize() });
  }

  // ----- Filter handlers -----
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
  }
  onIndustryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedIndustry.set(value);
    this.applyFilters();
  }
  onTechnologyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTechnology.set(value);
    this.applyFilters();
  }
  onStageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value; // 'Production'|'Solution'|'POC'|''
    this.selectedStage.set(value);
    this.applyFilters();
  }

  /** Apply filters and deep-link */
  applyFilters() {
    // Convert UI selections to server filters
    const vertical = this.selectedIndustry() || undefined;
    const stageApi = toApiStage(this.selectedStage() || undefined);
    const techCsv  = this.selectedTechnology() || undefined;
    const search   = this.searchText()?.trim() || undefined;

    // Reset to first page on filter change
    if (this.useCursor()) {
      this.navigate({ page: 1, id: null, skip: 1, vertical, stage: stageApi, techStack: techCsv?.split(','), search });
    } else {
      this.navigate({ page: 1, vertical, stage: stageApi, techStack: techCsv?.split(','), search });
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  /** Update the URL query params (deep-linking) */
  public navigate(opts: {
    page?: number;
    limit?: number;
    id?: string | null | undefined; // null means remove param
    skip?: number;
    vertical?: string;
    stage?: string;
    techStack?: string[] | string;
    search?: string;
  }) {
    const qp: Record<string, any> = {
      page: opts.page ?? (this.pageIndex() + 1),
      limit: opts.limit ?? this.pageSize(),
    };

    // cursor hints — allow null to remove
    const nextId   = opts.id ?? (this.useCursor() ? this.cursorId() : undefined);
    const nextSkip = opts.skip ?? (this.useCursor() ? this.cursorSkip() : undefined);
    if (nextId !== undefined)   qp['id']   = nextId === null ? null : nextId;
    if (nextSkip !== undefined) qp['skip'] = nextSkip;

    // filters
    const vertical = opts.vertical ?? this.filters().vertical;
    const stage    = opts.stage ?? this.filters().stage;
    const tech     = opts.techStack ?? this.filters().techStack;
    const search   = opts.search ?? this.filters().search;

    const techCsv  = Array.isArray(tech) ? tech.join(',') : (tech ?? '');

    qp['vertical']  = vertical ?? null;
    qp['stage']     = stage ?? null;
    qp['techStack'] = techCsv || null;
    qp['search']    = (search && search.trim()) || null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
