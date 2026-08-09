import { CrawlJob } from '../types';

class CrawlStore {
  private jobs: Map<string, CrawlJob> = new Map();

  create(job: CrawlJob): void {
    this.jobs.set(job.id, job);
  }

  get(id: string): CrawlJob | undefined {
    return this.jobs.get(id);
  }

  update(id: string, updates: Partial<CrawlJob>): void {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, { ...job, ...updates, updatedAt: Date.now() });
    }
  }

  delete(id: string): void {
    this.jobs.delete(id);
  }
}

export const crawlStore = new CrawlStore();
