import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260826214557 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" add column if not exists "hero_height" integer not null default 720;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" drop column if exists "hero_height";`);
  }

}
