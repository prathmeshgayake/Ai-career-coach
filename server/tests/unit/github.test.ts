import axios from 'axios';
import { GithubService } from '../../src/services/github';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseRepoUrl', () => {
    it('should correctly parse standard GitHub repository URLs', () => {
      expect(GithubService.parseRepoUrl('https://github.com/facebook/react')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(GithubService.parseRepoUrl('https://github.com/facebook/react.git')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(GithubService.parseRepoUrl('https://github.com/vercel/next.js/')).toEqual({
        owner: 'vercel',
        repo: 'next.js',
      });
    });

    it('should throw for invalid or non-GitHub URLs', () => {
      expect(() => GithubService.parseRepoUrl('https://gitlab.com/owner/repo')).toThrow(
        /Invalid GitHub repository URL/
      );
      expect(() => GithubService.parseRepoUrl('not-a-valid-url')).toThrow(
        /Invalid GitHub repository URL/
      );
    });
  });

  describe('getRepoMetadata', () => {
    it('should fetch and format repo metadata', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          owner: { login: 'octocat' },
          name: 'Hello-World',
          default_branch: 'master',
          description: 'My first repo',
          private: false,
          stargazers_count: 42,
          language: 'TypeScript',
          pushed_at: '2026-10-16T12:00:00Z',
        },
      });

      const meta = await GithubService.getRepoMetadata('octocat', 'Hello-World');
      expect(meta).toEqual({
        owner: 'octocat',
        repo: 'Hello-World',
        defaultBranch: 'master',
        description: 'My first repo',
        isPrivate: false,
        stars: 42,
        language: 'TypeScript',
        lastPush: '2026-10-16T12:00:00Z',
      });
    });
  });

  describe('getLatestCommitSha', () => {
    it('should return latest commit SHA', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ sha: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391' }],
      });

      const sha = await GithubService.getLatestCommitSha('octocat', 'Hello-World');
      expect(sha).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
    });

    it('should throw if no commits returned', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await expect(
        GithubService.getLatestCommitSha('octocat', 'Empty-Repo')
      ).rejects.toThrow('No commits found');
    });
  });

  describe('compareCommits', () => {
    it('should return empty list if SHAs are identical', async () => {
      const files = await GithubService.compareCommits('octocat', 'repo', 'sha1', 'sha1');
      expect(files).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch changed files between two commits', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          files: [{ filename: 'src/index.ts' }, { filename: 'package.json' }],
        },
      });

      const files = await GithubService.compareCommits('octocat', 'repo', 'sha1', 'sha2');
      expect(files).toEqual(['src/index.ts', 'package.json']);
    });
  });

  describe('getRepoFiles', () => {
    it('should filter out ignored paths and extensions and fetch eligible files', async () => {
      mockedAxios.get
        // Tree request
        .mockResolvedValueOnce({
          data: {
            tree: [
              { path: 'src/app.ts', type: 'blob', size: 100 },
              { path: 'node_modules/express/index.js', type: 'blob', size: 50 },
              { path: 'logo.png', type: 'blob', size: 200 },
              { path: 'src', type: 'tree' },
            ],
          },
        })
        // File content request for src/app.ts
        .mockResolvedValueOnce({
          data: {
            encoding: 'base64',
            content: Buffer.from('console.log("hello");').toString('base64'),
          },
        });

      const files = await GithubService.getRepoFiles('octocat', 'repo', 'sha1');
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('src/app.ts');
      expect(files[0].content).toBe('console.log("hello");');
    });
  });
});
