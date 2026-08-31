import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260813050427 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "homepage_section" ("id" text not null, "type" text not null, "title" text null, "position" integer not null default 0, "is_active" boolean not null default true, "config" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "homepage_section_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_homepage_section_deleted_at" ON "homepage_section" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "homepage_section" cascade;`);
  }

}
