"""Train-only model/threshold selection; locked desktop test and tablet transfer test."""
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (roc_auc_score,average_precision_score,confusion_matrix,
    balanced_accuracy_score,brier_score_loss,roc_curve,log_loss)
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from features import build_features,fingerprints,QUESTIONS

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'results'
SEED=42

def age_band(age):
    return pd.cut(age,[6,8,11,17],labels=['7-8','9-11','12-17']).astype(str)

def metrics(y,p,t):
    pred=(p>=t).astype(int)
    tn,fp,fn,tp=confusion_matrix(y,pred,labels=[0,1]).ravel()
    ratio=lambda a,b: float(a/b) if b else None
    return dict(n=len(y),positives=int(np.sum(y)),prevalence=float(np.mean(y)),threshold=float(t),
        roc_auc=float(roc_auc_score(y,p)) if len(np.unique(y))==2 else None,
        average_precision=float(average_precision_score(y,p)) if np.sum(y) else None,
        sensitivity=ratio(tp,tp+fn),specificity=ratio(tn,tn+fp),
        precision=ratio(tp,tp+fp),negative_predictive_value=ratio(tn,tn+fn),
        balanced_accuracy=float(balanced_accuracy_score(y,pred)),
        brier=float(brier_score_loss(y,p)),log_loss=float(log_loss(y,p,labels=[0,1])),
        confusion_matrix=dict(tn=int(tn),fp=int(fp),fn=int(fn),tp=int(tp)))

def intervals(y,p,t,draws=1000):
    # Conditional on this fixed model and test sample; not retraining uncertainty.
    rng=np.random.default_rng(SEED); y=np.asarray(y); p=np.asarray(p)
    neg=np.flatnonzero(y==0);pos=np.flatnonzero(y==1)
    if not len(neg) or not len(pos): return {}
    samples={k:[] for k in ['roc_auc','average_precision','sensitivity','specificity','balanced_accuracy','brier']}
    for _ in range(draws):
        idx=np.r_[rng.choice(neg,len(neg)),rng.choice(pos,len(pos))]
        m=metrics(y[idx],p[idx],t)
        for k in samples: samples[k].append(m[k])
    return {k:[float(v) for v in np.quantile(vals,[.025,.975])] for k,vals in samples.items()}

def main():
    OUT.mkdir(exist_ok=True);(ROOT/'models').mkdir(exist_ok=True)
    raw=pd.read_csv(ROOT/'data/raw/Dyt-desktop.csv',sep=';')
    tablet=pd.read_csv(ROOT/'data/raw/Dyt-tablet.csv',sep=';')
    mapping={'No':0,'Yes':1}
    assert set(raw.Dyslexia)==set(mapping) and set(tablet.Dyslexia)==set(mapping)
    x=build_features(raw); xt=build_features(tablet)
    y=raw.Dyslexia.map(mapping).to_numpy();yt=tablet.Dyslexia.map(mapping).to_numpy()
    groups=fingerprints(x).to_numpy();gt=fingerprints(xt).to_numpy()
    # Source study is participant-level; IDs unavailable. All identical model-input vectors stay together.
    assert len(set(groups)&set(gt))==0,'External cohort contains overlapping model-input vectors'
    strata=raw.Dyslexia+'_'+age_band(raw.Age)
    outer=StratifiedGroupKFold(n_splits=5,shuffle=True,random_state=SEED)
    dev,test=next(outer.split(x,strata,groups))
    assert set(groups[dev]).isdisjoint(groups[test])
    cv=StratifiedGroupKFold(n_splits=5,shuffle=True,random_state=SEED+1)
    folds=list(cv.split(x.iloc[dev],strata.iloc[dev],groups[dev]))
    for tr,va in folds:
        assert set(groups[dev[tr]]).isdisjoint(groups[dev[va]])
        assert len(np.unique(y[dev[tr]]))==len(np.unique(y[dev[va]]))==2
    def pipeline(model):
        return Pipeline([('imputer',SimpleImputer(strategy='median',add_indicator=True,keep_empty_features=True)),
            ('variance',VarianceThreshold()),('scaler',StandardScaler()),('classifier',model)])
    candidates={
        'dummy':pipeline(DummyClassifier(strategy='prior')),
        'logistic_regression':pipeline(LogisticRegression(C=1.0,max_iter=3000,class_weight=None,random_state=SEED)),
        'random_forest':pipeline(RandomForestClassifier(n_estimators=300,max_depth=8,min_samples_leaf=5,
            max_features='sqrt',class_weight=None,random_state=SEED,n_jobs=2)),
    }
    # No class weighting: prevalence-aware score baseline. OOF threshold handles sensitivity target.
    rows=[];oof={};fold_metrics={}
    for name,pipe in candidates.items():
        pred=np.zeros(len(dev));perfold=[]
        for f,(tr,va) in enumerate(folds):
            est=clone(pipe).fit(x.iloc[dev[tr]],y[dev[tr]])
            pred[va]=est.predict_proba(x.iloc[dev[va]])[:,1]
            perfold.append(dict(fold=f,**metrics(y[dev[va]],pred[va],.5)))
        oof[name]=pred;fold_metrics[name]=perfold
        rows.append(dict(model=name,cv_auc_mean=float(np.mean([v['roc_auc'] for v in perfold])),
            cv_auc_sd=float(np.std([v['roc_auc'] for v in perfold],ddof=1)),
            cv_ap_mean=float(np.mean([v['average_precision'] for v in perfold]))))
        print(name,rows[-1],flush=True)
    selected=max([r for r in rows if r['model']!='dummy'],key=lambda r:r['cv_auc_mean'])['model']
    fpr,tpr,thresholds=roc_curve(y[dev],oof[selected],drop_intermediate=False)
    eligible=np.flatnonzero((tpr>=.80)&np.isfinite(thresholds))
    # Highest specificity among OOF thresholds meeting predeclared 80% sensitivity.
    best=eligible[np.argmin(fpr[eligible])];threshold=float(thresholds[best])
    model=clone(candidates[selected]).fit(x.iloc[dev],y[dev])
    pt=model.predict_proba(x.iloc[test])[:,1];pe=model.predict_proba(xt)[:,1]
    dummy=clone(candidates['dummy']).fit(x.iloc[dev],y[dev])
    evaluations={}
    for cohort,labels,prob,meta in [('desktop_holdout',y[test],pt,raw.iloc[test]),('tablet_external',yt,pe,tablet)]:
        evaluations[cohort]=dict(at_default_threshold=metrics(labels,prob,.5),
            at_oof_threshold=metrics(labels,prob,threshold),
            confidence_intervals=intervals(labels,prob,threshold),by_age={})
        for band in ['7-8','9-11','12-17']:
            mask=(age_band(meta.Age)==band).to_numpy()
            evaluations[cohort]['by_age'][band]=metrics(labels[mask],prob[mask],threshold)
    evaluations['desktop_dummy']=metrics(y[test],dummy.predict_proba(x.iloc[test])[:,1],.5)
    evaluations['tablet_dummy']=metrics(yt,dummy.predict_proba(xt)[:,1],.5)
    bundle=dict(pipeline=model,feature_names=x.columns.tolist(),questions=QUESTIONS,
        threshold=threshold,label_mapping=mapping,model=selected,
        scope='Rello research benchmark only; not validated for Opacity game vectors',
        training_partition='desktop development partition only; desktop holdout and tablet excluded')
    joblib.dump(bundle,ROOT/'models/rello_baseline.joblib')
    pd.DataFrame(rows).to_csv(OUT/'cv_comparison.csv',index=False)
    manifest=pd.DataFrame(dict(source='desktop',source_row=np.arange(len(raw)),fingerprint=groups,
                               label=y,partition='development'))
    manifest.loc[test,'partition']='holdout';manifest['development_fold']=-1
    for f,(_,va) in enumerate(folds): manifest.loc[dev[va],'development_fold']=f
    manifest.to_csv(OUT/'split_manifest.csv',index=False)
    preds=[]
    for cohort,ids,g,labels,prob,ages in [('desktop_holdout',test,groups[test],y[test],pt,raw.Age.iloc[test]),
                                      ('tablet_external',np.arange(len(tablet)),gt,yt,pe,tablet.Age)]:
        preds.append(pd.DataFrame(dict(cohort=cohort,source_row=ids,fingerprint=g,label=labels,
            score=prob,age_band=age_band(ages).to_numpy(),predicted=(prob>=threshold).astype(int))))
    pd.concat(preds).to_csv(OUT/'predictions.csv',index=False)
    pd.DataFrame(dict(source_row=dev,label=y[dev],score=oof[selected],model=selected)).to_csv(OUT/'development_oof.csv',index=False)
    summary=dict(seed=SEED,selected_model=selected,threshold=threshold,target_oof_sensitivity=.80,
        raw_feature_count=len(x.columns),pipeline_feature_count=len(model['variance'].get_feature_names_out()),
        feature_names=x.columns.tolist(),split=dict(development=len(dev),development_positives=int(y[dev].sum()),
            holdout=len(test),holdout_positives=int(y[test].sum()),external=len(yt),external_positives=int(yt.sum()),
            overlapping_fingerprints=0),cv_comparison=rows,fold_metrics=fold_metrics,
        selection_oof_metrics=metrics(y[dev],oof[selected],threshold),evaluations=evaluations,
        guarantees=['No label, diagnosis metadata, demographics, identifiers, raw rates or Score used as inputs',
            'Imputation, variance removal and scaling fit inside each training fold',
            'Model and threshold selection use development OOF predictions only',
            'Holdout and tablet labels never used for fitting or model/threshold selection',
            'Duplicate model-input vectors grouped in splitting'],
        limitations=['No participant/site IDs in Rello exports; hidden repeat participants or recruitment confounding cannot be excluded',
            'Tablet is a task/interface transfer test, not equivalent-task validation; no input equivalence with Opacity established',
            'OOF-selected threshold and model make selection OOF metrics optimistic; locked holdout is the evaluation',
            'Bootstrap intervals condition on a fixed fitted model and prevalence; do not include training uncertainty',
            'Scores have not undergone independent calibration and must not be presented as clinical risk probabilities'])
    (OUT/'baseline_metrics.json').write_text(json.dumps(summary,indent=2,allow_nan=False))
    print(json.dumps(dict(selected=selected,threshold=threshold,
        holdout=evaluations['desktop_holdout']['at_oof_threshold'],
        tablet=evaluations['tablet_external']['at_oof_threshold']),indent=2),flush=True)

if __name__=='__main__': main()
