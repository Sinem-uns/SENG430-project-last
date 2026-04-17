'use client'

import * as React from 'react'
import { Search, BookOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface GlossaryEntry {
  term: string
  definition: string
  category: 'data' | 'model' | 'metrics' | 'ethics' | 'clinical'
}

const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Algorithm',
    definition:
      'A set of mathematical rules and instructions that a computer follows to learn patterns from data. In healthcare ML, algorithms learn from past patient data to make predictions about new patients. Different algorithms make different assumptions about how patterns in data are structured.',
    category: 'model',
  },
  {
    term: 'Training Data',
    definition:
      'The portion of a dataset used to teach the model to recognise patterns. The model adjusts its internal parameters based on training data. In clinical settings, training data should be representative of the patient population where the model will be used — otherwise predictions may be unreliable.',
    category: 'data',
  },
  {
    term: 'Test Data',
    definition:
      'A separate portion of data that the model has never seen during training. Test data is used to evaluate how well the model generalises to new, unseen patients. Performance on test data gives a realistic estimate of how the model would perform in practice.',
    category: 'data',
  },
  {
    term: 'Features',
    definition:
      'The input variables used by the model to make predictions — for example, blood pressure, age, or ejection fraction. Choosing clinically meaningful features is one of the most important steps in building a useful healthcare model. Poor feature selection can lead to misleading predictions.',
    category: 'data',
  },
  {
    term: 'Target Variable',
    definition:
      'The outcome the model is trying to predict — such as "readmission within 30 days" or "diabetes present". Everything else in the dataset becomes a potential feature. The target variable must be clearly defined and clinically meaningful.',
    category: 'data',
  },
  {
    term: 'Overfitting',
    definition:
      'When a model learns the training data too well — including random noise and specific quirks — and then performs poorly on new data. An overfitted model "memorises" rather than "generalises". In clinical terms, it would perform well on the original patient cohort but fail in a new hospital or patient group.',
    category: 'model',
  },
  {
    term: 'Underfitting',
    definition:
      'When a model is too simple to capture the underlying patterns in the data, resulting in poor performance even on training data. An underfitted model misses important clinical signals. It is often caused by too few features, too simple an algorithm, or very limited data.',
    category: 'model',
  },
  {
    term: 'Normalisation',
    definition:
      'A preprocessing step that rescales numerical features to a standard range (e.g. 0 to 1, or mean=0, std=1). This prevents features with large numerical ranges — such as creatinine vs. age — from dominating the model. Many algorithms (KNN, SVM, Logistic Regression) require normalisation to perform well.',
    category: 'data',
  },
  {
    term: 'Class Imbalance',
    definition:
      'When one outcome class is much rarer than the other in the dataset. For example, only 5% of patients may develop sepsis. A model that always predicts "no sepsis" would be 95% accurate but clinically useless. Class imbalance is very common in healthcare datasets because adverse outcomes are (fortunately) rare.',
    category: 'data',
  },
  {
    term: 'SMOTE',
    definition:
      'Synthetic Minority Over-sampling Technique — a method for addressing class imbalance by generating synthetic examples of the minority class (e.g. the "disease present" group). SMOTE creates new examples by interpolating between existing minority class examples, making the classes more balanced for training.',
    category: 'data',
  },
  {
    term: 'Sensitivity',
    definition:
      'Also called Recall or True Positive Rate. The proportion of actual positive cases (e.g. patients with disease) that the model correctly identifies. High sensitivity means few cases are missed. In clinical settings, high sensitivity is critical for screening tools — you want to catch as many true cases as possible, even if it means some false alarms.',
    category: 'metrics',
  },
  {
    term: 'Specificity',
    definition:
      'The proportion of actual negative cases (e.g. patients without disease) that the model correctly identifies as negative. High specificity means few false alarms. In clinical settings, high specificity is important when a false positive leads to harmful or expensive investigation. There is often a trade-off between sensitivity and specificity.',
    category: 'metrics',
  },
  {
    term: 'Precision',
    definition:
      'The proportion of positive predictions that are actually correct. Also called Positive Predictive Value (PPV). If a model flags 100 patients as high-risk, precision tells you what fraction of those 100 truly are high-risk. Low precision means many false alarms and can waste clinical resource.',
    category: 'metrics',
  },
  {
    term: 'F1 Score',
    definition:
      'The harmonic mean of Precision and Sensitivity (Recall). It balances both metrics into a single number, ranging from 0 to 1. Useful when both false positives and false negatives carry clinical cost. An F1 of 0.75 or above is generally considered reasonable for clinical risk tools.',
    category: 'metrics',
  },
  {
    term: 'AUC-ROC',
    definition:
      'Area Under the Receiver Operating Characteristic Curve. Measures how well the model distinguishes between positive and negative cases across all possible decision thresholds. A value of 0.5 is no better than chance (like flipping a coin); 1.0 is perfect. An AUC above 0.80 is generally considered good for clinical prediction models.',
    category: 'metrics',
  },
  {
    term: 'Confusion Matrix',
    definition:
      'A table showing how many predictions were correct or incorrect, broken down into True Positives (correctly predicted disease), True Negatives (correctly predicted no disease), False Positives (wrongly flagged as disease), and False Negatives (missed disease cases). It provides a complete picture of model errors at a chosen decision threshold.',
    category: 'metrics',
  },
  {
    term: 'Feature Importance',
    definition:
      'A score indicating how much each input variable (feature) contributed to the model\'s predictions. Higher importance means the model relies more heavily on that feature. In clinical practice, feature importances should align with clinical knowledge — unexpected results may indicate data issues or spurious correlations rather than genuine clinical relationships.',
    category: 'model',
  },
  {
    term: 'Hyperparameter',
    definition:
      'A configuration setting of the model that is set before training, not learned from data. Examples include the number of trees in a Random Forest (nTrees) or the regularisation strength (C) in Logistic Regression. Choosing good hyperparameters improves model performance. In practice, hyperparameter tuning is done by testing different values on a validation set.',
    category: 'model',
  },
  {
    term: 'Confidence Score',
    definition:
      'A probability estimate (0–100%) that indicates how certain the model is about its prediction. A confidence of 90% for a positive prediction means the model is highly confident the outcome will occur. However, confidence scores from uncalibrated models can be misleading — a stated 90% confidence may not actually correspond to 90% real-world accuracy.',
    category: 'model',
  },
  {
    term: 'Decision Boundary',
    definition:
      'The threshold or dividing line in the model\'s feature space that separates predicted classes. Points on one side are predicted as positive (e.g. disease present), points on the other as negative. The shape of the decision boundary depends on the algorithm — linear for Logistic Regression and linear SVM; more complex for Random Forests and RBF SVM.',
    category: 'model',
  },
  {
    term: 'Cross-Validation',
    definition:
      'A technique for evaluating model performance more reliably by splitting data into multiple folds and training/testing on different subsets. K-fold cross-validation trains the model K times, each time using a different fold as the test set. This reduces the variance in performance estimates compared to a single train/test split.',
    category: 'model',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  data: 'Data',
  model: 'ML Concepts',
  metrics: 'Performance Metrics',
  ethics: 'Ethics & Fairness',
  clinical: 'Clinical',
}

const CATEGORY_COLORS: Record<string, string> = {
  data: 'info',
  model: 'default',
  metrics: 'teal',
  ethics: 'warning',
  clinical: 'success',
}

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredEntries = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return GLOSSARY
    return GLOSSARY.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        CATEGORY_LABELS[entry.category]?.toLowerCase().includes(q)
    )
  }, [searchQuery])

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose()
      setSearchQuery('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Fixed header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5 text-brand-teal" />
              Help & Glossary
            </DialogTitle>
            <DialogDescription>
              Plain-language definitions of ML and clinical AI terms used in this tool.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Scrollable entries */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No terms found for "{searchQuery}".</p>
              <p className="text-xs mt-1">Try a different search term.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.term}
                className="rounded-lg border border-border-subtle bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-brand-navy leading-tight">
                    {entry.term}
                  </h3>
                  <Badge
                    variant={CATEGORY_COLORS[entry.category] as 'info' | 'default' | 'teal' | 'warning' | 'success'}
                    size="sm"
                    className="shrink-0"
                  >
                    {CATEGORY_LABELS[entry.category]}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {entry.definition}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-surface">
          <p className="text-xs text-muted-foreground text-center">
            {filteredEntries.length} of {GLOSSARY.length} terms
            {searchQuery && ` matching "${searchQuery}"`}
            {' · '}
            HEALTH-AI Erasmus+ KA220-HED Learning Tool
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
