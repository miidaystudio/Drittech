# Drittech Machine Learning Wait-Time Estimator

This module provides an optional gradient-boosted regression service to estimate outpatient queue waiting times based on:
- Department historical consultation duration
- Priority classification (Urgent, Senior/Child, Normal)
- Day of week and operating hour surge factors
- Number of patients ahead

## Privacy & Data Minimization
This model strictly adheres to data minimization:
- NO patient names
- NO phone numbers
- NO medical history or clinical diagnosis text

## Installation & Training
```bash
pip install -r requirements.txt
python train.py
python predict.py
```
