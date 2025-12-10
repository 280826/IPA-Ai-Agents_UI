import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import {
  AgentsService,
  UsecaseFilters,
  DropdownsDTO,
  DropdownItem,
} from '../../services/agents.service';
import { Agent } from '../../models/agent.ui';
import { UsecaseListItemDTO } from '../../models/usecase-list.dto';
import { mapUsecaseItemToAgent } from '../../models/mapper';

type StageApi = 'Prod' | 'Solution' | 'POC' | string;
type StageUi = 'Production' | 'Solution' | 'POC' | '' | string;

// Stage label mapping (UI ↔ API)
function toUiStage(api: StageApi | undefined): StageUi {
  if (!api) return '';
  switch (api) {
    case 'Prod':
      return 'Production';
    case 'POC':
      return 'POC';
    case 'Solution':
      return 'Solution';
    default:
      return api;
  }
}
function toApiStage(ui: StageUi | undefined): StageApi | undefined {
  if (!ui) return undefined;
  switch (ui.trim()) {
    case 'Production':
      return 'Prod';
    case 'POC':
      return 'POC';
    case 'Solution':
      return 'Solution';
    default:
      return ui;
  }
}

@Component({
  standalone: true,
  selector: 'app-agents',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(AgentsService);

  // ----- UI state -----
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly agents = signal<Agent[]>([]);
  readonly hasData = computed(() => this.agents().length > 0);

  // ----- Filters (UI) -----
  readonly searchText = signal<string>(''); // shown in pill input
  readonly selectedIndustry = signal<string>(''); // e.g., 'Banking and Financial' or code like 'BFS'
  readonly selectedTechnology = signal<string>(''); // CSV or single tech
  readonly selectedStage = signal<StageUi>(''); // 'Production'|'Solution'|'POC'|''

  // Dropdown option signals
  readonly verticalOptions = signal<DropdownItem[]>([]);
  readonly stageOptions = signal<DropdownItem[]>([]);
  readonly techOptions = signal<DropdownItem[]>([]);

  // ----- Filters (API) -----
  readonly filters = signal<UsecaseFilters>({}); // { vertical?: string; stage?: StageApi; techStack?: string[]; search?: string }

  // ----- Pagination -----
  readonly useCursor = signal<boolean>(false);
  readonly pageIndex = signal<number>(0); // zero-based
  readonly pageSize = signal<number>(6);
  readonly total = signal<number>(0);
  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    const t = Math.max(0, this.total());
    return Math.max(1, Math.ceil(t / size));
  });

  // ----- Cursor hints -----
  readonly cursorId = signal<string | undefined>(undefined);
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
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pills.push(i);

    if (current < total - 2) pills.push('…');
    pills.push(total);
    return pills;
  });

  /** True when we're on /agents/:id (detail page) */
  readonly detailMode = signal<boolean>(false);

  /** Helper: set detailMode based on current route snapshot (works on hard refresh) */
  private updateDetailModeFromSnapshot(): void {
    // If /agents has a child route with an 'id' param, we’re in detail mode
    const child = this.route.snapshot.firstChild;
    const id = child?.paramMap.get('id');
    this.detailMode.set(Boolean(id));
  }

  // ----- Lifecycle -----
  ngOnInit(): void {
    // fetch dropdowns once
    this.svc.dropdowns().subscribe({
      next: (dd: DropdownsDTO) => {
        const v = dd?.data?.vertical ?? [];
        const s = dd?.data?.stage ?? [];
        const t = dd?.data?.techStack ?? [];

        // Normalize stage values for UI consistency
        const normalizedStage = s.map((it) => {
          const val = it.value?.trim();
          let uiLabel = it.label;
          if (val === 'Prod') uiLabel = 'Production';
          if (val?.toLowerCase() === 'poc' || val === 'Poc') uiLabel = 'POC';
          return { ...it, label: uiLabel };
        });

        // Prepend "All" option (value '')
        const allOpt = (label: string): DropdownItem => ({ _id: 'all', label, value: '' });
        this.verticalOptions.set([allOpt('All'), ...v]);
        this.stageOptions.set([allOpt('All'), ...normalizedStage]);
        this.techOptions.set([allOpt('All'), ...t]);
      },
      error: () => {
        // Fallback: keep empty lists; selects will still show an "All" option via template
      },
    });

    // initialize from query params (deep-linking)
    this.route.queryParamMap.subscribe((params) => {
      // helpers
      const toPositiveInt = (v: string | null, d: number) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : d;
      };

      const page = toPositiveInt(params.get('page'), 1);
      const limit = toPositiveInt(params.get('limit'), 6);
      const id = params.get('id') ?? undefined;
      const skipRaw = Number(params.get('skip'));
      const skip = Number.isFinite(skipRaw) && skipRaw !== 0 ? skipRaw : 1;

      const vertical = params.get('vertical') ?? undefined;
      const stageApi = params.get('stage') ?? undefined; // server expects 'Prod'|'Solution'|'POC'
      const techCsv = params.get('techStack') ?? undefined;
      const search = params.get('search') ?? undefined;

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

    // Set detailMode immediately on init (covers page refresh & direct deep-linking)
    this.updateDetailModeFromSnapshot();

    // Toggle detail mode based on child :id
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        // update detail mode
        this.updateDetailModeFromSnapshot();

        // If we've entered detail mode, ensure the scrollable container is at the top.
        // Use a microtask to let the router/outlet render before changing scroll.
        if (this.detailMode()) {
          Promise.resolve().then(() => this.scrollMainToTop());
        }
      });
  }

  // ----- Data fetch -----
  private fetch(): void {
    this.loading.set(true);
    const f = this.filters();

    if (this.useCursor()) {
      this.svc
        .listByCursor(this.cursorId(), this.cursorSkip(), this.pageSize(), f)
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
          },
        });
    } else {
      const page = this.pageIndex() + 1;
      this.svc
        .listPaged(page, this.pageSize(), f)
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
          },
        });
    }
  }

  // ----- Pagination actions (offset mode) -----
  gotoPage(p: number | string) {
    if (typeof p !== 'number') return;
    this.navigate({ page: p });
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
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
    // Change size should not clear other filters; keep mode as-is
    this.navigate({ page: 1, limit: nextLimit });
  }

  // ----- Cursor actions -----
  prevCursor() {
    this.navigate({ id: this.cursorId(), skip: -1, limit: this.pageSize() });
  }
  nextCursor() {
    this.navigate({ id: this.cursorId(), skip: 1, limit: this.pageSize() });
  }

  // ----- Filter handlers (clear only the changed param when "All") -----
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    // No immediate fetch; user clicks Search button to apply (applyFilters)
  }

  onIndustryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value; // '' means All
    this.selectedIndustry.set(value);
    if (!value) {
      // Clear only 'vertical', keep other params
      this.filters.update((f) => ({ ...f, vertical: undefined }));
      this.navigate({ vertical: undefined });
      return;
    }
    // Apply change along with existing others
    this.applyFilters();
  }

  onTechnologyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value; // '' means All
    this.selectedTechnology.set(value);
    if (!value) {
      // Clear only 'techStack', keep other params
      this.filters.update((f) => ({ ...f, techStack: undefined }));
      this.navigate({ techStack: [] }); // causes removal in navigate (serialized to null)
      return;
    }
    this.applyFilters();
  }

  onStageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value; // 'Production'|'Solution'|'POC'|'' (All)
    this.selectedStage.set(value);
    if (!value) {
      // Clear only 'stage', keep other params
      this.filters.update((f) => ({ ...f, stage: undefined }));
      this.navigate({ stage: undefined });
      return;
    }
    this.applyFilters();
  }

  /** Apply all filters together (when clicking Search) */
  applyFilters() {
    const vertical = this.selectedIndustry() || undefined;
    const stageApi = toApiStage(this.selectedStage() || undefined);
    const techCsv = this.selectedTechnology() || undefined;
    const search = this.searchText()?.trim() || undefined;

    // Do not change cursor mode or other params; just set/clear the filters provided
    this.navigate({
      page: 1, // optional: reset to first page on search
      vertical,
      stage: stageApi,
      techStack: techCsv?.split(','),
      search,
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  /** Update the URL query params (deep-linking) */
  public navigate(opts: {
    page?: number;
    limit?: number;
    id?: string | null | undefined; // null means remove param (not used here except cursor actions)
    skip?: number;
    vertical?: string;
    stage?: string;
    techStack?: string[] | string;
    search?: string;
  }) {
    const qp: Record<string, any> = {
      page: opts.page ?? this.pageIndex() + 1,
      limit: opts.limit ?? this.pageSize(),
    };

    // cursor hints — only set if provided; don't touch otherwise
    if (opts.id !== undefined) qp['id'] = opts.id === null ? null : opts.id;
    if (opts.skip !== undefined) qp['skip'] = opts.skip;

    // filters: use provided values to set/clear ONLY those; leave others unchanged
    const current = this.filters();

    const vertical = opts.vertical !== undefined ? opts.vertical : current.vertical;
    const stage = opts.stage !== undefined ? opts.stage : current.stage;
    const tech = opts.techStack !== undefined ? opts.techStack : current.techStack;
    const search = opts.search !== undefined ? opts.search : current.search;

    const techCsv = Array.isArray(tech) ? tech.join(',') : tech ?? '';

    // Write or remove based on provided values (null removal with 'merge')
    qp['vertical'] = vertical ?? null;
    qp['stage'] = stage ?? null;
    qp['techStack'] = techCsv || null;
    qp['search'] = (search && String(search).trim()) || null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearSearch(): void {
    // Clear the UI signal
    this.searchText.set('');

    // Clear only the 'search' key in filters
    this.filters.update((f) => ({ ...f, search: undefined }));

    // Remove only the 'search' param from URL (leave other filters intact)
    this.navigate({ search: undefined });
  }

  openAgent(id: string, evt?: Event): void {
    if (evt) evt.preventDefault(); // if using <a href>

    // Navigate to the child detail route: /agents/:id
    this.router.navigate([id], {
      relativeTo: this.route, // stay under /agents
      queryParamsHandling: 'preserve', // keep current filters/paging in URL history
    });
  }

  /** Scroll the primary agents scroll container to top (safe fallback) */
  private scrollMainToTop(): void {
    const el = document.getElementById('agents-scroll');
    if (!el) return;
    try {
      // prefer smooth behaviour only when user initiated navigation from list UI
      el.scrollTo({ top: 0 });
    } catch {
      // fallback if scrollTo with options is not supported
      el.scrollTop = 0;
    }
  }
}
