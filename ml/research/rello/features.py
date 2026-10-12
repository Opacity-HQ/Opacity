"""Deterministic source-specific features; no population statistics are fitted here."""
import numpy as np
import pandas as pd

# Publication's youngest-age protocol, also present for older ages.
QUESTIONS = list(range(1, 13)) + list(range(14, 18)) + [22, 23, 30]
# For these questions clicks include actions beyond a scored answer in desktop data.
NON_COMPLEMENTARY = [1, 2, 3, 30]

def build_features(raw):
    out = {}
    for q in QUESTIONS:
        c, h, m = [pd.to_numeric(raw[f'{p}{q}'], errors='raise').astype(float)
                   for p in ('Clicks', 'Hits', 'Misses')]
        invalid = ((c < 0) | (h < 0) | (m < 0) | (h > c) | (m > c)
                   | (c % 1 != 0) | (h % 1 != 0) | (m % 1 != 0))
        # Incomplete/invalid count tuples have no interpretable rate or exposure.
        invalid |= c.isna() | h.isna() | m.isna()
        c, h, m = [v.mask(invalid) for v in (c, h, m)]
        out[f'q{q:02d}_log_clicks'] = np.log1p(c)
        out[f'q{q:02d}_hit_rate'] = h / c.where(c > 0)
        if q in NON_COMPLEMENTARY:
            out[f'q{q:02d}_miss_rate'] = m / c.where(c > 0)
    return pd.DataFrame(out, index=raw.index)

def fingerprints(x):
    """Duplicate-vector grouping, NOT a recovered participant identifier."""
    import hashlib
    return x.apply(lambda r: hashlib.sha256(
        '|'.join('NA' if pd.isna(v) else format(float(v), '.12g') for v in r).encode()
    ).hexdigest(), axis=1)
