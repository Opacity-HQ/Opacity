insert into public.games (id, name, skill_domain) values
  ('letter-detective', 'Letter Detective', 'visual_discrimination'),
  ('sound-match', 'Sound Match', 'phonological_awareness'),
  ('word-builder', 'Word Builder', 'decoding'),
  ('memory-quest', 'Memory Quest', 'working_memory'),
  ('rapid-match', 'Rapid Match', 'processing_speed')
on conflict (id) do nothing;
