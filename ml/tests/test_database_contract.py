"""Exercise the migration's CHECK expression without requiring a live database.

SQLite evaluates this portable predicate; PostgreSQL ALTER/migration execution
still needs verification against the configured Supabase project.
"""
from pathlib import Path
import re
import sqlite3
import unittest

ROOT=Path(__file__).resolve().parents[2]

class TrialErrorContract(unittest.TestCase):
    def setUp(self):
        migration=(ROOT/'backend/supabase/migrations/20261009150000_allow_memory_quest_error_types.sql').read_text()
        predicate=re.search(r'check\s*\((.*)\)\s*;',migration,re.S).group(1)
        self.db=sqlite3.connect(':memory:')
        self.db.execute(f'create table game_trials(error_type text check ({predicate}))')

    def tearDown(self):
        self.db.close()

    def test_original_and_memory_quest_errors_persist(self):
        for error in [None,'mirror','rotation','visual_similar','phonological','omission','timeout','order','item','location']:
            with self.subTest(error=error):
                self.db.execute('insert into game_trials values (?)',(error,))
        self.assertEqual(self.db.execute('select count(*) from game_trials').fetchone()[0],10)

    def test_unknown_error_still_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute('insert into game_trials values (?)',('not_a_valid_error',))

if __name__=='__main__':unittest.main()
