# BigQuery & Vertex AI MLOps Pipelines Specification
## Dispatch Rider Aggregator & Food Vendor Storefront

This document details the enterprise data architecture, BigQuery schemas, Change Data Capture (CDC) streaming pipelines, Vertex AI Feature Store setup, and automated Kubeflow/Vertex AI Pipelines for predictive dispatch, fraud detection, and rider matching.

---

### 1. Data Streaming Architecture (Postgres to BigQuery)

```
┌─────────────────────────────────┐
│ Cloud SQL PostgreSQL (PostGIS)  │
│ • Write-Ahead Log (WAL / pgoutput)
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Datastream / Debezium Connector │
│ • Change Data Capture (CDC)     │
└───────────────┬─────────────────┘
                │ (JSON events via Cloud Pub/Sub)
                ▼
┌─────────────────────────────────┐
│ Google Cloud Dataflow           │
│ • Streaming deduplication       │
│ • PII masking & schema mapping  │
└───────────────┬─────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ BigQuery: `foodops_analytics` Data Warehouse          │
│ ├── raw_cdc_events (Partitioned by ingestion timestamp)│
│ ├── features_dispatch (Rolling hourly cluster metrics) │
│ ├── features_fraud (Customer & rider risk signals)     │
│ └── ai_telemetry (Audit & token consumption logs)      │
└────────────────────────────────────────────────────────┘
```

---

### 2. BigQuery Datasets & Schema Definitions

#### 2.1 `raw_cdc_events`
Stores every mutation from the transactional PostgreSQL database for immutable historical reconstruction and feature calculation.

```sql
CREATE OR REPLACE TABLE `foodops_analytics.raw_cdc_events`
(
  event_id STRING NOT NULL,
  source_table STRING NOT NULL, -- 'orders', 'deliveries', 'riders', 'ledger_entries'
  operation STRING NOT NULL,    -- 'INSERT', 'UPDATE', 'DELETE'
  entity_id STRING NOT NULL,
  before_state JSON,
  after_state JSON,
  emitted_at TIMESTAMP NOT NULL,
  ingested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(ingested_at)
CLUSTER BY source_table, entity_id;
```

#### 2.2 `features_dispatch`
Aggregated features per geospatial micro-cluster (Tanke, GRA, Challenge, Fate, Post Office) utilized for training and inference in Vertex AI XGBoost demand forecasting.

```sql
CREATE OR REPLACE TABLE `foodops_analytics.features_dispatch`
(
  feature_timestamp TIMESTAMP NOT NULL,
  cluster_zone STRING NOT NULL,
  hour_of_day INT64 NOT NULL,
  day_of_week INT64 NOT NULL,
  is_weekend BOOL NOT NULL,
  is_payday_window BOOL NOT NULL, -- Days 25-31 and 1-3 of month
  rain_precipitation_mm FLOAT64 DEFAULT 0.0,
  temperature_celsius FLOAT64 DEFAULT 28.5,
  weather_condition STRING DEFAULT 'CLEAR',
  orders_last_1h INT64 NOT NULL,
  orders_last_3h INT64 NOT NULL,
  orders_same_hour_last_week INT64 NOT NULL,
  active_riders_online INT64 NOT NULL,
  avg_delivery_duration_minutes FLOAT64,
  unassigned_orders_count INT64 NOT NULL,
  actual_orders_next_1h INT64 -- Target label for supervised training
)
PARTITION BY DATE(feature_timestamp)
CLUSTER BY cluster_zone, hour_of_day;
```

#### 2.3 `features_fraud`
Customer, vendor, and transaction risk signals for Vertex AI Anomaly Detection.

```sql
CREATE OR REPLACE TABLE `foodops_analytics.features_fraud`
(
  evaluation_id STRING NOT NULL,
  order_id STRING NOT NULL,
  customer_id STRING NOT NULL,
  vendor_id STRING NOT NULL,
  account_age_days INT64 NOT NULL,
  orders_completed_lifetime INT64 NOT NULL,
  orders_last_24h INT64 NOT NULL,
  cancellations_last_7d INT64 NOT NULL,
  refunds_claimed_last_30d INT64 NOT NULL,
  refund_to_order_ratio FLOAT64 NOT NULL,
  device_fingerprints_count INT64 NOT NULL,
  payment_method STRING NOT NULL, -- 'VIRTUAL_ACCOUNT', 'CARD'
  payment_latency_seconds INT64,
  distance_customer_to_vendor_km FLOAT64,
  order_amount_ngn NUMERIC(14, 2) NOT NULL,
  is_flagged_collusion BOOL DEFAULT FALSE,
  ground_truth_chargeback BOOL DEFAULT FALSE -- Target label for supervised evaluation
)
PARTITION BY DATE(evaluation_id_timestamp)
CLUSTER BY customer_id, vendor_id;
```

#### 2.4 `ai_telemetry`
Full audit trail of every Gemini and Vertex AI invocation for operational cost analysis and model governance.

```sql
CREATE OR REPLACE TABLE `foodops_analytics.ai_telemetry`
(
  request_id STRING NOT NULL,
  module STRING NOT NULL, -- 'menu_extract', 'whatsapp_parse', 'forecast', 'fraud', 'support'
  model_name STRING NOT NULL, -- 'gemini-1.5-flash-002', 'gemini-1.5-pro-002', 'gemma-2b-ng'
  entity_id STRING,
  latency_ms INT64 NOT NULL,
  input_tokens INT64,
  output_tokens INT64,
  cost_ngn NUMERIC(10, 4),
  confidence_score FLOAT64,
  cache_hit BOOL DEFAULT FALSE,
  error_code STRING,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY module, model_name;
```

---

### 3. Vertex AI Feature Store Configuration

To bridge low-latency online serving (<15ms) for the NestJS API with high-throughput offline batch training, features are registered in Vertex AI Feature Store:

```
Entity Type: cluster_zone
  Features:
    - avg_orders_h1 (INT64)
    - active_riders (INT64)
    - current_rain_mm (FLOAT64)
    - surge_multiplier (FLOAT64)

Entity Type: customer
  Features:
    - account_age_days (INT64)
    - refund_rate_30d (FLOAT64)
    - cancellations_7d (INT64)
    - lifetime_gmv_ngn (FLOAT64)

Entity Type: rider
  Features:
    - acceptance_rate_30d (FLOAT64)
    - completion_rate_30d (FLOAT64)
    - avg_speed_kmh (FLOAT64)
    - rating_avg (FLOAT64)
```

---

### 4. Vertex AI Training Pipelines (Kubeflow DSL)

#### 4.1 Demand Forecast Pipeline (`forecast_pipeline.py`)

```python
"""
Vertex AI Pipeline for Weekly Cluster Demand Forecasting.
Compiled with Kubeflow Pipelines SDK (v2).
"""
from kfp.v2 import dsl
from kfp.v2.dsl import component, Input, Output, Dataset, Model, Metrics

@component(
    base_image="gcr.io/google.com/cloudsdktool/cloud-sdk:latest",
    packages_to_install=["google-cloud-bigquery", "pandas", "pyarrow"]
)
def extract_dispatch_training_data(
    project_id: str,
    dataset_id: str,
    output_dataset: Output[Dataset]
):
    from google.cloud import bigquery
    client = bigquery.Client(project=project_id)
    query = f"""
        SELECT 
            cluster_zone, hour_of_day, day_of_week, is_weekend, is_payday_window,
            rain_precipitation_mm, temperature_celsius,
            orders_last_1h, orders_last_3h, orders_same_hour_last_week,
            active_riders_online, actual_orders_next_1h
        FROM `{project_id}.{dataset_id}.features_dispatch`
        WHERE feature_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
          AND actual_orders_next_1h IS NOT NULL
    """
    df = client.query(query).to_dataframe()
    df.to_parquet(output_dataset.path)

@component(
    base_image="python:3.10-slim",
    packages_to_install=["xgboost", "pandas", "scikit-learn", "pyarrow", "joblib"]
)
def train_xgboost_forecast_model(
    training_data: Input[Dataset],
    model_output: Output[Model],
    metrics_output: Output[Metrics]
):
    import pandas as pd
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, mean_absolute_error
    import joblib

    df = pd.read_parquet(training_data.path)
    
    # One-hot encode categorical cluster_zone
    df = pd.get_dummies(df, columns=['cluster_zone'])
    
    X = df.drop(columns=['actual_orders_next_1h'])
    y = df['actual_orders_next_1h']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        objective='reg:squarederror'
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse = mean_squared_error(y_test, preds, squared=False)
    mae = mean_absolute_error(y_test, preds)

    metrics_output.log_metric("rmse", float(rmse))
    metrics_output.log_metric("mae", float(mae))

    joblib.dump(model, f"{model_output.path}.joblib")

@component(
    base_image="google/cloud-sdk:latest",
    packages_to_install=["google-cloud-aiplatform"]
)
def deploy_model_to_vertex_endpoint(
    project_id: str,
    region: str,
    model_input: Input[Model],
    endpoint_name: str
):
    from google.cloud import aiplatform
    aiplatform.init(project=project_id, location=region)

    uploaded_model = aiplatform.Model.upload(
        display_name="dispatch-demand-xgboost",
        artifact_uri=model_input.uri,
        serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/xgboost-cpu.1-6:latest"
    )

    endpoint = aiplatform.Endpoint.list(filter=f'display_name="{endpoint_name}"')[0]
    uploaded_model.deploy(
        endpoint=endpoint,
        machine_type="n1-standard-2",
        min_replica_count=1,
        max_replica_count=3,
        traffic_percentage=100
    )

@dsl.pipeline(
    name="weekly-dispatch-forecast-pipeline",
    description="Automated training and deployment of XGBoost demand forecast for Ilorin clusters"
)
def forecast_pipeline(
    project_id: str = "foodops-prod",
    dataset_id: str = "foodops_analytics",
    region: str = "europe-west4",
    endpoint_name: str = "dispatch-forecast-prod"
):
    data_task = extract_dispatch_training_data(project_id=project_id, dataset_id=dataset_id)
    train_task = train_xgboost_forecast_model(training_data=data_task.outputs["output_dataset"])
    deploy_task = deploy_model_to_vertex_endpoint(
        project_id=project_id,
        region=region,
        model_input=train_task.outputs["model_output"],
        endpoint_name=endpoint_name
    )
```

---

### 5. Fraud Anomaly Detection Pipeline

1. **Unsupervised Autoencoder / Isolation Forest:**
   - Detects multidimensional outliers in payment, account creation velocity, and geofence deviations without requiring labeled chargeback data.
2. **Supervised Risk Scorer:**
   - Evaluates composite feature vectors:
     $$P(\text{Fraud}) = \sigma(\beta_0 + \beta_1 \cdot \text{refund\_ratio} + \beta_2 \cdot \text{cancellations} + \beta_3 \cdot \text{velocity})$$
3. **Threshold Calibration:**
   - `P < 0.40`: Auto-approved.
   - `0.40 <= P < 0.75`: Step-up challenge (OTP, bank virtual account pre-confirmation).
   - `0.75 <= P < 0.90`: Enqueue in Admin Fraud Review Queue.
   - `P >= 0.90`: Hard block and account freeze.

---

### 6. MLOps Monitoring, Governance & Drift Detection

#### 6.1 Vertex AI Model Monitoring
Configured on each active prediction endpoint to monitor:
- **Feature Drift:** Calculated using Jensen-Shannon Divergence and Kolmogorov-Smirnov (KS) test comparing inference feature distributions against the training baseline dataset.
- **Alerting Threshold:** If divergence exceeds **0.05**, Cloud Monitoring triggers a webhook notification to `#ops-ai-alerts` on Slack.
- **Automated Fallback:** If inference latency exceeds **450ms** or error rate exceeds **1%**, the NestJS `AiClientService` automatically engages its local statistical fallback heuristic.

#### 6.2 Weekly Retraining Schedule
- Run via Cloud Scheduler: `0 3 * * 1` (Every Monday at 03:00 WAT).
- Vertex AI Pipelines automatically pulls the past 90 days of fresh labeled data from BigQuery, trains a candidate model, compares RMSE against the active production model, and deploys with zero downtime if RMSE improves by $\ge 2\%$.
