import re
import random
import pandas as pd
from pathlib import Path

ts_file = Path(r'd:\Masaustu010426\SENG430-project\Health AI\frontend\src\lib\domains.ts')
data_dir = Path(r'd:\Masaustu010426\SENG430-project\Health AI\backend\data')

with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Using basic string manipulation since regex with optional groups can be tricky
domain_blocks = content.split("id: '")
for block in domain_blocks[1:]:
    d_id = block.split("'")[0]
    
    original_datasets = ["cardiology", "diabetes", "breast_cancer", "parkinsons", "nephrology", "sepsis", "fetal_health"]
    if d_id in original_datasets:
        print(f"Skipping {d_id}, this is an original realistic dataset.")
        continue
    
    # Extract targetColumn
    target = 'target'
    if "targetColumn: '" in block:
        target = block.split("targetColumn: '")[1].split("'")[0]
        
    # Extract suggestedFeatures
    features = []
    if 'suggestedFeatures: [' in block:
        feats_block = block.split('suggestedFeatures: [')[1].split(']')[0]
        features = [f.strip(" '\r\n") for f in feats_block.split(',') if f.strip(" '\r\n")]
        
    # Extract subgroupFields
    subgroups = []
    if 'subgroupFields: [' in block:
        subs_block = block.split('subgroupFields: [')[1].split(']')[0]
        subgroups = [s.strip(" '\r\n") for s in subs_block.split(',') if s.strip(" '\r\n")]
        
    # Determine number of classes
    num_classes = 2
    if 'taskType: \'multiclass\'' in block:
        if 'classLabels: [' in block:
            labels_block = block.split('classLabels: [')[1].split(']')[0]
            labels = [l for l in labels_block.split(',') if l.strip()]
            num_classes = max(2, len(labels))
        else:
            num_classes = 3

    print(f"Generating mock {d_id}.csv (Target: {target}, Features: {features}, Subgroups: {subgroups})")
    
    n = random.randint(240, 850)
    df = pd.DataFrame()
    for f in features:
        df[f] = [round(random.normalvariate(50, 15), 2) for _ in range(n)]
        
    for s in subgroups:
        if s not in df.columns:
            df[s] = [random.choice(['GroupA', 'GroupB']) for _ in range(n)]
            
    df[target] = [random.randint(0, num_classes-1) for _ in range(n)]
    
    df.to_csv(data_dir / f'{d_id}.csv', index=False)
