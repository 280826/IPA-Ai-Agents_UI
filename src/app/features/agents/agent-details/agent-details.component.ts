// components/agents/agent-detail.component.ts
import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AgentsService } from '../../../services/agents.service';
import { Agent } from '../../../models/agent.ui';
import { mapUsecaseItemToAgent } from '../../../models/mapper';

type StageApi = 'Prod' | 'Solution' | 'POC' | string;
type StageUi = 'Production' | 'Solution' | 'POC' | '' | string;

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

@Component({
  standalone: true,
  selector: 'app-agent-details',
  imports: [CommonModule],
  templateUrl: './agent-details.component.html',
  styleUrls: ['./agent-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(AgentsService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly agent = signal<Agent | null>(null);

  // Simple preview modal for video resources
  readonly previewOpen = signal<boolean>(false);
  readonly previewUrl = signal<string>('');

  readonly stageUi = computed<StageUi>(() => toUiStage(this.agent()?.stage));
  // readonly techList = computed<string[]>(() =>
  //   (this.agent()?.technology ?? '')
  //     .split('·')
  //     .map((s) => s.trim())
  //     .filter(Boolean)

  //   );
  readonly techList = computed<string[]>(() => {
    const raw = this.agent()?.technology ?? '';
    return raw
      .split(/[·,|]/) // split by middot, comma, or pipe
      .map((s) => s.trim())
      .filter(Boolean);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid agent id.');
      this.loading.set(false);
      return;
    }

    // Fetch one with the same list endpoint (limit=1)
    this.loading.set(true);

    this.svc.getOne(id).subscribe({
      next: (res) => {
        // const item = res?.data?.items?.[0];
        const item = res?.data;
        if (!item) {
          this.error.set('Agent not found.');
        } else {
          this.agent.set(mapUsecaseItemToAgent(item));
          this.error.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load agent details.');
        this.loading.set(false);
      },
    });

    // this.svc.listPaged(1, 1, { /* filters empty */ })
    //   .subscribe({
    //     next: (res) => {
    //       // Prefer a dedicated getOne(id) if your backend supports it.
    //       // As a fallback, try listByCursor(id,0,1) or filter from a larger page.
    //       const item = res?.data?.items?.find(x => x._id === id);
    //       if (!item) {
    //         // Fallback: try cursor with id
    //         this.svc.listByCursor(id, 1, 1, {}).subscribe({
    //           next: (r2) => {
    //             const i2 = r2?.data?.items?.[0];
    //             if (!i2) {
    //               this.error.set('Agent not found.');
    //             } else {
    //               this.agent.set(mapUsecaseItemToAgent(i2));
    //               this.error.set(null);
    //             }
    //             this.loading.set(false);
    //           },
    //           error: () => {
    //             this.error.set('Could not load agent details.');
    //             this.loading.set(false);
    //           }
    //         });
    //       } else {
    //         this.agent.set(mapUsecaseItemToAgent(item));
    //         this.error.set(null);
    //         this.loading.set(false);
    //       }
    //     },
    //     error: () => {
    //       this.error.set('Could not load agent details.');
    //       this.loading.set(false);
    //     }
    //   });
  }

  back(): void {
    // Navigate back to the store grid, preserving query params
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  openResource(url: string): void {
    if (this.isVideo(url)) {
      this.previewUrl.set(url);
      this.previewOpen.set(true);
      return;
    }
    // pdf/pptx: open new tab
    window.open(url, '_blank', 'noopener');
  }

  closePreview(): void {
    this.previewOpen.set(false);
    this.previewUrl.set('');
  }

  private isVideo(url: string): boolean {
    return /\.mp4(\?|$)/i.test(url) || /\.webm(\?|$)/i.test(url);
  }
}
