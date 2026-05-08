# NASA CMAPSS FD001 QA Prep

This project prepares the NASA CMAPSS turbofan degradation datasets for a simple technical question-answering workflow focused on failure behavior and failure prediction signals.

Current scope:

- parse the raw `FD001` to `FD004` files from `data/`
- compute row-level training `RUL`
- generate reusable processed artifacts in `processed/`
- rank sensors by stability and informativeness

## Project Structure

- `backend/`: backend application code placeholder
- `frontend/`: frontend application code placeholder
- `scripts/`: data processing and utility scripts
- `data/`: raw NASA CMAPSS dataset files
- `processed/`: generated artifacts
- `requirements.txt`: Python dependencies

`data/` and `processed/` are intentionally kept in the repository as directories, but their contents are ignored by git. Only `.gitkeep` is tracked in those folders.

## Setup

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run the processing pipeline:

```powershell
python scripts/process_fd001.py
```

Run the backend locally:

```powershell
python main.py
```

Current backend endpoints:

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/datasets`
- `GET /api/v1/datasets/{dataset_id}/metadata`
- `GET /api/v1/datasets/{dataset_id}/sensors/rankings`
- `GET /api/v1/datasets/{dataset_id}/sensors/informative`
- `GET /api/v1/datasets/{dataset_id}/sensors/stable`
- `GET /api/v1/datasets/{dataset_id}/engines/{engine_id}`

## Generated Outputs

The pipeline writes these files into `processed/` for each dataset subset (`FD001` to `FD004`):

- `fd001_train_processed.csv`: training rows with named columns and computed row-level `RUL`
- `fd001_test_processed.csv`: test rows with named columns
- `fd001_test_rul.json`: true remaining useful life labels for the test engines
- `fd001_metadata.json`: base dataset facts for `FD001`
- `fd001_sensor_stats.json`: first-pass per-feature statistics
- `fd001_sensor_rankings.json`: ranked sensor summary for technical QA
- `fd001_engine_summaries.json`: per-engine drift and degradation summaries

The same file pattern is generated for `fd002`, `fd003`, and `fd004`.

## Step 1

Step 1 creates the base analysis layer for `FD001`.

It provides:

- parsed train and test tables
- computed training `RUL`
- dataset-level metadata
- first-pass feature statistics

This supports:

- subset metadata questions
- baseline sensor inspection
- later engine-level drift summaries
- later degradation-onset heuristics

## Step 2

Step 2 adds a ranked sensor summary for `FD001`.

Each sensor entry in `fd001_sensor_rankings.json` includes:

- `label`: `informative`, `moderate_signal`, or `stable`
- `informativeness_score`
- `rul_correlation`
- `mean_shift_early_to_late`
- `median_abs_engine_corr`
- `trend_sign_consistency`
- `degradation_direction`

This supports questions such as:

- "Which sensors show the clearest degradation trend before failure in FD001?"
- "Which sensors are stable vs informative for failure prediction?"

## Next Planned Step

The next step is engine-level drift summaries so the project can answer questions like:

- "For engine 25, which variables drift most as failure approaches?"
