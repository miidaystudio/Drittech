"""
Inference script for predicting wait time using the trained regression model.
"""

import sys
import os
import json
import pandas as pd
import joblib

def predict_wait_time(department='GEN', priority='normal', day_of_week=2, hour_of_day=10, patients_ahead=3):
    model_path = os.path.join(os.path.dirname(__file__), 'wait_time_model.pkl')
    
    if not os.path.exists(model_path):
        # Fallback heuristic calculation if artifact not yet generated
        baseline = 15
        return {
            'predicted_wait_minutes': max(0, round(patients_ahead * baseline)),
            'source': 'deterministic_baseline_fallback',
        }
        
    model = joblib.load(model_path)
    df = pd.DataFrame([{
        'department': department,
        'priority': priority,
        'day_of_week': day_of_week,
        'hour_of_day': hour_of_day,
        'patients_ahead': patients_ahead,
    }])
    
    duration_per_patient = model.predict(df)[0]
    total_wait = max(0, round(duration_per_patient * patients_ahead))
    
    return {
        'predicted_wait_minutes': total_wait,
        'estimated_duration_per_patient': round(duration_per_patient, 1),
        'source': 'gradient_boosting_model',
    }

if __name__ == '__main__':
    res = predict_wait_time('GEN', 'normal', 2, 11, 4)
    print(json.dumps(res, indent=2))
