import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Keep the initial Cloudflare setup simple for testing.
// R2/D1/KV cache layers can be enabled later once the Worker is live.
export default defineCloudflareConfig({});
