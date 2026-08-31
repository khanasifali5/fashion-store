import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260812143405 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "mega_menu_promo" add column if not exists "image_focus_x" integer not null default 50, add column if not exists "image_focus_y" integer not null default 50, add column if not exists "title_offset_x" integer not null default 0, add column if not exists "title_offset_y" integer not null default 0, add column if not exists "subtitle_offset_x" integer not null default 0, add column if not exists "subtitle_offset_y" integer not null default 0, add column if not exists "button_offset_x" integer not null default 0, add column if not exists "button_offset_y" integer not null default 0;`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "text_align" type text using ("text_align"::text);`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "text_align" set default 'center';`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "horizontal_position" type text using ("horizontal_position"::text);`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "horizontal_position" set default 'center';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "mega_menu_promo" drop column if exists "image_focus_x", drop column if exists "image_focus_y", drop column if exists "title_offset_x", drop column if exists "title_offset_y", drop column if exists "subtitle_offset_x", drop column if exists "subtitle_offset_y", drop column if exists "button_offset_x", drop column if exists "button_offset_y";`);

    this.addSql(`alter table if exists "mega_menu_promo" alter column "text_align" type text using ("text_align"::text);`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "text_align" set default 'left';`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "horizontal_position" type text using ("horizontal_position"::text);`);
    this.addSql(`alter table if exists "mega_menu_promo" alter column "horizontal_position" set default 'left';`);
  }

}
