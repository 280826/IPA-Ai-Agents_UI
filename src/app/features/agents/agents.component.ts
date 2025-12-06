
import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AgentsService, UsecaseFilters } from '../../services/agents.service';
import { Agent } from '../../models/agent.ui';
import { UsecaseListItemDTO } from '../../models/usecase-list.dto';
import { mapUsecaseItemToAgent } from '../../models/mapper';

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
  private readonly route  = inject(ActivatedRoute);
  private readonly svc    = inject(AgentsService);

  // UI state
  readonly loading = signal<boolean>(true);
  readonly error   = signal<string | null>(null);
  readonly agents  = signal<Agent[]>([]);
  readonly hasData = computed(() => this.agents().length > 0);

  // Filters
  readonly searchText       = signal<string>('');
  readonly selectedIndustry = signal<string>('');   // was 'Banking and Financial'
  readonly selectedTechnology = signal<string>(''); // was 'Azure'
  readonly selectedStage    = signal<string>('');   // 'Production'|'Solution' (UI)

  // Query filters for API (vertical/stage/techStack)
  readonly filters = signal<UsecaseFilters>({});

  // Pagination (offset mode by default)
  readonly useCursor = signal<boolean>(false);
  readonly pageIndex = signal<number>(0); // zero-based
  readonly pageSize  = signal<number>(10);
  readonly total     = signal<number>(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  // Cursor hints
  readonly cursorId  = signal<string | undefined>(undefined);
  readonly cursorSkip = signal<number>(1);

  // Build page pills like: [1, '…', 2, 3, '…', total]
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

  ngOnInit(): void {
    // initialize from query params (deep-linking)
    this.route.queryParamMap.subscribe(params => {
      const page   = +(params.get('page') ?? 1);
      const limit  = +(params.get('limit') ?? 10);
      const id     = params.get('id') ?? undefined;
      const skip   = +(params.get('skip') ?? 1);

      const vertical  = params.get('vertical') ?? undefined;
      const stage     = params.get('stage') ?? undefined;     // server stage: 'Solution'|'Prod'
      const techStack = params.get('techStack') ?? undefined;

      this.pageIndex.set(Math.max(page - 1, 0));
      this.pageSize.set(limit);
      this.cursorId.set(id);
      this.cursorSkip.set(isNaN(skip) ? 1 : skip);

      // Set filters for API
      this.filters.set({
        vertical,
        stage,
        techStack: techStack ? techStack.split(',') : undefined
      });

      // UI selected values (optional: reflect what came from URL)
      this.selectedIndustry.set(vertical ?? '');
      this.selectedStage.set(stage === 'Prod' ? 'Production' : (stage ?? ''));
      this.selectedTechnology.set(techStack ?? '');

      // Enable cursor mode if id is present
      this.useCursor.set(!!id);

      this.fetch();
    });
  }

  private fetch(): void {
    this.loading.set(true);
    const f = this.filters();

    if (this.useCursor()) {
      this.svc.listByCursor(this.cursorId(), this.cursorSkip(), this.pageSize(), f).subscribe({
        next: (res) => {
          const data = res?.data;
          const items: UsecaseListItemDTO[] = data?.items ?? [];
          this.agents.set(items.map(mapUsecaseItemToAgent));
          this.total.set(data?.total ?? (this.total() || items.length));
          // cursor id set from last item's _id or server-provided id
          const last = items[items.length - 1];
          const nextId = last?._id ?? data?.id;
          if (nextId) this.cursorId.set(nextId);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Cursor fetch failed', err);
          this.error.set('Could not load agents. Please try again.');
          this.loading.set(false);
        }
      });
    } else {
      const page = this.pageIndex() + 1;
      this.svc.listPaged(page, this.pageSize(), f).subscribe({
        next: (res) => {
          const data = res?.data;
          const items: UsecaseListItemDTO[] = data?.items ?? [];
          this.agents.set(items.map(mapUsecaseItemToAgent));
          this.total.set(data?.total ?? items.length);
          this.pageIndex.set((data?.page ?? page) - 1);
          this.pageSize.set(data?.limit ?? this.pageSize());
          this.error.set(null);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Paged fetch failed', err);
          this.error.set('Could not load agents. Please try again.');
          this.loading.set(false);
        }
      });
    }
  }

  // ----- Pagination actions (offset mode) -----
  gotoPage(p: number | string) {
    if (typeof p !== 'number') return;
    this.navigate({ page: p });
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
    if (this.useCursor()) {
      this.navigate({ page: 1, limit: +size, id: undefined, skip: 1 });
    } else {
      this.navigate({ page: 1, limit: +size });
    }
  }

  // ----- Cursor actions -----
  prevCursor() {
    this.navigate({ id: this.cursorId(), skip: -1, limit: this.pageSize() });
  }
  nextCursor() {
    this.navigate({ id: this.cursorId(), skip: 1, limit: this.pageSize() });
  }

  // ----- Filters (UI handlers) -----
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    // Optional: wire to server if search supported (add ?q=)
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
    const value = (event.target as HTMLSelectElement).value; // 'Production'|'Solution'|''
    this.selectedStage.set(value);
    this.applyFilters();
  }

  applyFilters() {
    // Convert UI selections to server filters
    const vertical = this.selectedIndustry() || undefined;
    const stageUi  = this.selectedStage() || undefined;    // UI stage
    const stageApi = stageUi === 'Production' ? 'Prod' : stageUi; // server expects 'Prod'|'Solution'
    const techCsv  = this.selectedTechnology() || undefined;

    // Reset to first page on filter change
    if (this.useCursor()) {
      this.navigate({ page: 1, id: undefined, skip: 1, vertical, stage: stageApi, techStack: techCsv?.split(',') });
    } else {
      this.navigate({ page: 1, vertical, stage: stageApi, techStack: techCsv?.split(',') });
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
    id?: string | undefined;
    skip?: number;
    vertical?: string;
    stage?: string;
    techStack?: string[] | string;
  }) {
    const qp: Record<string, any> = {
      page: opts.page ?? (this.pageIndex() + 1),
      limit: opts.limit ?? this.pageSize(),
    };
    // cursor hints
    if (this.useCursor() || opts.id !== undefined)  qp['id']   = opts.id ?? this.cursorId();
    if (this.useCursor() || opts.skip !== undefined) qp['skip'] = opts.skip ?? this.cursorSkip();

    // filters
    const vertical = opts.vertical ?? this.filters().vertical;
    const stage    = opts.stage ?? this.filters().stage;
    const tech     = opts.techStack ?? this.filters().techStack;
    const techCsv  = Array.isArray(tech) ? tech.join(',') : (tech ?? '');

    if (vertical) qp['vertical'] = vertical;
    if (stage)    qp['stage']    = stage;
    if (techCsv)  qp['techStack'] = techCsv;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge'
    });
  }
}
