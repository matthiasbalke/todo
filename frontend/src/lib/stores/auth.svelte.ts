import { mockUsers } from '$lib/mock-data';
import type { User } from '$lib/mock-data';

let currentUser = $state<User>(mockUsers[0]);

export function getCurrentUser() {
  return currentUser;
}
