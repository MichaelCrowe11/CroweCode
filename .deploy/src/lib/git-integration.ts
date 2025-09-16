/**
 * Git Integration Service for CroweCode Spaces
 * Provides seamless GitHub integration through CroweHub
 */

import { Octokit } from "@octokit/rest";

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
  } | null;
  topics: string[];
  updated_at: string;
  pushed_at: string;
  created_at: string;
  clone_url: string;
  ssh_url: string;
  html_url: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

class GitIntegrationService {
  private octokit: Octokit | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = process.env.GITHUB_ACCESS_TOKEN || null;
    if (this.accessToken) {
      this.octokit = new Octokit({
        auth: this.accessToken,
      });
    }
  }

  /**
   * Initialize GitHub connection with access token
   */
  async connect(accessToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.octokit = new Octokit({
      auth: accessToken,
    });

    // Verify connection
    try {
      await this.octokit.rest.users.getAuthenticated();
    } catch (error) {
      throw new Error("Invalid GitHub access token");
    }
  }

  /**
   * Get authenticated user information
   */
  async getCurrentUser(): Promise<GitHubUser> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.users.getAuthenticated();
    return data as GitHubUser;
  }

  /**
   * Get user repositories
   */
  async getRepositories(
    options: {
      visibility?: "all" | "public" | "private";
      affiliation?: "owner" | "collaborator" | "organization_member";
      sort?: "created" | "updated" | "pushed" | "full_name";
      direction?: "asc" | "desc";
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      visibility: options.visibility || "all",
      affiliation: options.affiliation || "owner,collaborator",
      sort: options.sort || "updated",
      direction: options.direction || "desc",
      per_page: options.per_page || 30,
      page: options.page || 1,
    });

    return data as GitHubRepository[];
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    return data as GitHubRepository;
  }

  /**
   * Get repository branches
   */
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.listBranches({
      owner,
      repo,
    });

    return data as GitHubBranch[];
  }

  /**
   * Get repository commits
   */
  async getCommits(
    owner: string,
    repo: string,
    options: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubCommit[]> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: options.sha,
      path: options.path,
      author: options.author,
      since: options.since,
      until: options.until,
      per_page: options.per_page || 30,
      page: options.page || 1,
    });

    return data as GitHubCommit[];
  }

  /**
   * Get repository pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: "open" | "closed" | "all";
      head?: string;
      base?: string;
      sort?: "created" | "updated" | "popularity";
      direction?: "asc" | "desc";
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubPullRequest[]> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: options.state || "open",
      head: options.head,
      base: options.base,
      sort: options.sort || "created",
      direction: options.direction || "desc",
      per_page: options.per_page || 30,
      page: options.page || 1,
    });

    return data as GitHubPullRequest[];
  }

  /**
   * Create a new repository
   */
  async createRepository(options: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  }): Promise<GitHubRepository> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
      name: options.name,
      description: options.description,
      private: options.private || false,
      auto_init: options.auto_init || true,
      gitignore_template: options.gitignore_template,
      license_template: options.license_template,
    });

    return data as GitHubRepository;
  }

  /**
   * Fork a repository
   */
  async forkRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.createFork({
      owner,
      repo,
    });

    return data as GitHubRepository;
  }

  /**
   * Star a repository
   */
  async starRepository(owner: string, repo: string): Promise<void> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    await this.octokit.rest.activity.starRepoForAuthenticatedUser({
      owner,
      repo,
    });
  }

  /**
   * Unstar a repository
   */
  async unstarRepository(owner: string, repo: string): Promise<void> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    await this.octokit.rest.activity.unstarRepoForAuthenticatedUser({
      owner,
      repo,
    });
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    options: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
    }
  ): Promise<GitHubPullRequest> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
      draft: options.draft || false,
    });

    return data as GitHubPullRequest;
  }

  /**
   * Create a new branch
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string
  ): Promise<void> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    await this.octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    });
  }

  /**
   * Get repository file content
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<{ content: string; sha: string; encoding: string }> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error("Path does not point to a file");
    }

    return {
      content: data.content,
      sha: data.sha,
      encoding: data.encoding as string,
    };
  }

  /**
   * Update file content
   */
  async updateFile(
    owner: string,
    repo: string,
    path: string,
    options: {
      message: string;
      content: string;
      sha: string;
      branch?: string;
      committer?: {
        name: string;
        email: string;
      };
    }
  ): Promise<{ commit: GitHubCommit; content: any }> {
    if (!this.octokit) {
      throw new Error("GitHub not connected");
    }

    const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: options.message,
      content: Buffer.from(options.content, "utf-8").toString("base64"),
      sha: options.sha,
      branch: options.branch,
      committer: options.committer,
    });

    return {
      ...data,
      commit: data.commit || {}
    };
  }

  /**
   * Check if GitHub is connected
   */
  isConnected(): boolean {
    return this.octokit !== null;
  }

  /**
   * Disconnect from GitHub
   */
  disconnect(): void {
    this.octokit = null;
    this.accessToken = null;
  }
}

// Export singleton instance
export const gitIntegration = new GitIntegrationService();
export default gitIntegration;