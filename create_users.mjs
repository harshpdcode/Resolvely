import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tbhfgmxfeqtdnnyywfkt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vs5XKVKkoPFlVh2ksm30DQ_3EMxysbW";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createTestUsers() {
  const users = [
    { email: "user1@example.com", password: "TestPassword123!", fullName: "Alice Smith" },
    { email: "user2@example.com", password: "TestPassword123!", fullName: "Bob Johnson" }
  ];

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { full_name: user.fullName }
      }
    });

    if (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    } else {
      console.log(`Successfully registered ${user.email}. User ID: ${data.user?.id}`);
    }
  }
}

createTestUsers();
