import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260812092449 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" add column if not exists "eyebrow_font_family" text not null default 'Inter', add column if not exists "eyebrow_font_style" text not null default 'normal', add column if not exists "eyebrow_text_transform" text not null default 'uppercase', add column if not exists "eyebrow_line_height" integer not null default 1.2, add column if not exists "title_font_family" text not null default 'Playfair Display', add column if not exists "title_font_style" text not null default 'normal', add column if not exists "title_text_transform" text not null default 'none', add column if not exists "subtitle_font_family" text not null default 'Inter', add column if not exists "subtitle_font_style" text not null default 'normal', add column if not exists "subtitle_text_transform" text not null default 'none', add column if not exists "subtitle_line_height" integer not null default 1.5;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "hero_banner" drop column if exists "eyebrow_font_family", drop column if exists "eyebrow_font_style", drop column if exists "eyebrow_text_transform", drop column if exists "eyebrow_line_height", drop column if exists "title_font_family", drop column if exists "title_font_style", drop column if exists "title_text_transform", drop column if exists "subtitle_font_family", drop column if exists "subtitle_font_style", drop column if exists "subtitle_text_transform", drop column if exists "subtitle_line_height";`);
  }

}
