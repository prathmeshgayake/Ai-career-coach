import axios from 'axios';
import { RepoFile, RepoMetadata } from '../models/types';
import { config } from '../config';
import { parseGithubUrl } from '../models/schemas';
import { pipelineCache } from './cache';

const GITHUB_API_BASE = 'https://api.github.com';

const MAX_FILES = 50;
const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100KB per file
const MAX_TOTAL_SIZE_BYTES = 500 * 1024; // 500KB total

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.mov', '.avi',
  '.lock', '.lockb',
]);

const IGNORED_PATHS = [
  'node_modules/',
  'dist/',
  'build/',
  '.git/',
  '.next/',
  '.nuxt/',
  'vendor/',
  'coverage/',
  '.venv/',
  '__pycache__/',
];

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'AICareerCoach/1.0',
  };
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }
  return headers;
}

function handleGithubError(err: any, context: string): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const remaining = err.response?.headers['x-ratelimit-remaining'];

    const rawMsg = String(err.response?.data?.message || err.message || '').toLowerCase();
    if ((status === 403 || status === 429) && (remaining === '0' || remaining === 0 || rawMsg.includes('rate limit'))) {
      const resetTime = err.response?.headers?.['x-ratelimit-reset'];
      const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : 'within the hour';
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}. Add a GITHUB_TOKEN to server/.env for 5000 req/hr.`);
    }

    if (status === 404) {
      throw new Error(`GitHub repository or resource not found: ${context}. Make sure the repository is public and spelled correctly.`);
    }

    if (status === 401) {
      throw new Error(`Invalid GitHub API credentials: ${context}`);
    }

    const message = err.response?.data?.message || err.message;
    throw new Error(`GitHub API error (${status}) during ${context}: ${message}`);
  }

  throw new Error(`GitHub operation failed during ${context}: ${err.message}`);
}

export class GithubService {
  /**
   * Validates a GitHub repository URL and extracts owner and repo.
   */
  static parseRepoUrl(url: string): { owner: string; repo: string } {
    const parsed = parseGithubUrl(url);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: "${url}". Format must be https://github.com/owner/repo`);
    }
    return parsed;
  }

  /**
   * Fetches metadata for a repository.
   */
  static async getRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: getHeaders(),
        timeout: 10000,
      });

      return {
        owner: response.data.owner?.login || owner,
        repo: response.data.name || repo,
        defaultBranch: response.data.default_branch || 'main',
        description: response.data.description || undefined,
        isPrivate: response.data.private || false,
        stars: response.data.stargazers_count ?? 0,
        language: response.data.language || 'Codebase',
        lastPush: response.data.pushed_at || response.data.updated_at || undefined,
      };
    } catch (err) {
      handleGithubError(err, `fetching repository metadata for ${owner}/${repo}`);
    }
  }

  /**
   * Fetches the latest commit SHA for a repository branch.
   */
  static async getLatestCommitSha(owner: string, repo: string, branch?: string): Promise<string> {
    try {
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`;
      const response = await axios.get(url, {
        headers: getHeaders(),
        params: branch ? { sha: branch, per_page: 1 } : { per_page: 1 },
        timeout: 10000,
      });

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(`No commits found in ${owner}/${repo}`);
      }

      return response.data[0].sha;
    } catch (err) {
      handleGithubError(err, `fetching latest commit SHA for ${owner}/${repo}`);
    }
  }

  /**
   * Compares two commits and returns the list of changed file paths.
   */
  static async compareCommits(
    owner: string,
    repo: string,
    baseSha: string,
    headSha: string
  ): Promise<string[]> {
    if (baseSha === headSha) {
      return [];
    }
    try {
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`;
      const response = await axios.get(url, {
        headers: getHeaders(),
        timeout: 10000,
      });

      const files = response.data.files;
      if (!Array.isArray(files)) {
        return [];
      }

      return files.map((f: any) => f.filename);
    } catch (err) {
      handleGithubError(err, `comparing commits ${baseSha}...${headSha} for ${owner}/${repo}`);
    }
  }

  /**
   * Fetches file tree and contents from GitHub repository bounded by limits.
   * Max 50 files, 100KB per file, 500KB total.
   */
  static async getRepoFiles(
    owner: string,
    repo: string,
    commitSha: string
  ): Promise<RepoFile[]> {
    const cached = pipelineCache.getRepoFiles(owner, repo, commitSha);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      // 1. Get recursive tree
      const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`;
      const treeResponse = await axios.get(treeUrl, {
        headers: getHeaders(),
        timeout: 15000,
      });

      const tree = treeResponse.data.tree;
      if (!Array.isArray(tree)) {
        return [];
      }

      // 2. Filter file entries (blobs only, ignore directories, binary extensions, ignored directories)
      const eligibleEntries = tree.filter((item: any) => {
        if (item.type !== 'blob') return false;
        const filePath = item.path as string;

        // Skip ignored paths
        if (IGNORED_PATHS.some(prefix => filePath.startsWith(prefix) || filePath.includes(`/${prefix}`))) {
          return false;
        }

        // Skip ignored extensions
        const extMatch = filePath.match(/\.[0-9a-z]+$/i);
        if (extMatch && IGNORED_EXTENSIONS.has(extMatch[0].toLowerCase())) {
          return false;
        }

        // Skip lockfiles
        if (filePath.endsWith('package-lock.json') || filePath.endsWith('yarn.lock') || filePath.endsWith('pnpm-lock.yaml')) {
          return false;
        }

        // Skip large files from tree listing if size is available
        if (typeof item.size === 'number' && item.size > MAX_FILE_SIZE_BYTES) {
          return false;
        }

        return true;
      });

      // Sort by priority (source code files first, e.g. ts, js, py, java, go, rs, c, cpp, md, json)
      eligibleEntries.sort((a: any, b: any) => {
        const priorityExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.html', '.css', '.json', '.md'];
        const extA = (a.path.match(/\.[0-9a-z]+$/i) || [''])[0].toLowerCase();
        const extB = (b.path.match(/\.[0-9a-z]+$/i) || [''])[0].toLowerCase();
        const prioA = priorityExts.indexOf(extA);
        const prioB = priorityExts.indexOf(extB);
        if (prioA !== -1 && prioB !== -1) return prioA - prioB;
        if (prioA !== -1) return -1;
        if (prioB !== -1) return 1;
        return a.path.localeCompare(b.path);
      });

      const selectedEntries = eligibleEntries.slice(0, MAX_FILES);
      const repoFiles: RepoFile[] = [];
      let totalBytesAccumulated = 0;

      // 3. Fetch file contents with bounded concurrency (batches of 5)
      const CONCURRENCY = 5;
      for (let i = 0; i < selectedEntries.length; i += CONCURRENCY) {
        if (totalBytesAccumulated >= MAX_TOTAL_SIZE_BYTES) {
          break;
        }

        const batch = selectedEntries.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map(async (entry: any) => {
            const contentUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(entry.path).replace(/%2F/g, '/')}`;
            const contentRes = await axios.get(contentUrl, {
              headers: getHeaders(),
              params: { ref: commitSha },
              timeout: 10000,
            });

            if (contentRes.data.encoding === 'base64' && contentRes.data.content) {
              const buffer = Buffer.from(contentRes.data.content, 'base64');
              if (buffer.length <= MAX_FILE_SIZE_BYTES) {
                return {
                  path: entry.path as string,
                  content: buffer.toString('utf-8'),
                  size: buffer.length,
                };
              }
            }
            return null;
          })
        );

        for (const res of batchResults) {
          if (res.status === 'fulfilled' && res.value) {
            if (totalBytesAccumulated + res.value.size <= MAX_TOTAL_SIZE_BYTES) {
              totalBytesAccumulated += res.value.size;
              repoFiles.push(res.value);
            }
          }
        }
      }

      pipelineCache.setRepoFiles(owner, repo, commitSha, repoFiles);
      return repoFiles;
    } catch (err) {
      handleGithubError(err, `fetching repository files for ${owner}/${repo} at commit ${commitSha}`);
    }
  }
}
