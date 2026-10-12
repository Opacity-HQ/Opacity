"""Meaningful feature invariance and saved-model/split integrity checks."""
import hashlib
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from features import build_features,fingerprints
from train_baseline import metrics

ROOT=Path(__file__).resolve().parent
raw=pd.read_csv(ROOT/'data/raw/Dyt-desktop.csv',sep=';')
tablet=pd.read_csv(ROOT/'data/raw/Dyt-tablet.csv',sep=';')
x=build_features(raw)
assert x.shape==(3644,42)
mutated=raw.copy()
for c in mutated:
    if c.startswith(('Score','Accuracy','Missrate')): mutated[c]=-999
mutated['Dyslexia']='not a label'
mutated['Age']=999
pd.testing.assert_frame_equal(x,build_features(mutated))
sample=raw.iloc[[0]].copy()
for p in ('Clicks','Hits','Misses'): sample[f'{p}1']=0
f=build_features(sample)
assert np.isnan(f.q01_hit_rate.iloc[0]) and np.isnan(f.q01_miss_rate.iloc[0])
assert f.q01_log_clicks.iloc[0]==0
sample['Hits1']=1
assert build_features(sample).filter(regex='^q01_').isna().all().all()
sample['Clicks1']=np.nan
assert build_features(sample).filter(regex='^q01_').isna().all().all()
split=pd.read_csv(ROOT/'results/split_manifest.csv')
dev=split.loc[split.partition=='development','source_row'].to_numpy()
test=split.loc[split.partition=='holdout','source_row'].to_numpy()
assert len(set(dev)&set(test))==0 and len(set(dev)|set(test))==len(raw)
assert set(split.loc[dev,'fingerprint']).isdisjoint(set(split.loc[test,'fingerprint']))
for fold in range(5):
    va=split[(split.partition=='development')&(split.development_fold==fold)].fingerprint
    tr=split[(split.partition=='development')&(split.development_fold!=fold)].fingerprint
    assert set(va).isdisjoint(tr)
bundle=joblib.load(ROOT/'models/rello_baseline.joblib')
summary=json.load(open(ROOT/'results/baseline_metrics.json'))
np.testing.assert_allclose(bundle['pipeline']['imputer'].statistics_,np.nanmedian(x.iloc[dev],axis=0))
predictions=pd.read_csv(ROOT/'results/predictions.csv')
for cohort,frame,idx in [('desktop_holdout',raw,test),('tablet_external',tablet,np.arange(len(tablet)))]:
    probs=bundle['pipeline'].predict_proba(build_features(frame.iloc[idx]))[:,1]
    saved=predictions[predictions.cohort==cohort]
    np.testing.assert_allclose(probs,saved.score,rtol=1e-12,atol=1e-12)
    labels=frame.Dyslexia.map(bundle['label_mapping']).to_numpy()[idx]
    actual=metrics(labels,probs,bundle['threshold'])
    assert actual==summary['evaluations'][cohort]['at_oof_threshold']
    assert not set(fingerprints(build_features(tablet)))&set(fingerprints(x))
manifest=ROOT/'source_manifest.json'
if manifest.exists():
    for entry in json.load(open(manifest)):
        assert hashlib.sha256((ROOT/'data/raw'/entry['file']).read_bytes()).hexdigest()==entry['sha256']
print('PASS: feature invariance, invalid/zero/missing handling, partition and fold isolation, train-only imputation, saved predictions, metrics and available source hashes')
