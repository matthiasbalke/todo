# Setup GitHub App for Release Version Bumps

This guide describes how to create a GitHub App that can push release version bump commits from GitHub Actions, including pushes to protected branches where required checks have not passed.

GitHub App installation tokens are short-lived. Do not paste an installation token into a repository secret as a long-lived value. Store the app identity and private key, then generate an installation token during the workflow run.

## 1. Create the GitHub App

1. Open GitHub.
2. For a personal account app, go to `Settings` -> `Developer settings` -> `GitHub Apps`.
3. For an organization-owned app, go to `Your organizations` -> `<org>` -> `Settings` -> `Developer settings` -> `GitHub Apps`.
4. Click `New GitHub App`.
5. Set:
   - `GitHub App name`: `todo-release-bot` or a similar service name
   - `Homepage URL`: this repository URL
   - `Webhook`: disabled, unless another automation needs webhooks
6. Under `Repository permissions`, set:
   - `Contents`: `Read and write`
7. Leave all other permissions as `No access`, unless GitHub requires metadata read access.
8. Create the app.

## 2. Generate a Private Key

1. Open the GitHub App settings page.
2. In `Private keys`, click `Generate a private key`.
3. Download the `.pem` file.
4. Store the file contents securely. The repository workflow will use this value as a GitHub Actions secret.

## 3. Install the App on the Repository

1. Open the GitHub App settings page.
2. Click `Install App`.
3. Install it on the owner that contains this repository.
4. Choose `Only select repositories`.
5. Select this todo repository.
6. Click `Install`.

## 4. Allow Branch or Ruleset Bypass

The app needs more than `Contents: Read and write` if the target branch has required checks. The branch protection rule or repository ruleset must allow this app to bypass the relevant rule.

For repository rulesets:

1. Open the repository settings.
2. Go to `Rules` -> `Rulesets`.
3. Open the ruleset that applies to the release branch, usually `main`.
4. In the bypass list, add the GitHub App.
5. Choose the bypass mode that allows direct pushes for this automation.
6. Save the ruleset.

For branch protection rules:

1. Open the repository settings.
2. Go to `Branches`.
3. Edit the protection rule for the release branch.
4. Configure bypass permissions so the GitHub App can push despite required checks.
5. Save the rule.

## 5. Configure Repository Secrets and Variables

Add these repository settings:

| Type | Name | Value |
|---|---|---|
| Repository variable | `MATTHIASBALKE_TODO_BOT_APP_ID` | The GitHub App ID from the app settings page |
| Repository secret | `MATTHIASBALKE_TODO_BOT_APP_PRIVATE_KEY` | The full contents of the generated `.pem` private key |

Use a repository variable for the app ID because it is not sensitive. Use a repository secret for the private key.

## 6. Generate the Token in the Workflow

Use `actions/create-github-app-token` to generate a short-lived installation token, then pass that token to `actions/checkout`.

```yaml
- uses: actions/create-github-app-token@v3
  id: app-token
  with:
    client-id: ${{ vars.MATTHIASBALKE_TODO_BOT_APP_ID }}
    private-key: ${{ secrets.MATTHIASBALKE_TODO_BOT_APP_PRIVATE_KEY }}
    permission-contents: write

- uses: actions/checkout@v7
  with:
    token: ${{ steps.app-token.outputs.token }}
```

The checkout token becomes the credential used by later authenticated `git` commands, including `git push`.

## 7. Current Workflow Note

`.github/workflows/bump-version.yml` generates a short-lived GitHub App token during the run. It does not use a static `RELEASE_VERSION_BUMP_TOKEN` secret.

## Troubleshooting

- If checkout fails, verify the app is installed on this repository and has `Contents: Read and write`.
- If push fails with branch protection or ruleset errors, verify the app is in the bypass list for the rule that applies to the target branch.
- If token generation fails, verify `MATTHIASBALKE_TODO_BOT_APP_ID` and `MATTHIASBALKE_TODO_BOT_APP_PRIVATE_KEY` are configured and that the private key includes the full `BEGIN` and `END` lines.
- If the workflow can push to feature branches but not `main`, the problem is usually branch protection or ruleset bypass configuration, not the app permission itself.
