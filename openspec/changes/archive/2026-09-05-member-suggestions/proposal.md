## Why

List owners currently have to remember and type every invitee email manually, even when they have already shared other lists with that person. The membership dialog also hides useful backend error details behind a generic permission message and presents roles as enum constants, making the sharing flow feel rough.

## What Changes

- Add list member suggestions based on people who already share at least one list with the current user.
- Exclude users who are already members of the list being edited.
- Do not surface contacts that are only known through other members' lists and have no shared list with the current user.
- Allow owners, but not editors, viewers, or non-members, to retrieve member suggestions.
- Let owners type and submit an email address that is not present in the suggestions.
- Protect arbitrary invite-by-email attempts with rate limiting and non-enumerating error messaging.
- Add future audit-log coverage for member suggestion lookups and failed invite attempts.
- Display membership roles as regular text with only the first letter capitalized.

## Capabilities

### New Capabilities

- `list-member-management`: Defines list member lookup, invitation suggestions, typed invite emails, invitation errors, and user-facing role labels.

### Modified Capabilities

- `audit-log`: Adds planned audit coverage for member suggestion lookups, unknown invite attempts, and invite rate-limit denials.

## Impact

- Backend list membership API/service/repository code will need a member-suggestion read path derived from existing list memberships.
- Backend invite attempts will need rate limiting through the existing rate-limit configuration to reduce account-enumeration risk.
- Frontend list API types and the membership dialog will need a suggestion-aware email entry control while preserving arbitrary email input.
- Backend integration tests and frontend component/API tests should cover suggestion scoping, exclusion of current-list members, non-enumerating invite failures, rate-limit behavior, and role label formatting.
