# SENG430-project
Seng 430 Project - ML Visualization Tool

The ML Visualization Tool helps doctors, nurses, and other healthcare professionals understand how artificial intelligence and machine learning work in real clinical settings — without any technical background. 

The following repository structure represents the planned organization of the project.  
Since the implementation phase has not yet started (Sprint 1), some directories are placeholders and may evolve as development progresses.

```
ml-visualization-tool
│
├── README.md
├── SETUP.md
├── USER_GUIDE.docx
│
├── documents/                # Project documentation
│
├── frontend/                 # Web interface of the visualization tool
│   ├── components/
│   │   ├── navigation/
│   │   ├── progress-bar/
│   │   └── charts/
│   │
│   ├── pages/
│   │   ├── specialty-selection/
│   │   ├── clinical-context/
│   │   ├── data-exploration/
│   │   ├── data-preparation/
│   │   ├── model-selection/
│   │   ├── results/
│   │   ├── explainability/
│   │   └── ethics-bias/
│   │
│   └── assets/
│
├── backend/                  # Backend logic (ML pipeline and data processing)
│   ├── data-processing/
│   │   ├── dataset-loader
│   │   ├── preprocessing
│   │   └── validation
│   │
│   ├── models/
│   │   ├── knn
│   │   ├── svm
│   │   ├── decision-tree
│   │   ├── random-forest
│   │   ├── logistic-regression
│   │   └── naive-bayes
│   │
│   ├── evaluation/
│   │   ├── metrics
│   │   ├── confusion-matrix
│   │   └── roc-curve
│   │
│   └── explainability/
│       ├── feature-importance
│       └── patient-explanations
│
├── datasets/                 # Example datasets used in the tool
│
├── tests/                    # Unit and integration tests
│
└── scripts/                  # Utility scripts (data loading, preprocessing etc.)
```

## Branch Protection Rules

Branch protection rules have been configured for the `main` branch to ensure a safe development workflow.

Rules applied:

- Direct pushes to `main` are restricted
- Changes must be submitted through Pull Requests
- At least one approval is required before merging
- All conversations must be resolved before merging
