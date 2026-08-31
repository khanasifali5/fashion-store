import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260829065248 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" add column if not exists "mobile_media_url" text null, add column if not exists "mobile_media_type" text not null default 'image', add column if not exists "mobile_height" integer not null default 540;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" drop column if exists "mobile_media_url", drop column if exists "mobile_media_type", drop column if exists "mobile_height";`);
  }

}
