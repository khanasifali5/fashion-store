import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260811152449 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "mega_menu_promo" ("id" text not null, "menu_key" text not null, "title" text null, "subtitle" text null, "image_url" text not null, "button_text" text null, "button_url" text null, "position" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "mega_menu_promo_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_mega_menu_promo_deleted_at" ON "mega_menu_promo" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "mega_menu_promo" cascade;`);
  }

}
