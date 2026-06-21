// GitHub App authentication and helper functions
// Phase 4: implement app auth, token generation, generate-repo helper

const GITHUB_API = "https://api.github.com";

export async function getAppInstallationToken(installationId: string): Promise<string> {
  throw new Error("Not implemented — Phase 4");
}

export async function createRepoFromTemplate(
  templateOwner: string,
  templateRepo: string,
  newRepoName: string,
  token: string
): Promise<{ fullName: string; cloneUrl: string }> {
  const res = await fetch(
    `${GITHUB_API}/repos/${templateOwner}/${templateRepo}/generate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name: newRepoName,
        private: false,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create repo from template: ${res.status} ${error}`);
  }

  const data = await res.json();
  return {
    fullName: data.full_name,
    cloneUrl: data.clone_url,
  };
}

export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid repo format. Expected: owner/repo");
  }
  return { owner: parts[0], repo: parts[1] };
}
