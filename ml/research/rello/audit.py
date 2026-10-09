"""CSV-level schema, distribution, identifier, and count/rate consistency audit."""
import csv
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from features import build_features, fingerprints, QUESTIONS

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'data' / 'raw'
OUT = ROOT / 'results'

def inspect(path):
    sample = path.read_text(encoding='utf-8-sig')[:16000]
    try:
        delim = csv.Sniffer().sniff(sample[:sample.rfind('\n')], delimiters=',;\t').delimiter
    except csv.Error:
        header = sample.splitlines()[0]
        delim = max(',;\t', key=header.count)
    with path.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f, delimiter=delim))
    frame = pd.read_csv(path, sep=delim)
    numeric = frame.select_dtypes('number')
    label = 'Dyslexia' if 'Dyslexia' in frame else 'diagnosed'
    age = 'Age' if 'Age' in frame else 'age'
    report = dict(file=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                  rows=len(frame), columns=len(frame.columns), delimiter=delim,
                  malformed_rows=sum(len(r) != len(rows[0]) for r in rows[1:]),
                  duplicate_headers=len(rows[0])-len(set(rows[0])),
                  exact_duplicate_rows=int(frame.duplicated().sum()),
                  label_values={str(k): int(v) for k,v in frame[label].value_counts(dropna=False).items()},
                  missing_label_rows=int(frame[label].isna().sum()),
                  age_range=[float(frame[age].min()),float(frame[age].max())],
                  age_counts={str(k): int(v) for k,v in frame[age].value_counts().sort_index().items()},
                  missing_cells=int(frame.isna().sum().sum()),
                  negative_numeric_cells=int((numeric < 0).sum().sum()),
                  infinite_cells=int(np.isinf(numeric).sum().sum()),
                  constant_columns=frame.columns[frame.nunique(dropna=False)<=1].tolist(),
                  string_columns=frame.select_dtypes('object').columns.tolist(),
                  identifier_checks={})
    for col in ('id','mus_1_hashcode'):
        if col in frame:
            report['identifier_checks'][col] = dict(unique=int(frame[col].nunique()),
                duplicate_excess_rows=int(frame[col].duplicated().sum()),
                groups_with_conflicting_labels=int((frame.groupby(col)[label].nunique()>1).sum()))
    if 'diagnosed' in frame:
        rate_cols=[c for c in frame if 'accuarcy' in c or 'hit_devided_totalclicks' in c]
        report['task_checks']=dict(rate_columns=rate_cols,
            rates_outside_0_1=int(((frame[rate_cols]<0)|(frame[rate_cols]>1)).sum().sum()))
        if 'mus_1_hashcode' in frame:
            report['task_checks']['visual_accuracy_reconstruction_mismatches']=sum(
                int(((frame['vis_1_totalclicks_'+s]>0)&~np.isclose(
                    frame['vis_1_accuarcy_'+s],frame['vis_1_hits_'+s]/frame['vis_1_totalclicks_'+s],atol=1e-6,rtol=0)).sum())
                for s in ['1_4','1_9','2_4','2_9','3_4','3_9','4_4','4_9'])
            report['task_checks']['timing_zero_cells']=int((frame[[c for c in frame if 'time_' in c or 'firstclick' in c]]==0).sum().sum())
        else:
            object_cols=frame.select_dtypes('object').columns
            report['task_checks']['malformed_multiple_dot_numeric_tokens']=sum(
                int(frame[c].astype(str).str.match(r'^\d+\.\d+\.\d+').sum()) for c in object_cols)
    profiles=[]
    for col in frame:
        s=frame[col]
        entry=dict(dataset=path.name,column=col,dtype=str(s.dtype),missing=int(s.isna().sum()),
                   missing_rate=float(s.isna().mean()),unique=int(s.nunique()))
        if pd.api.types.is_numeric_dtype(s):
            entry.update(min=float(s.min()) if s.notna().any() else None,
                max=float(s.max()) if s.notna().any() else None,
                median=float(s.median()) if s.notna().any() else None,
                zeros=int((s==0).sum()),negative=int((s<0).sum()))
        else:
            entry['multiple_dot_tokens']=int(s.astype(str).str.match(r'^\d+\.\d+\.\d+').sum())
        profiles.append(entry)
    if path.name.startswith('Dyt-'):
        quality=[]
        for q in range(1,33):
            c,h,m=[frame[f'{p}{q}'] for p in ('Clicks','Hits','Misses')]
            item=dict(question=q,missing_counts=int(pd.concat([c,h,m],axis=1).isna().any(axis=1).sum()),
                zero_clicks=int((c==0).sum()),hits_gt_clicks=int((h>c).sum()),misses_gt_clicks=int((m>c).sum()),
                clicks_not_equal_hits_plus_misses=int(((c!=h+m)&c.notna()&h.notna()&m.notna()).sum()),
                score_equals_hits=int((frame[f'Score{q}']==h).sum()),score_equals_clicks=int((frame[f'Score{q}']==c).sum()))
            for rate,n in [('Accuracy',h),('Missrate',m)]:
                s=frame[f'{rate}{q}']; expected=n/c.where(c>0); observed=expected.notna()&s.notna()
                item[rate+'_outside_0_1']=int(((s<0)|(s>1)).sum())
                # Tolerate source's six-decimal rounding; don't report it as corruption.
                item[rate+'_mismatch_counts']=int((observed&~np.isclose(s,expected,atol=1e-6,rtol=0)).sum())
                item[rate+'_mismatch_beyond_two_decimal_rounding']=int((observed&~np.isclose(s,expected,atol=.0050001,rtol=0)).sum())
            quality.append(item)
        report['question_quality']=quality
        report['rate_cells_outside_0_1']=sum(v[p+'_outside_0_1'] for v in quality for p in ('Accuracy','Missrate'))
        report['rate_cells_mismatching_counts']=sum(v[p+'_mismatch_counts'] for v in quality for p in ('Accuracy','Missrate'))
        report['rate_mismatch_beyond_two_decimal_rounding']=sum(v[p+'_mismatch_beyond_two_decimal_rounding'] for v in quality for p in ('Accuracy','Missrate'))
        report['question_observations_by_age']=frame.groupby(age)[[f'Clicks{q}' for q in range(1,33)]].count().to_dict()
        x=build_features(frame)
        report['derived_features']=len(x.columns)
        report['derived_missing_cells']=int(x.isna().sum().sum())
        report['duplicate_common_feature_vectors']=int(fingerprints(x).duplicated().sum())
    return frame,report,profiles

def main():
    OUT.mkdir(exist_ok=True)
    reports=[]; profiles=[]; frames={}
    for p in sorted(RAW.iterdir()):
        if p.suffix.lower()!='.csv': continue
        frame,report,profile=inspect(p); frames[p.name]=frame
        reports.append(report);profiles.extend(profile)
    a,b=[frames['Dyt-'+n+'.csv'] for n in ('desktop','tablet')]
    ga,gb=[fingerprints(build_features(f)) for f in (a,b)]
    overlap=dict(rello_common_vector_overlap=len(set(ga)&set(gb)),
        common_questions=QUESTIONS,
        participant_identity='Rello and DGames export no participant ID. One row per participant is assumed from study design; duplicate-vector grouping is only a safeguard.',
        pooling='No verified equivalent feature vector across Rello, MusVis, DGames and Opacity. Do not pool.',
        musvis='313 rows but 311 unique IDs and hashes; group repeated identifiers if modeled. Export has 236 columns versus paper description of 201 features; retain version mismatch.',
        dgames='16 derived efficiency columns contain nonnumeric multiple-dot tokens; recompute from original components if used. Auditory task differs from MusVis.')
    (OUT/'audit.json').write_text(json.dumps(dict(datasets=reports,cross_dataset=overlap),indent=2,allow_nan=False))
    pd.DataFrame(profiles).to_csv(OUT/'column_profiles.csv',index=False)
    for r in reports: print(r['file'],r['rows'],r['columns'],r['label_values'])
    print('Rello common-vector overlap:',overlap['rello_common_vector_overlap'])

if __name__=='__main__': main()
