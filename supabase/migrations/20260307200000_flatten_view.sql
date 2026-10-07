-- PRD step 4: flatten raw JSON for analytics (read via service role or future RLS view)

create or replace view public.github_events_flat as
select
  e.id as event_id,
  e.repository_id,
  e.source,
  e.occurred_at,
  case e.source
    when 'commit' then coalesce(
      e.payload #>> '{author,login}',
      e.payload #>> '{commit,author,name}'
    )
    else e.payload #>> '{user,login}'
  end as author,
  case e.source
    when 'commit' then e.payload #>> '{commit,message}'
    when 'comment' then e.payload ->> 'body'
    else coalesce(e.payload ->> 'body', e.payload ->> 'title')
  end as body,
  e.payload
from public.raw_github_events e;

comment on view public.github_events_flat is
  'Normalized author/time/body for SQL behavior analytics (PRD §4–5).';
