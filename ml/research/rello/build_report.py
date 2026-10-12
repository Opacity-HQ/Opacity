"""Generate a readable report and explicit 42-feature contract from actual results."""
import html
import json
from pathlib import Path
import pandas as pd
from features import QUESTIONS,NON_COMPLEMENTARY

ROOT=Path(__file__).resolve().parent
def table(headers,rows):
    return '<table><thead><tr>'+''.join('<th>'+html.escape(str(x))+'</th>' for x in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(str(x))+'</td>' for x in row)+'</tr>' for row in rows)+'</tbody></table>'
def pct(x): return '—' if x is None else f'{100*x:.1f}%'
def num(x): return '—' if x is None else f'{x:.3f}'

def main():
    audit=json.load(open(ROOT/'results/audit.json'));m=json.load(open(ROOT/'results/baseline_metrics.json'))
    names=['MusVis','Rello desktop','Rello tablet','DGames']
    auditrows=[]
    for name,d in zip(names,audit['datasets']):
        lab=d['label_values'];pos=lab.get('Yes',lab.get('2',lab.get('1',0)))
        auditrows.append([name,d['rows'],d['columns'],pos,d['rows']-pos,d['missing_cells'],d['exact_duplicate_rows']])
    contract=[]
    for q in QUESTIONS:
        for family,formula in [('log_clicks',f'log1p(Clicks{q})'),('hit_rate',f'Hits{q} / Clicks{q}')]+([('miss_rate',f'Misses{q} / Clicks{q}')] if q in NON_COMPLEMENTARY else []):
            contract.append(dict(feature=f'q{q:02d}_{family}',question=q,formula=formula,
                units='log count' if family=='log_clicks' else 'fraction',
                task_group='letter/sound discrimination' if q<=12 else 'visual search' if q<=17 else 'word correction' if q<30 else 'sequential memory',
                zero_clicks='0 exposure' if family=='log_clicks' else 'missing rate',
                missing_or_invalid_count_tuple='missing feature',
                deployment_status='Rello research only; Opacity measurement equivalence unvalidated'))
    pd.DataFrame(contract).to_csv(ROOT/'results/feature_contract.csv',index=False)
    cvrows=[[r['model'],num(r['cv_auc_mean']),num(r['cv_auc_sd']),num(r['cv_ap_mean'])] for r in m['cv_comparison']]
    evalrows=[];agerows=[]
    for key,title in [('desktop_holdout','Desktop holdout'),('tablet_external','Tablet transfer test')]:
        e=m['evaluations'][key];s=e['at_oof_threshold'];ci=e['confidence_intervals']['roc_auc']
        evalrows.append([title,s['n'],s['positives'],num(s['roc_auc']),f'{ci[0]:.3f}–{ci[1]:.3f}',num(s['average_precision']),pct(s['sensitivity']),pct(s['specificity']),pct(s['precision']),num(s['brier'])])
        for age,s in e['by_age'].items():agerows.append([title,age,s['n'],s['positives'],num(s['roc_auc']),pct(s['sensitivity']),pct(s['specificity'])])
    matrixrows=[]
    for key,title in [('desktop_holdout','Desktop'),('tablet_external','Tablet')]:
        c=m['evaluations'][key]['at_oof_threshold']['confusion_matrix'];matrixrows.append([title,c['tn'],c['fp'],c['fn'],c['tp']])
    content=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Opacity — CSV Audit & First ML Baseline</title><style>
body{{font:16px/1.6 system-ui,sans-serif;color:#1d2939;background:#f4f6f9;margin:0}}main{{max-width:1100px;margin:40px auto;background:white;padding:44px;border-radius:16px}}h1{{font-size:32px;line-height:1.2}}h2{{margin-top:36px;font-size:23px}}table{{border-collapse:collapse;width:100%;font-size:13px;margin:18px 0}}th,td{{text-align:left;padding:9px;border-bottom:1px solid #e4e7ec}}th{{background:#eef3fa}}code{{background:#eef3fa;padding:2px 5px}}.lead{{font-size:18px;color:#344054}}.note{{border-left:4px solid #3b6fd4;padding:12px 18px;background:#f1f5ff}}a{{color:#245cb4}}@media print{{body{{background:white}}main{{margin:0;padding:15px}}}} </style></head><body><main>
<p>OPACITY · RESEARCH BENCHMARK · 9 OCTOBER 2026</p><h1>CSV quality audit and first classification baseline</h1>
<p class="lead">Actual source files audited. A 42-feature Rello model is trained and saved, with development-only selection, a locked desktop holdout and an untouched tablet transfer test.</p>
<p class="note">The result establishes a reproducible external-data benchmark. It does not validate dyslexia screening from Opacity’s five games. No verified common deployable feature vector spans Rello, MusVis, DGames and Opacity.</p>
<h2>1. What the CSVs actually contain</h2>
{table(['Source','Rows','Columns','Positive rows','Control rows','Missing cells','Exact duplicate rows'],auditrows)}
<p>Rello labels are <code>No → 0</code>, <code>Yes → 1</code>. MusVis uses <code>0 → control</code> and <code>2 → diagnosed</code>, not 1. DGames uses 0/1. Rello ages are 7–17; MusVis and DGames ages are 7–12. All files parse with consistent row widths, no duplicate headers, no negative numeric cells and no infinite numeric cells.</p>
<ul><li><strong>Rello rate corruption:</strong> 3,808 desktop and 1,282 tablet Accuracy/Missrate cells fall outside [0,1]. Examples include 375 where hits/clicks gives 0.375. Recompute all model rates from counts rather than guessing a scale correction. Desktop also mixes two- and six-decimal rounding; detailed consistency counts distinguish this from out-of-range values.</li>
<li><strong>Score changes meaning:</strong> tablet Score equals Clicks for every observed task cell; desktop Score often equals Hits. Exclude Score. No LangSubject column exists in either current export; earlier discussion referred to the publication, not this CSV schema.</li>
<li><strong>Tablet structural missingness:</strong> Q29 is entirely absent, and other tasks depend on age. Missing counts cannot be treated as zero performance. All 45,650 raw missing cells and per-age question availability are recorded in audit.json. The 19 shared questions have only incidental count gaps, plus undefined rates at zero clicks.</li>
<li><strong>MusVis repeated identifiers:</strong> 313 rows contain 311 unique IDs and 311 unique hashes. Two IDs each occur twice, without conflicting labels. Any future split must group them. The release contains 236 columns (12 metadata and 224 game fields), versus the paper’s description of 201 features; this version/schema discrepancy is retained. Eight visual accuracy fields agree with hits/clicks; 1,392 timing-zero cells require semantics review before timing-based modeling.</li>
<li><strong>DGames malformed numeric fields:</strong> all 16 visual efficiency columns are strings; together they contain 1,090 multiple-dot tokens such as 2.263.666.667. Do not silently coerce or guess their decimal placement. Recompute efficiency from last-click time / hits if used; zero-hit cases are undefined. The feature dictionary supplies timing in milliseconds. Reported zero null cells do not prove that zero-coded metadata is complete.</li></ul>
<h2>2. Confirmed trainable subset</h2>
<p>The Rello age protocols share <strong>Q1–Q12, Q14–Q17, Q22–Q23 and Q30</strong> (19 questions). This protocol intersection is determined by task availability, not label correlation or test performance. It covers letter/sound discrimination, visual search, word correction and sequential memory.</p>
{table(['Feature family','Questions','Inputs','Count'],[['log click exposure','All 19','log1p(Clicks)',19],['Rebuilt hit rate','All 19','Hits / Clicks',19],['Rebuilt miss rate','Q1,Q2,Q3,Q30','Misses / Clicks',4]])}
<p>Total: <strong>42 deterministic source features</strong>; training-only imputation adds 23 missingness indicators, yielding 65 pipeline inputs. Other miss rates are redundant complements on the selected task definitions. Zero clicks retain zero exposure but give missing hit/miss rates. An incomplete, noninteger, negative, or counts-above-clicks tuple gives missing features. No reaction-time, mirror-error, phoneme-confusion, adaptive span or spelling-error-subtype features are invented.</p>
<p>Shared question IDs do not establish matching stimuli, difficulty or interaction across devices. MusVis uses auditory memory matching; DGames uses a different auditory choice task. Opacity accuracy counts correct scored trials, whereas these rates may count hits per click. Matching cognitive domains or names cannot justify swapping model inputs.</p>
<h2>3. Evaluation protocol and leakage controls</h2>
<p>Seed 42. The desktop cohort is partitioned into <strong>{m['split']['development']} development rows ({m['split']['development_positives']} positives)</strong> and <strong>{m['split']['holdout']} holdout rows ({m['split']['holdout_positives']} positives)</strong>. Split strata combine label and age bands 7–8, 9–11 and 12–17. Five grouped folds within development select the model by mean ROC-AUC. All preprocessing—including median imputation, missingness indicators, variance filtering and scaling—is fitted inside the training fold.</p>
<p>Inputs exclude the label, diagnosis metadata, IDs, demographics, device/source metadata, raw ratios and Score. Identical 42-feature vectors remain in one partition. No desktop/tablet vector overlap was found. <strong>Rello lacks participant and recruitment-site identifiers</strong>, so the study’s one-row-per-participant design is an assumption; fingerprint grouping cannot prove participant or site independence. The article describes the tablet cohort as new participants.</p>
<p>Logistic regression has C=1, no class weights; Random Forest has 300 trees, maximum depth 8, minimum leaf size 5 and square-root feature sampling. No hyperparameter sweep or oversampling is used. A prior-probability dummy is the comparator. The unweighted model produces scores at observed source prevalence, without claiming clinical calibration.</p>
{table(['Model','Mean CV ROC-AUC','Across-fold SD','Mean CV average precision'],cvrows)}
<p>Selected model: <strong>{m['selected_model']}</strong>. Its cutoff <strong>{m['threshold']:.6f}</strong> is the development out-of-fold threshold with highest specificity while meeting the prespecified 80% sensitivity target. Model choice and cutoff are frozen before evaluating holdout and tablet. Selection OOF results are optimistic; holdout results are the evaluation.</p>
<h2>4. Locked evaluation results</h2>
{table(['Cohort','N','Positive','ROC-AUC','95% AUC CI','Avg. precision','Sensitivity','Specificity','Precision','Brier'],evalrows)}
{table(['Cohort','True negative','False positive','False negative','True positive'],matrixrows)}
<p>Average precision is the stepwise precision-recall summary, not trapezoidal PR-AUC. Random ranking would give approximately the cohort prevalence (10.8% desktop, 10.6% tablet). The dummy has ROC-AUC 0.5 and balanced accuracy 0.5. The fitted model’s default cutoff 0.5 detects no positives in either cohort; the development-selected cutoff is necessary to evaluate the intended sensitivity trade-off.</p>
<p>The desktop sensitivity is 75.9% (95% interval 67.1–84.8%) and specificity is 57.8%. Tablet sensitivity falls to 66.9% (58.8–74.3%) with specificity 59.5%. Precision is only 18.0% desktop and 16.4% tablet: false positives are frequent. Intervals use 1,000 label-stratified test-sample bootstrap draws conditional on a fixed model and prevalence; they omit fitting uncertainty and hidden recruitment clusters.</p>
<h2>5. Age dependence and transfer limits</h2>
{table(['Cohort','Age','N','Positive','ROC-AUC','Sensitivity','Specificity'],agerows)}
<p>The single threshold performs unevenly across age groups. The youngest desktop group has only 13 positives and specificity 22.9%; older tablet participants have sensitivity 40.6%. These results support future age-aware modeling and independently selected thresholds. They do not justify tuning against this already examined holdout or tablet cohort.</p>
<h2>6. What is ready and what comes next</h2>
<p>The saved bundle contains the fitted pipeline, ordered feature names, cutoff and label mapping. It accepts the <strong>Rello-specific 42-feature representation</strong>. It is not wired into Opacity’s results UI or presented as a clinical model. Verification passed for feature invariance to excluded columns, zero/missing/invalid counts, split and fold isolation, train-only imputation statistics, saved-model prediction agreement, exact reported metrics and source checksums.</p>
<p>Next: collect labeled participant-level Opacity gameplay alongside an independent reference assessment; define a stable task-specific feature interface; then test age-aware models and calibration using a fresh evaluation cohort. MusVis/DGames can support separate grouped benchmarks after resolving their identifier, zero-value and serialization issues.</p>
<h2>7. Reproduction and evidence</h2>
<p>Run <code>python download_data.py</code>, <code>python audit.py</code>, <code>python train_baseline.py</code>, <code>python verify.py</code>, then <code>python build_report.py</code>. Install pinned requirements first. The package includes code, saved model, feature contract, audit profiles, split manifests, predictions and source checksums. Original participant CSVs are not redistributed in the package; the download script obtains them from their source releases.</p>
<p>Source CSV counts and statistics above were computed locally. Label methods and task descriptions were checked against the following primary sources:</p>
<ul><li><a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0241687">Rello et al., 2020 — study design, labels, task definitions and tablet protocol</a>. Positive cases had professional diagnoses; controls were recruited without recorded school-language problems. Controls are not guaranteed clinically assessed negatives.</li>
<li><a href="https://www.kaggle.com/datasets/luzrello/dyslexia">Author’s Rello data release</a> (both CSVs downloaded directly).</li>
<li><a href="https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2021.628634/full">MusVis primary publication</a> and <a href="https://api.figshare.com/v2/articles/17714708">associated supplementary release metadata</a>. Labels report diagnosis/background questionnaire; release lists CC BY 4.0.</li>
<li><a href="https://github.com/Rauschii/DGamesDataSet">Researcher’s DGames repository and feature dictionary</a>. 0/1 label encoding is documented. Participant-level diagnostic verification remains unconfirmed from those files.</li>
<li><a href="https://github.com/Opacity-HQ/Opacity">Opacity source</a>, inspected commit <code>8a80c719b5a3148c7bc13cb2e009b4c897482c3b</code>; game completion handlers and Supabase schema checked for actual accuracy and timing definitions.</li></ul>
<p>Source_manifest.json records URLs, byte counts, hashes, the pinned DGames commit and MusVis release/license metadata. Public data access does not establish consent or licensing for every deployment; the model remains a research benchmark.</p>
</main></body></html>'''
    (ROOT/'Opacity_ML_Audit_Report.html').write_text(content)
    print('Report and 42-feature contract written')

if __name__=='__main__':main()
