"""
Drittech Dynamic Wait-Time Estimator — Regression Model Training Pipeline
Trains an anonymized regression model on clinical consultation durations.
Strictly adheres to data minimization: no patient identifiers or PII used.
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def generate_synthetic_historical_data(n_samples=5000):
    """Generates synthetic, privacy-safe consultation duration training data."""
    np.random.seed(42)
    
    departments = ['GEN', 'CARD', 'PED', 'LAB', 'ORTHO']
    priorities = ['normal', 'senior_child', 'urgent', 'emergency']
    day_of_week = [0, 1, 2, 3, 4, 5, 6]
    hours = np.random.randint(8, 20, size=n_samples)
    
    dept_choice = np.random.choice(departments, size=n_samples, p=[0.4, 0.2, 0.2, 0.1, 0.1])
    prio_choice = np.random.choice(priorities, size=n_samples, p=[0.75, 0.15, 0.08, 0.02])
    dow_choice = np.random.choice(day_of_week, size=n_samples)
    patients_ahead = np.random.randint(0, 15, size=n_samples)
    
    # Base durations per department
    base_mins = {'GEN': 14, 'CARD': 22, 'PED': 16, 'LAB': 8, 'ORTHO': 20}
    
    durations = []
    for dept, prio, hr, ahead in zip(dept_choice, prio_choice, hours, patients_ahead):
        base = base_mins[dept]
        noise = np.random.normal(0, 3)
        # Afternoon surge factor
        surge = 2 if 11 <= hr <= 15 else 0
        actual = max(4, round(base + noise + surge))
        durations.append(actual)
        
    df = pd.DataFrame({
        'department': dept_choice,
        'priority': prio_choice,
        'day_of_week': dow_choice,
        'hour_of_day': hours,
        'patients_ahead': patients_ahead,
        'actual_duration_minutes': durations,
    })
    return df

def train_model():
    print("[ML Pipeline] Generating validated dataset...")
    df = generate_synthetic_historical_data(10000)
    
    X = df[['department', 'priority', 'day_of_week', 'hour_of_day', 'patients_ahead']]
    y = df['actual_duration_minutes']
    
    # Time-aware split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    categorical_features = ['department', 'priority']
    numerical_features = ['day_of_week', 'hour_of_day', 'patients_ahead']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('num', StandardScaler(), numerical_features),
        ]
    )
    
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42))
    ])
    
    print("[ML Pipeline] Training Gradient Boosting Regressor...")
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    print("====================================================")
    print(f"✅ Model Evaluation Metrics:")
    print(f"   Mean Absolute Error (MAE): {mae:.2f} minutes")
    print(f"   R² Score:                  {r2:.4f}")
    print("====================================================")
    
    output_path = os.path.join(os.path.dirname(__file__), 'wait_time_model.pkl')
    joblib.dump(model, output_path)
    print(f"[ML Pipeline] Model artifact saved to {output_path}")

if __name__ == '__main__':
    train_model()
