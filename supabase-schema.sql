-- ============================================
-- INSPECTION REPORT DATABASE SCHEMA
-- Jalankan ini di Supabase SQL Editor
-- ============================================

create table report_inspection (
  id uuid primary key default gen_random_uuid(),
  job_number text not null,
  report_no text,
  report_date date default current_date,
  ex_station text,
  project text,
  ro_no text,
  customer text,
  valve_type text,
  manufacture text,
  size text,
  class text,
  serial_no text,
  end_connection text,
  operated text,
  location text,
  category text check (category in ('inspection','minor','major')),
  inspector_name text,
  engineering_name text,
  status text default 'draft' check (status in ('draft','submitted','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table report_inspection_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  item_no int,
  component_name text not null,
  qty int default 1,
  condition_note text,
  recommendation text[],
  repair_category text,
  comment text,
  spec_material text,
  sort_order int
);

create table report_bom_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  section text check (section in ('valve','machining','coating')),
  item_no int,
  qty numeric,
  unit text,
  description text,
  specification text,
  dimension text,
  keterangan text,
  sort_order int
);

create table report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  item_id uuid references report_inspection_items(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_at timestamptz default now()
);

create table report_documentation (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references report_inspection(id) on delete cascade,
  component_name text,
  condition_before text,
  condition_after text,
  photo_before_url text,
  photo_after_url text,
  notes text,
  sort_order int,
  created_at timestamptz default now()
);

-- Indexes untuk performance
create index idx_items_report on report_inspection_items(report_id);
create index idx_bom_report on report_bom_items(report_id);
create index idx_photos_report on report_photos(report_id);
create index idx_photos_item on report_photos(item_id);
create index idx_docs_report on report_documentation(report_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_report_updated
  before update on report_inspection
  for each row execute function update_updated_at();
