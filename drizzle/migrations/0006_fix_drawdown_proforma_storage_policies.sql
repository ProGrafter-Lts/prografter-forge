drop policy if exists "Trades can upload own proformas" on storage.objects;
drop policy if exists "Trades can read own proformas" on storage.objects;

create policy "Trades can upload own proformas"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'drawdown-proformas'
  and exists (
    select 1 from public.trades t
    where t.user_id = auth.uid()
      and (storage.foldername(storage.objects.name))[1] = t.id::text
  )
);

create policy "Trades can read own proformas"
on storage.objects for select to authenticated
using (
  bucket_id = 'drawdown-proformas'
  and exists (
    select 1 from public.trades t
    where t.user_id = auth.uid()
      and (storage.foldername(storage.objects.name))[1] = t.id::text
  )
);