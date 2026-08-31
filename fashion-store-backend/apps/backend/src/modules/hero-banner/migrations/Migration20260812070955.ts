import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260812070955 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "hero_banner" ("id" text not null, "media_url" text not null, "media_type" text not null default 'image', "eyebrow" text null, "title" text null, "subtitle" text null, "eyebrow_color" text not null default '#FFFFFF', "eyebrow_size" integer not null default 14, "eyebrow_weight" integer not null default 600, "eyebrow_letter_spacing" integer not null default 2, "title_color" text not null default '#FFFFFF', "title_size" integer not null default 64, "title_mobile_size" integer not null default 38, "title_weight" integer not null default 700, "title_letter_spacing" integer not null default 0, "title_line_height" integer not null default 1, "subtitle_color" text not null default '#FFFFFF', "subtitle_size" integer not null default 18, "subtitle_mobile_size" integer not null default 15, "subtitle_weight" integer not null default 400, "subtitle_letter_spacing" integer not null default 0, "text_align" text not null default 'center', "vertical_position" text not null default 'center', "horizontal_position" text not null default 'center', "content_offset_x" integer not null default 0, "content_offset_y" integer not null default 0, "button_text" text null, "button_url" text null, "button_bg_color" text not null default '#765633', "button_text_color" text not null default '#FFFFFF', "button_size" integer not null default 13, "secondary_button_text" text null, "secondary_button_url" text null, "secondary_button_bg_color" text not null default 'transparent', "secondary_button_text_color" text not null default '#FFFFFF', "object_position" text not null default 'center', "overlay_color" text not null default '#000000', "overlay_opacity" integer not null default 10, "position" integer not null default 0, "is_active" boolean not null default true, "autoplay_duration" integer not null default 6000, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_hero_banner_deleted_at" ON "hero_banner" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "hero_banner" cascade;`);
  }

}
