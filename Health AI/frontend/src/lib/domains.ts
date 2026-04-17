import type { DomainConfig } from './types'

export const DOMAINS: DomainConfig[] = [
  // ============================================================
  // 1. CARDIOLOGY — Heart Failure 30-Day Readmission
  // ============================================================
  {
    id: 'cardiology',
    label: 'Heart Failure 30-Day Readmission',
    specialty: 'Cardiology',
    clinicalQuestion:
      'Can AI identify which heart failure patients are most likely to be readmitted to hospital within 30 days of discharge?',
    whyItMatters:
      '30-day readmissions after heart failure affect 20-25% of patients and cost over £3,000 per episode. Early identification enables targeted nurse follow-up calls, medication reviews, and community support.',
    patientPopulation: 'Adult patients discharged after acute heart failure admission',
    predictedOutcome: 'Readmission to hospital within 30 days',
    taskType: 'binary',
    datasetId: 'cardiology',
    targetColumn: 'readmission_30days',
    suggestedFeatures: [
      'age',
      'ejection_fraction',
      'serum_creatinine',
      'serum_sodium',
      'high_blood_pressure',
      'diabetes',
      'anaemia',
    ],
    featureLabels: {
      age: 'Patient Age',
      sex: 'Sex',
      ejection_fraction: 'Heart Pumping Efficiency (%)',
      serum_creatinine: 'Kidney Function (Creatinine)',
      serum_sodium: 'Sodium Level',
      high_blood_pressure: 'High Blood Pressure',
      diabetes: 'Diabetes',
      anaemia: 'Anaemia',
      smoking: 'Current Smoker',
      creatinine_phosphokinase: 'Heart Enzyme Level (CPK)',
      platelets: 'Platelet Count',
      follow_up_days: 'Days in Follow-up',
    },
    classLabels: ['No Readmission', '30-Day Readmission'],
    clinicalContextCopy:
      'Heart failure is one of the leading causes of hospital admissions in the UK. When patients are discharged, the risk of returning to hospital within 30 days is high. This AI model analyses clinical measurements taken during the admission — such as how well the heart is pumping, kidney function, and sodium levels — to estimate which patients face the highest risk of readmission. This information can help clinical teams prioritise follow-up calls and community support.',
    clinicalSenseCheck:
      'In this model, low ejection fraction (how hard the heart pumps) and elevated creatinine (a marker of kidney strain often worsened by heart failure) are typically the strongest predictors of readmission — which aligns well with clinical experience. Sodium imbalance also reflects fluid management difficulty, another known readmission driver.',
    subgroupFields: ['sex', 'high_blood_pressure', 'diabetes'],
    sampleDataSource:
      'Synthetic dataset based on published heart failure cohort schema (Chicco & Jurman 2020)',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 2. NEPHROLOGY — Chronic Kidney Disease
  // ============================================================
  {
    id: 'nephrology',
    label: 'Chronic Kidney Disease Detection',
    specialty: 'Nephrology',
    clinicalQuestion:
      'Can AI predict whether a patient has chronic kidney disease from blood and urine test results?',
    whyItMatters:
      'CKD affects 10% of the global population and is often silent until advanced stages. Earlier detection through pattern recognition in routine tests can enable earlier nephrology referral and slow disease progression.',
    patientPopulation: 'Adults presenting to primary care or nephrology outpatient clinics',
    predictedOutcome: 'Presence of chronic kidney disease (CKD)',
    taskType: 'binary',
    datasetId: 'nephrology',
    targetColumn: 'classification',
    suggestedFeatures: [
      'age',
      'blood_pressure',
      'haemoglobin',
      'packed_cell_volume',
      'white_blood_cell_count',
      'red_blood_cell_count',
      'hypertension',
      'diabetes_mellitus',
    ],
    featureLabels: {
      age: 'Age',
      blood_pressure: 'Blood Pressure',
      haemoglobin: 'Haemoglobin Level',
      packed_cell_volume: 'Packed Cell Volume',
      white_blood_cell_count: 'White Blood Cell Count',
      red_blood_cell_count: 'Red Blood Cell Count',
      hypertension: 'Hypertension',
      diabetes_mellitus: 'Diabetes',
      albumin: 'Albumin in Urine',
      specific_gravity: 'Urine Specific Gravity',
    },
    classLabels: ['No CKD', 'CKD'],
    clinicalContextCopy:
      'Chronic kidney disease develops silently over years, and many patients are unaware until significant damage has occurred. This model examines blood counts, urine markers, and known risk factors such as hypertension and diabetes to flag patients who may have CKD. Identifying CKD early allows clinicians to slow progression through medication, dietary advice, and closer monitoring.',
    clinicalSenseCheck:
      'Low haemoglobin and anaemia are hallmark features of CKD — the kidneys produce erythropoietin. Hypertension and diabetes are the top two causes of CKD worldwide, so their high importance here is clinically expected.',
    subgroupFields: ['hypertension', 'diabetes_mellitus'],
    sampleDataSource: 'Synthetic dataset based on UCI Chronic Kidney Disease schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 3. BREAST CANCER — Oncology
  // ============================================================
  {
    id: 'breast_cancer',
    label: 'Breast Cancer Tumour Classification',
    specialty: 'Oncology',
    clinicalQuestion:
      'Can AI classify breast tumour characteristics as malignant or benign based on cell measurement features?',
    whyItMatters:
      'Accurate and rapid classification of breast tumours reduces diagnostic delays and can assist pathologists in prioritising urgent cases. AI models trained on cell nuclei measurements offer a consistent second opinion.',
    patientPopulation: 'Patients referred for breast biopsy or fine-needle aspiration',
    predictedOutcome: 'Tumour classification: benign or malignant',
    taskType: 'binary',
    datasetId: 'breast_cancer',
    targetColumn: 'diagnosis',
    suggestedFeatures: [
      'mean_radius',
      'mean_texture',
      'mean_perimeter',
      'mean_area',
      'mean_smoothness',
      'worst_radius',
      'worst_texture',
      'worst_perimeter',
      'worst_area',
      'mean_concavity',
    ],
    featureLabels: {
      mean_radius: 'Mean Tumour Radius',
      mean_texture: 'Mean Texture Score',
      mean_perimeter: 'Mean Tumour Perimeter',
      mean_area: 'Mean Tumour Area',
      mean_smoothness: 'Mean Cell Smoothness',
      worst_radius: 'Worst Tumour Radius',
      worst_texture: 'Worst Texture Score',
      worst_perimeter: 'Worst Perimeter',
      worst_area: 'Worst Area',
      mean_concavity: 'Mean Concavity Score',
      mean_compactness: 'Mean Compactness',
      mean_concave_points: 'Mean Concave Points',
      worst_smoothness: 'Worst Smoothness',
      worst_compactness: 'Worst Compactness',
      worst_concavity: 'Worst Concavity',
    },
    classLabels: ['Benign', 'Malignant'],
    clinicalContextCopy:
      'When a breast lump is biopsied, the sample is analysed under a microscope. Digital measurements of cell nuclei — such as size, shape, and texture — can reveal patterns associated with malignancy. This model uses those measurements to classify tumours. It can serve as a learning tool to understand how AI approaches pathological classification tasks.',
    clinicalSenseCheck:
      "Worst radius, worst perimeter and worst area tend to dominate — larger, more irregular tumours are more likely to be malignant. Mean concavity and concave points reflect cellular irregularity, a hallmark of malignant transformation.",
    subgroupFields: [],
    sampleDataSource: 'Synthetic dataset based on Wisconsin Breast Cancer Diagnostic schema (UCI)',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 4. PARKINSON'S — Neurology
  // ============================================================
  {
    id: 'parkinsons',
    label: "Parkinson's Disease Voice Detection",
    specialty: 'Neurology',
    clinicalQuestion:
      "Can AI detect early signs of Parkinson's disease from voice recording measurements?",
    whyItMatters:
      "Parkinson's affects 1 in 500 people in the UK and diagnosis is often delayed by years. Voice biomarkers captured from simple recordings could enable earlier detection and referral to specialist services.",
    patientPopulation:
      "Adults with potential early motor symptoms, screened in primary care or neurology outpatient settings",
    predictedOutcome: "Presence of Parkinson's disease",
    taskType: 'binary',
    datasetId: 'parkinsons',
    targetColumn: 'status',
    suggestedFeatures: [
      'MDVP_Fo_Hz',
      'MDVP_Jitter_pct',
      'MDVP_Shimmer',
      'HNR',
      'RPDE',
      'DFA',
      'PPE',
    ],
    featureLabels: {
      MDVP_Fo_Hz: 'Average Vocal Pitch',
      MDVP_Fhi_Hz: 'Maximum Vocal Pitch',
      MDVP_Flo_Hz: 'Minimum Vocal Pitch',
      MDVP_Jitter_pct: 'Vocal Tremor (Jitter)',
      MDVP_Jitter_Abs: 'Absolute Jitter',
      MDVP_RAP: 'Relative Average Perturbation',
      MDVP_PPQ: 'Period Perturbation Quotient',
      Jitter_DDP: 'Differential Perturbation',
      MDVP_Shimmer: 'Voice Amplitude Variation',
      MDVP_Shimmer_dB: 'Shimmer in Decibels',
      NHR: 'Noise-to-Harmonics Ratio',
      HNR: 'Harmonics-to-Noise Ratio',
      RPDE: 'Vocal Complexity',
      DFA: 'Signal Fractality',
      spread1: 'Pitch Spread Low',
      spread2: 'Pitch Spread High',
      D2: 'Correlation Dimension',
      PPE: 'Pitch Period Entropy',
    },
    classLabels: ['Healthy', "Parkinson's"],
    clinicalContextCopy:
      "Parkinson's disease causes subtle changes in how a person speaks — tremor, reduced volume, and altered pitch patterns. This model analyses 18 acoustic measurements taken from sustained vowel sounds to classify whether the speaker shows signs of Parkinson's. Voice analysis is a non-invasive, low-cost screening approach being explored in clinical research.",
    clinicalSenseCheck:
      "PPE (Pitch Period Entropy) and spread1/2 measure vocal irregularity that Parkinson's patients exhibit due to motor control deficits. HNR reflects how 'clean' the voice signal is — lower values indicate noise from tremor.",
    subgroupFields: [],
    sampleDataSource:
      "Synthetic dataset based on Oxford Parkinson's Disease Detection schema (UCI)",
    estimatedMinutes: 35,
  },

  // ============================================================
  // 5. DIABETES — Endocrinology
  // ============================================================
  {
    id: 'diabetes',
    label: 'Type 2 Diabetes Prediction',
    specialty: 'Endocrinology',
    clinicalQuestion:
      'Can AI predict whether a patient will develop type 2 diabetes based on clinical and physiological measurements?',
    whyItMatters:
      'Type 2 diabetes affects over 4.9 million people in the UK. Early identification of high-risk patients allows preventive interventions — lifestyle modification, dietary advice, and monitoring — that can delay or prevent onset.',
    patientPopulation: 'Adults attending primary care with metabolic risk factors',
    predictedOutcome: 'Development of type 2 diabetes',
    taskType: 'binary',
    datasetId: 'diabetes',
    targetColumn: 'outcome',
    suggestedFeatures: [
      'glucose',
      'bmi',
      'age',
      'blood_pressure',
      'insulin',
      'diabetes_pedigree_function',
    ],
    featureLabels: {
      pregnancies: 'Number of Pregnancies',
      glucose: 'Plasma Glucose Level',
      blood_pressure: 'Diastolic Blood Pressure',
      skin_thickness: 'Triceps Skin Fold Thickness',
      insulin: '2-Hour Serum Insulin',
      bmi: 'Body Mass Index',
      diabetes_pedigree_function: 'Family History Score',
      age: 'Age',
    },
    classLabels: ['No Diabetes', 'Diabetes'],
    clinicalContextCopy:
      'Type 2 diabetes develops gradually as the body becomes resistant to insulin. This model uses routine clinical measurements — blood glucose, BMI, blood pressure, and family history — to estimate a patient\'s risk of developing diabetes. Understanding how AI weighs these factors can help clinicians discuss risk with patients in a more data-informed way.',
    clinicalSenseCheck:
      'Plasma glucose is the dominant predictor — consistent with clinical criteria for diabetes diagnosis (fasting glucose ≥ 7 mmol/L). BMI and insulin resistance follow, reflecting metabolic syndrome. The diabetes pedigree function captures hereditary risk.',
    subgroupFields: ['pregnancies'],
    sampleDataSource: 'Synthetic dataset based on Pima Indians Diabetes Database schema (UCI)',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 6. SEPSIS — ICU
  // ============================================================
  {
    id: 'sepsis',
    label: 'ICU Sepsis Onset Prediction',
    specialty: 'Intensive Care / Critical Care',
    clinicalQuestion:
      'Can AI predict sepsis onset in ICU patients from vital signs and laboratory values?',
    whyItMatters:
      'Sepsis kills over 48,000 people in England each year. Every hour of delayed treatment increases mortality by 7%. Early prediction algorithms could trigger earlier antibiotic administration and escalation of care.',
    patientPopulation: 'Adult patients admitted to intensive care units',
    predictedOutcome: 'Sepsis onset during ICU stay',
    taskType: 'binary',
    datasetId: 'sepsis',
    targetColumn: 'sepsis',
    suggestedFeatures: [
      'sofa_score',
      'lactate',
      'heart_rate',
      'temperature',
      'wbc_count',
      'respiratory_rate',
    ],
    featureLabels: {
      age: 'Age',
      heart_rate: 'Heart Rate (bpm)',
      respiratory_rate: 'Respiratory Rate',
      temperature: 'Body Temperature (°C)',
      systolic_bp: 'Systolic Blood Pressure',
      wbc_count: 'White Cell Count (×10⁹/L)',
      lactate: 'Blood Lactate Level',
      sofa_score: 'SOFA Organ Failure Score',
      mechanical_ventilation: 'On Ventilator',
      icu_day: 'ICU Day Number',
    },
    classLabels: ['No Sepsis', 'Sepsis'],
    clinicalContextCopy:
      'Sepsis is a life-threatening emergency caused by the body\'s response to infection. In the ICU, early detection is critical but challenging — signs can overlap with other conditions. This model analyses vital signs and laboratory values to flag patients at high risk of developing sepsis, potentially hours before clinical recognition.',
    clinicalSenseCheck:
      'SOFA score and lactate are the most diagnostically significant features — both are included in the Sepsis-3 definition. Elevated lactate indicates tissue hypoperfusion. High respiratory rate and fever reflect systemic inflammatory response.',
    subgroupFields: ['mechanical_ventilation'],
    sampleDataSource: 'Synthetic dataset based on ICU sepsis clinical schema',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 7. FETAL HEALTH — Obstetrics
  // ============================================================
  {
    id: 'fetal_health',
    label: 'Fetal Health CTG Classification',
    specialty: 'Obstetrics & Midwifery',
    clinicalQuestion:
      'Can AI classify fetal wellbeing as Normal, Suspect, or Pathological from cardiotocography (CTG) readings?',
    whyItMatters:
      'CTG interpretation is highly subjective and inter-observer variability is well-documented. AI classification tools could provide a consistent second opinion, particularly in under-resourced maternity settings.',
    patientPopulation:
      'Pregnant women undergoing continuous fetal monitoring in labour or antenatal assessment',
    predictedOutcome: 'Fetal health classification: Normal, Suspect, or Pathological',
    taskType: 'multiclass',
    datasetId: 'fetal_health',
    targetColumn: 'fetal_health',
    suggestedFeatures: [
      'baseline_value',
      'accelerations',
      'abnormal_short_term_variability',
      'prolongued_decelerations',
      'severe_decelerations',
      'histogram_mean',
    ],
    featureLabels: {
      baseline_value: 'Fetal Heart Rate Baseline',
      accelerations: 'Accelerations per Second',
      fetal_movement: 'Fetal Movements per Second',
      uterine_contractions: 'Uterine Contractions per Second',
      light_decelerations: 'Light Decelerations',
      severe_decelerations: 'Severe Decelerations',
      prolongued_decelerations: 'Prolonged Decelerations',
      abnormal_short_term_variability: 'Abnormal Short-Term Variability (%)',
      mean_value_of_short_term_variability: 'Mean Short-Term Variability',
      histogram_mean: 'FHR Histogram Mean',
      histogram_variance: 'FHR Histogram Variance',
    },
    classLabels: ['Normal', 'Suspect', 'Pathological'],
    clinicalContextCopy:
      "Cardiotocography (CTG) traces record the fetal heart rate and uterine contractions during labour. Interpreting CTG traces requires skill and experience, and disagreements between clinicians are common. This AI model learns patterns from CTG measurements to classify each trace as Normal, Suspect, or Pathological — mirroring the FIGO classification system used in practice.",
    clinicalSenseCheck:
      "Abnormal short-term variability percentage and prolonged decelerations are the strongest signals of fetal compromise — consistent with midwifery and obstetric training for CTG interpretation. A 'flat' trace (low variability) with late decelerations indicates potential uteroplacental insufficiency.",
    subgroupFields: [],
    sampleDataSource: 'Synthetic dataset based on UCI Fetal Health Classification schema',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 8. MENTAL HEALTH
  // ============================================================
  {
    id: 'mental_health',
    label: 'Mental Health Crisis Risk',
    specialty: 'Mental Health / Psychiatry',
    clinicalQuestion:
      'Can AI identify patients at elevated risk of mental health crisis or deterioration from screening scores and social factors?',
    whyItMatters:
      'Mental health crises are often preceded by detectable deterioration in symptoms and social function. Early flagging enables proactive care coordinator contact and community mental health intervention.',
    patientPopulation: 'Adults on community mental health caseloads or in primary care with known mental health conditions',
    predictedOutcome: 'Mental health crisis or significant deterioration within 90 days',
    taskType: 'binary',
    datasetId: 'mental_health',
    targetColumn: 'crisis_flag',
    suggestedFeatures: [
      'phq9_score',
      'gad7_score',
      'sleep_hours',
      'social_support',
      'prior_episodes',
      'medication_adherence',
    ],
    featureLabels: {
      phq9_score: 'PHQ-9 Depression Score',
      gad7_score: 'GAD-7 Anxiety Score',
      sleep_hours: 'Average Sleep (hours/night)',
      social_support: 'Social Support Score',
      prior_episodes: 'Prior Crisis Episodes',
      medication_adherence: 'Medication Adherence (%)',
      physical_activity: 'Physical Activity (days/week)',
      life_events_score: 'Recent Life Events Score',
    },
    classLabels: ['Stable', 'Crisis Risk'],
    clinicalContextCopy:
      'Mental health crises rarely occur without warning. This model integrates validated screening scores (PHQ-9, GAD-7), sleep patterns, social support, and medication adherence to identify patients whose trajectory suggests rising risk. It demonstrates how structured clinical data can support proactive, preventive mental healthcare.',
    clinicalSenseCheck:
      'PHQ-9 and GAD-7 scores carry the most weight, as both are validated instruments directly measuring symptom severity. Prior crisis episodes are a strong predictor of future episodes — consistent with the recurrent nature of many mental health conditions. Poor medication adherence frequently precedes relapse.',
    subgroupFields: ['prior_episodes'],
    sampleDataSource: 'Synthetic dataset based on community mental health screening schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 9. PULMONOLOGY — COPD
  // ============================================================
  {
    id: 'pulmonology',
    label: 'COPD Acute Exacerbation Prediction',
    specialty: 'Respiratory / Pulmonology',
    clinicalQuestion:
      'Can AI predict which COPD patients are at highest risk of an acute exacerbation in the next 90 days?',
    whyItMatters:
      'Acute exacerbations of COPD are the leading cause of emergency admissions in the UK. Identifying high-risk patients enables pulmonary rehabilitation referrals, rescue medication prescribing, and vaccination uptake.',
    patientPopulation: 'Adults with diagnosed COPD in primary care or respiratory outpatient follow-up',
    predictedOutcome: 'Acute COPD exacerbation within 90 days',
    taskType: 'binary',
    datasetId: 'pulmonology',
    targetColumn: 'exacerbation',
    suggestedFeatures: [
      'fev1_pct',
      'fvc_pct',
      'exacerbations_prev_year',
      'mrc_dyspnoea_score',
      'sao2_resting',
    ],
    featureLabels: {
      fev1_pct: 'FEV1 (% Predicted)',
      fvc_pct: 'FVC (% Predicted)',
      exacerbations_prev_year: 'Exacerbations in Past Year',
      smoking_pack_years: 'Smoking Pack-Years',
      mrc_dyspnoea_score: 'MRC Dyspnoea Scale Score',
      bmi: 'Body Mass Index',
      sao2_resting: 'Resting Oxygen Saturation (%)',
      eosinophil_count: 'Blood Eosinophil Count',
    },
    classLabels: ['No Exacerbation', 'Exacerbation'],
    clinicalContextCopy:
      'COPD exacerbations drive rapid lung function decline and account for enormous NHS costs. This model uses spirometry, symptom burden (MRC), oxygenation, and prior exacerbation history to estimate 90-day risk. Identifying "frequent exacerbator" phenotypes allows targeted preventive strategies.',
    clinicalSenseCheck:
      'Prior exacerbation history is the single strongest predictor — "past exacerbator predicts future exacerbator" is well-established in COPD management guidelines. Low FEV1% reflects severity of airflow obstruction. Eosinophil count predicts response to inhaled corticosteroids and exacerbation risk in specific phenotypes.',
    subgroupFields: ['smoking_pack_years'],
    sampleDataSource: 'Synthetic dataset based on COPD respiratory clinical schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 10. HAEMATOLOGY — Anaemia
  // ============================================================
  {
    id: 'haematology',
    label: 'Anaemia Diagnosis',
    specialty: 'Haematology',
    clinicalQuestion:
      'Can AI diagnose anaemia from full blood count parameters and patient demographics?',
    whyItMatters:
      'Anaemia affects 1.62 billion people globally and is often underdiagnosed in primary care. Automated flagging from routine blood tests can ensure timely investigation and treatment.',
    patientPopulation: 'Adults presenting for routine or symptomatic blood testing in primary or secondary care',
    predictedOutcome: 'Anaemia diagnosis (haemoglobin below threshold)',
    taskType: 'binary',
    datasetId: 'haematology',
    targetColumn: 'anaemia',
    suggestedFeatures: [
      'haemoglobin',
      'rbc_count',
      'mcv',
      'mchc',
      'mch',
      'age',
    ],
    featureLabels: {
      haemoglobin: 'Haemoglobin (g/dL)',
      rbc_count: 'Red Blood Cell Count',
      mcv: 'Mean Corpuscular Volume (MCV)',
      mchc: 'Mean Corpuscular Haemoglobin Concentration',
      mch: 'Mean Corpuscular Haemoglobin',
      wbc: 'White Blood Cell Count',
      platelets: 'Platelet Count',
      age: 'Age',
      sex: 'Sex',
    },
    classLabels: ['No Anaemia', 'Anaemia'],
    clinicalContextCopy:
      'Anaemia is defined by haemoglobin below the reference range and has many causes — iron deficiency, chronic disease, vitamin B12 deficiency, and more. Full blood count parameters such as MCV, MCH, and MCHC help differentiate anaemia types. This model classifies whether a patient is anaemic based on FBC results.',
    clinicalSenseCheck:
      'Haemoglobin is the direct diagnostic marker — it dominates the model by design. MCV distinguishes microcytic (iron deficiency) from macrocytic (B12/folate) anaemia. Sex is important as reference ranges differ between males and females.',
    subgroupFields: ['sex'],
    sampleDataSource: 'Synthetic dataset based on haematology full blood count schema',
    estimatedMinutes: 30,
  },

  // ============================================================
  // 11. DERMATOLOGY — Skin Lesion
  // ============================================================
  {
    id: 'dermatology',
    label: 'Skin Lesion Classification',
    specialty: 'Dermatology',
    clinicalQuestion:
      'Can AI classify skin lesions as benign, pre-malignant, or malignant from clinical measurement features?',
    whyItMatters:
      'Skin cancer is the most common cancer in the UK. Early classification of lesions reduces unnecessary biopsies for benign lesions while ensuring pre-malignant and malignant lesions receive timely excision.',
    patientPopulation: 'Adults referred to dermatology for lesion assessment',
    predictedOutcome: 'Skin lesion classification: benign, pre-malignant, or malignant',
    taskType: 'multiclass',
    datasetId: 'dermatology',
    targetColumn: 'lesion_class',
    suggestedFeatures: [
      'lesion_area_mm2',
      'border_irregularity',
      'color_variation',
      'asymmetry_score',
      'elevation',
    ],
    featureLabels: {
      lesion_area_mm2: 'Lesion Area (mm²)',
      border_irregularity: 'Border Irregularity Score',
      color_variation: 'Colour Variation Score',
      asymmetry_score: 'Asymmetry Score',
      elevation: 'Lesion Elevation',
      bleeding: 'Bleeding History',
      duration_months: 'Duration (months)',
    },
    classLabels: ['Benign', 'Pre-malignant', 'Malignant'],
    clinicalContextCopy:
      'Dermatologists use the ABCDE criteria — Asymmetry, Border, Colour, Diameter, Evolution — to assess skin lesions. This model quantifies those criteria into numerical scores and uses them to classify lesions. It illustrates how structured clinical assessment frameworks translate into machine learning features.',
    clinicalSenseCheck:
      'Asymmetry and border irregularity are the dominant features, mirroring the ABCDE rule. Colour variation (multiple shades within a lesion) is a strong malignant indicator. Longer duration without change suggests a more benign course.',
    subgroupFields: [],
    sampleDataSource: 'Synthetic dataset based on dermatology clinical assessment schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 12. OPHTHALMOLOGY — Diabetic Retinopathy
  // ============================================================
  {
    id: 'ophthalmology',
    label: 'Diabetic Retinopathy Screening',
    specialty: 'Ophthalmology',
    clinicalQuestion:
      'Can AI predict the presence of diabetic retinopathy from patient clinical data and retinal examination findings?',
    whyItMatters:
      'Diabetic retinopathy is the leading cause of preventable blindness in working-age adults in the UK. Annual screening is recommended but attendance is inconsistent. Risk stratification could prioritise those most urgently needing assessment.',
    patientPopulation: 'Adults with type 1 or type 2 diabetes in retinal screening programmes',
    predictedOutcome: 'Diabetic retinopathy present',
    taskType: 'binary',
    datasetId: 'ophthalmology',
    targetColumn: 'retinopathy',
    suggestedFeatures: [
      'diabetes_duration',
      'hba1c',
      'microaneurysms',
      'hard_exudates',
      'blood_pressure',
    ],
    featureLabels: {
      diabetes_duration: 'Duration of Diabetes (years)',
      hba1c: 'HbA1c (%)',
      blood_pressure: 'Blood Pressure',
      age: 'Age',
      bmi: 'BMI',
      microaneurysms: 'Microaneurysm Count',
      hard_exudates: 'Hard Exudates Present',
      soft_exudates: 'Soft Exudates Present',
    },
    classLabels: ['No Retinopathy', 'Retinopathy'],
    clinicalContextCopy:
      'Diabetic retinopathy develops when high blood glucose damages the tiny blood vessels in the retina. Early signs — microaneurysms and exudates — are visible on fundus photography. This model combines metabolic control (HbA1c), disease duration, and retinal findings to predict retinopathy presence.',
    clinicalSenseCheck:
      'Diabetes duration and HbA1c are the strongest predictors — sustained hyperglycaemia is the primary driver of retinal damage. Microaneurysms are often the first visible sign, making their count a direct predictor. Good glycaemic control markedly reduces risk.',
    subgroupFields: ['diabetes_duration'],
    sampleDataSource: 'Synthetic dataset based on diabetic retinopathy screening schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 13. ORTHOPAEDICS — Spine
  // ============================================================
  {
    id: 'orthopaedics',
    label: 'Spinal Condition Classification',
    specialty: 'Orthopaedics / Spinal Surgery',
    clinicalQuestion:
      'Can AI classify spinal conditions as Normal, Disc Hernia, or Spondylolisthesis from biomechanical pelvis measurements?',
    whyItMatters:
      'Delayed diagnosis of spinal conditions leads to chronic pain and disability. Objective biomechanical measurements from imaging can support triage decisions in orthopaedic and physiotherapy services.',
    patientPopulation: 'Adults presenting with lower back pain referred for orthopaedic assessment',
    predictedOutcome: 'Spinal condition classification: Normal, Disc Hernia, or Spondylolisthesis',
    taskType: 'multiclass',
    datasetId: 'orthopaedics',
    targetColumn: 'class',
    suggestedFeatures: [
      'pelvic_incidence',
      'pelvic_tilt',
      'lumbar_lordosis_angle',
      'sacral_slope',
      'pelvic_radius',
    ],
    featureLabels: {
      pelvic_incidence: 'Pelvic Incidence (degrees)',
      pelvic_tilt: 'Pelvic Tilt (degrees)',
      lumbar_lordosis_angle: 'Lumbar Lordosis Angle',
      sacral_slope: 'Sacral Slope (degrees)',
      pelvic_radius: 'Pelvic Radius (mm)',
      spondylolisthesis_grade: 'Spondylolisthesis Grade',
    },
    classLabels: ['Normal', 'Disc Hernia', 'Spondylolisthesis'],
    clinicalContextCopy:
      'Pelvic and lumbar spine alignment measurements taken from X-rays or MRI can reveal characteristic patterns associated with disc herniation and spondylolisthesis. This model classifies patients into three categories using six biomechanical parameters, illustrating how radiological measurements support diagnostic classification.',
    clinicalSenseCheck:
      'Spondylolisthesis grade is the most discriminating feature for that class — it directly measures vertebral slippage. Pelvic incidence and sacral slope are known to be elevated in spondylolisthesis. Disc herniation shows distinct lumbar lordosis patterns.',
    subgroupFields: [],
    sampleDataSource: 'Synthetic dataset based on UCI Vertebral Column Data Set schema',
    estimatedMinutes: 30,
  },

  // ============================================================
  // 14. ARRHYTHMIA — ECG
  // ============================================================
  {
    id: 'arrhythmia',
    label: 'Cardiac Arrhythmia Classification',
    specialty: 'Cardiology / Electrophysiology',
    clinicalQuestion:
      'Can AI classify cardiac arrhythmias from ECG interval measurements and axis data?',
    whyItMatters:
      'Arrhythmia misclassification on ECG review is common, particularly in time-pressured emergency settings. AI-assisted classification could reduce delays in initiating appropriate rhythm management.',
    patientPopulation: 'Adults presenting with palpitations, syncope, or for routine ECG in cardiology',
    predictedOutcome: 'Arrhythmia classification: Normal, Arrhythmia Class A, Class B, or Class C',
    taskType: 'multiclass',
    datasetId: 'arrhythmia',
    targetColumn: 'arrhythmia_class',
    suggestedFeatures: [
      'heart_rate',
      'pr_interval',
      'qrs_duration',
      'qt_interval',
      'qrs_axis',
    ],
    featureLabels: {
      heart_rate: 'Heart Rate (bpm)',
      pr_interval: 'PR Interval (ms)',
      qrs_duration: 'QRS Duration (ms)',
      qt_interval: 'QT Interval (ms)',
      st_segment: 'ST Segment Deviation',
      p_axis: 'P Wave Axis (degrees)',
      qrs_axis: 'QRS Axis (degrees)',
    },
    classLabels: ['Normal', 'Class A Arrhythmia', 'Class B Arrhythmia', 'Class C Arrhythmia'],
    clinicalContextCopy:
      'The ECG records the electrical activity of the heart. Intervals such as PR, QRS, and QT reflect conduction timing through different heart structures. Abnormalities in these intervals characterise different arrhythmias. This model classifies ECG patterns into arrhythmia types using standard ECG measurement features.',
    clinicalSenseCheck:
      'QRS duration is the most discriminating feature — broad complex tachycardias (QRS > 120ms) suggest ventricular origin. PR prolongation indicates heart block. QT interval prolongation predicts risk of Torsades de Pointes. Heart rate and axis deviation provide additional classification power.',
    subgroupFields: [],
    sampleDataSource: 'Synthetic dataset based on UCI Cardiac Arrhythmia Database schema',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 15. CERVICAL CANCER — Oncology
  // ============================================================
  {
    id: 'cervical_cancer',
    label: 'Cervical Cancer Risk Prediction',
    specialty: 'Oncology / Gynaecology',
    clinicalQuestion:
      'Can AI predict positive cervical cancer biopsy results from patient risk factors and behavioural history?',
    whyItMatters:
      'Cervical cancer is largely preventable through screening and vaccination. Risk stratification tools can help identify women who may benefit from earlier colposcopy referral based on cumulative risk factors.',
    patientPopulation: 'Women attending colposcopy or gynaecology outpatient services',
    predictedOutcome: 'Positive biopsy for cervical cancer',
    taskType: 'binary',
    datasetId: 'cervical_cancer',
    targetColumn: 'biopsy',
    suggestedFeatures: [
      'age',
      'num_sexual_partners',
      'smokes_pack_years',
      'hormonal_contraceptives_years',
      'stds_count',
    ],
    featureLabels: {
      age: 'Age',
      num_sexual_partners: 'Number of Sexual Partners',
      first_sexual_intercourse_age: 'Age at First Intercourse',
      num_pregnancies: 'Number of Pregnancies',
      smokes_pack_years: 'Smoking Pack-Years',
      hormonal_contraceptives_years: 'Hormonal Contraceptive Use (years)',
      iud_years: 'IUD Use (years)',
      stds_count: 'Number of STI Diagnoses',
    },
    classLabels: ['Biopsy Negative', 'Biopsy Positive'],
    clinicalContextCopy:
      "Cervical cancer risk is strongly associated with HPV infection, which is related to sexual history, smoking, and immune status. This model uses established epidemiological risk factors to predict biopsy outcome. It is intended as an educational tool to explore how risk factor patterns interact — not as a clinical screening replacement.",
    clinicalSenseCheck:
      'STI count and number of sexual partners reflect HPV exposure risk. Smoking increases cervical cancer risk by impairing local immune surveillance. Long-term hormonal contraceptive use is a modest independent risk factor. Age at first intercourse reflects duration of potential HPV exposure.',
    subgroupFields: ['smokes_pack_years'],
    sampleDataSource: 'Synthetic dataset based on UCI Cervical Cancer Risk Factors schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 16. THYROID — Endocrinology
  // ============================================================
  {
    id: 'thyroid',
    label: 'Thyroid Dysfunction Detection',
    specialty: 'Endocrinology / General Practice',
    clinicalQuestion:
      'Can AI detect thyroid dysfunction from thyroid function tests and patient demographics?',
    whyItMatters:
      'Thyroid dysfunction is common and frequently under-detected. Hypothyroidism affects approximately 2% of the population, causing fatigue and metabolic disturbance. Hyperthyroidism carries cardiovascular risks. Pattern recognition in TFTs can support earlier diagnosis.',
    patientPopulation: 'Adults undergoing thyroid function testing in primary or secondary care',
    predictedOutcome: 'Thyroid dysfunction present (hypo- or hyperthyroidism)',
    taskType: 'binary',
    datasetId: 'thyroid',
    targetColumn: 'thyroid_class',
    suggestedFeatures: [
      'tsh',
      't3',
      'tt4',
      't4u',
      'fti',
      'age',
    ],
    featureLabels: {
      age: 'Age',
      tsh: 'TSH Level',
      t3: 'T3 Level',
      tt4: 'Total T4 Level',
      t4u: 'T4 Uptake',
      fti: 'Free Thyroxine Index',
      sex: 'Sex',
      on_thyroxine: 'On Thyroxine',
      pregnant: 'Currently Pregnant',
    },
    classLabels: ['Normal', 'Thyroid Dysfunction'],
    clinicalContextCopy:
      'The thyroid produces hormones that regulate metabolism. TSH (thyroid-stimulating hormone) is the primary screening test — elevated TSH indicates hypothyroidism, suppressed TSH suggests hyperthyroidism. This model analyses a panel of thyroid function tests to classify whether dysfunction is present.',
    clinicalSenseCheck:
      'TSH is by far the dominant predictor — it is the most sensitive marker for thyroid dysfunction. FTI (free thyroxine index) and TT4 confirm the direction of dysfunction. Pregnancy significantly alters TFT reference ranges, which is why it features as an important variable.',
    subgroupFields: ['sex', 'pregnant'],
    sampleDataSource: 'Synthetic dataset based on UCI Thyroid Disease schema',
    estimatedMinutes: 30,
  },

  // ============================================================
  // 17. STROKE — Cardiology / Neurology
  // ============================================================
  {
    id: 'stroke',
    label: 'Stroke Risk Prediction',
    specialty: 'Cardiology / Neurology',
    clinicalQuestion:
      'Can AI predict stroke occurrence based on patient demographics, comorbidities, and lifestyle factors?',
    whyItMatters:
      'Stroke is the fourth leading cause of death in the UK and a major cause of disability. Risk stratification tools support primary prevention decisions — anticoagulation initiation, blood pressure control targets, and lifestyle counselling.',
    patientPopulation: 'Adults in primary care with cardiovascular risk factors',
    predictedOutcome: 'Stroke occurrence',
    taskType: 'binary',
    datasetId: 'stroke',
    targetColumn: 'stroke',
    suggestedFeatures: [
      'age',
      'hypertension',
      'heart_disease',
      'avg_glucose_level',
      'bmi',
    ],
    featureLabels: {
      age: 'Age',
      hypertension: 'Hypertension',
      heart_disease: 'Heart Disease',
      avg_glucose_level: 'Average Glucose Level',
      bmi: 'Body Mass Index',
      smoking_status: 'Smoking Status',
      gender: 'Gender',
      ever_married: 'Ever Married',
      work_type: 'Work Type',
    },
    classLabels: ['No Stroke', 'Stroke'],
    clinicalContextCopy:
      'Stroke risk accumulates over time as vascular risk factors damage blood vessels and the heart. The most important modifiable risk factors — hypertension, diabetes (reflected by glucose), atrial fibrillation, and smoking — are captured in this model alongside age and demographic factors.',
    clinicalSenseCheck:
      'Age is the strongest non-modifiable predictor — stroke incidence doubles each decade after 55. Hypertension is the single most important modifiable risk factor, contributing to both ischaemic and haemorrhagic stroke. Elevated glucose reflects diabetes-related vascular damage.',
    subgroupFields: ['gender', 'hypertension'],
    sampleDataSource: 'Synthetic dataset based on stroke prediction dataset schema',
    estimatedMinutes: 35,
  },

  // ============================================================
  // 18. LIVER — Hepatology
  // ============================================================
  {
    id: 'liver',
    label: 'Liver Disease Detection',
    specialty: 'Hepatology / Gastroenterology',
    clinicalQuestion:
      'Can AI predict liver disease from liver function tests and patient demographics?',
    whyItMatters:
      'Liver disease often presents late when fibrosis or cirrhosis is advanced. Pattern recognition in routine LFTs could flag abnormal results warranting early hepatology referral, especially in the context of alcohol use and metabolic syndrome.',
    patientPopulation: 'Adults undergoing liver function testing in primary or secondary care',
    predictedOutcome: 'Liver disease present',
    taskType: 'binary',
    datasetId: 'liver',
    targetColumn: 'liver_disease',
    suggestedFeatures: [
      'total_bilirubin',
      'direct_bilirubin',
      'alkaline_phosphotase',
      'alamine_aminotransferase',
      'aspartate_aminotransferase',
      'albumin',
    ],
    featureLabels: {
      age: 'Age',
      sex: 'Sex',
      total_bilirubin: 'Total Bilirubin',
      direct_bilirubin: 'Direct Bilirubin',
      alkaline_phosphotase: 'Alkaline Phosphatase (ALP)',
      alamine_aminotransferase: 'ALT (Alanine Aminotransferase)',
      aspartate_aminotransferase: 'AST (Aspartate Aminotransferase)',
      total_protiens: 'Total Proteins',
      albumin: 'Albumin',
    },
    classLabels: ['No Liver Disease', 'Liver Disease'],
    clinicalContextCopy:
      'Liver function tests measure enzymes and proteins that reflect hepatocyte health. ALT and AST are released when liver cells are damaged; ALP is elevated in biliary disease; bilirubin reflects conjugation and excretion capacity. This model uses these markers to classify whether liver disease is present.',
    clinicalSenseCheck:
      'ALT is the most liver-specific marker — it is predominantly found in hepatocytes. AST/ALT ratio above 2:1 is characteristic of alcoholic liver disease. Low albumin indicates synthetic liver failure. Bilirubin elevation reflects either hepatocellular damage or biliary obstruction.',
    subgroupFields: ['sex'],
    sampleDataSource: 'Synthetic dataset based on Indian Liver Patient Dataset schema (UCI)',
    estimatedMinutes: 30,
  },

  // ============================================================
  // 19. HAEMATOLOGY ADVANCED — Anaemia Types
  // ============================================================
  {
    id: 'haematology_advanced',
    label: 'Anaemia Type Classification',
    specialty: 'Haematology (Advanced)',
    clinicalQuestion:
      'Can AI classify the type of anaemia (iron deficiency, B12/folate, chronic disease, haemolytic) from blood film and full blood count parameters?',
    whyItMatters:
      'Different anaemia types require completely different treatments — iron supplementation, B12 injections, or treating underlying chronic disease. Misclassification leads to ineffective or harmful treatment.',
    patientPopulation: 'Adults with confirmed anaemia referred for further haematological workup',
    predictedOutcome: 'Anaemia type: iron deficiency, B12/folate deficiency, chronic disease anaemia, or haemolytic anaemia',
    taskType: 'multiclass',
    datasetId: 'haematology_advanced',
    targetColumn: 'anaemia_type',
    suggestedFeatures: [
      'haemoglobin',
      'mcv',
      'mch',
      'mchc',
      'serum_ferritin',
      'b12_level',
    ],
    featureLabels: {
      haemoglobin: 'Haemoglobin (g/dL)',
      mcv: 'Mean Corpuscular Volume (MCV)',
      mch: 'Mean Corpuscular Haemoglobin',
      mchc: 'MCHC',
      serum_ferritin: 'Serum Ferritin (iron stores)',
      b12_level: 'Vitamin B12 Level',
      folate: 'Folate Level',
      reticulocyte_count: 'Reticulocyte Count',
      ldh: 'Lactate Dehydrogenase (LDH)',
      bilirubin: 'Bilirubin Level',
    },
    classLabels: [
      'Iron Deficiency Anaemia',
      'B12/Folate Deficiency',
      'Anaemia of Chronic Disease',
      'Haemolytic Anaemia',
    ],
    clinicalContextCopy:
      'Anaemia type classification requires integrating multiple blood parameters. Iron deficiency gives microcytic, hypochromic red cells (low MCV, MCH, ferritin). B12/folate deficiency causes macrocytosis (high MCV). Chronic disease anaemia is normocytic. Haemolysis raises reticulocytes, LDH, and bilirubin. This multiclass model illustrates how AI handles overlapping clinical patterns.',
    clinicalSenseCheck:
      'MCV is the key initial discriminator — microcytic for iron deficiency, macrocytic for B12/folate, normocytic for chronic disease. Ferritin distinguishes iron deficiency from chronic disease (ferritin is low in iron deficiency but elevated as an acute-phase reactant in chronic disease). Reticulocyte count and LDH flag haemolysis.',
    subgroupFields: ['sex'],
    sampleDataSource: 'Synthetic dataset based on haematological anaemia classification schema',
    estimatedMinutes: 40,
  },

  // ============================================================
  // 20. PHARMACY / READMISSION
  // ============================================================
  {
    id: 'readmission',
    label: 'Diabetic Patient Readmission',
    specialty: 'Pharmacy / Medicines Optimisation',
    clinicalQuestion:
      'Can AI predict 30-day hospital readmission for diabetic patients based on admission characteristics and medication management?',
    whyItMatters:
      'Readmissions in diabetic patients often relate to suboptimal medicines reconciliation and discharge planning. Pharmacist-led interventions have been shown to reduce readmission rates when targeted at high-risk patients.',
    patientPopulation: 'Diabetic adults admitted to hospital',
    predictedOutcome: '30-day readmission following diabetic inpatient admission',
    taskType: 'binary',
    datasetId: 'readmission',
    targetColumn: 'readmitted',
    suggestedFeatures: [
      'num_medications',
      'num_lab_procedures',
      'time_in_hospital',
      'number_diagnoses',
      'a1c_result',
      'age',
    ],
    featureLabels: {
      age: 'Age',
      num_medications: 'Number of Medications',
      num_lab_procedures: 'Number of Lab Procedures',
      num_procedures: 'Number of Clinical Procedures',
      time_in_hospital: 'Length of Stay (days)',
      number_diagnoses: 'Number of Diagnoses',
      a1c_result: 'HbA1c Result Category',
      insulin_change: 'Insulin Regimen Changed',
    },
    classLabels: ['No Readmission', '30-Day Readmission'],
    clinicalContextCopy:
      'Diabetic patients admitted to hospital often have complex medication regimens and multiple comorbidities. This model uses admission characteristics — length of stay, number of medications, procedures, and HbA1c control — to predict readmission risk. It is relevant to pharmacy-led medicines reconciliation and discharge optimisation services.',
    clinicalSenseCheck:
      'Number of medications and diagnoses reflect clinical complexity and polypharmacy risk — both are strong readmission predictors across specialties. Longer hospital stay often indicates more severe illness, paradoxically predicting readmission. HbA1c status reflects glycaemic control quality at admission.',
    subgroupFields: ['age', 'insulin_change'],
    sampleDataSource: 'Synthetic dataset based on UCI Diabetes 130-US Hospitals schema',
    estimatedMinutes: 35,
  },
]

// ============================================================
// Helper
// ============================================================

export function getDomainById(id: string): DomainConfig | undefined {
  return DOMAINS.find((d) => d.id === id)
}
