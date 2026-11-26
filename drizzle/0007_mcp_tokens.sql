CREATE TABLE "mcp_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "token_hash" text NOT NULL,
  "token_prefix" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "last_used_at" timestamp,
  CONSTRAINT "mcp_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "mcp_tokens" ADD CONSTRAINT "mcp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
