# FD001 Step 2 Outputs

Step 2 adds a ranked sensor summary for NASA CMAPSS `FD001`.

Run:

```powershell
python process_fd001.py
```

New generated file in `processed/`:

- `fd001_sensor_rankings.json`

Each sensor entry includes:

- `label`: `informative`, `moderate_signal`, or `stable`
- `informativeness_score`: blended ranking score
- `rul_correlation`
- `mean_shift_early_to_late`
- `median_abs_engine_corr`
- `trend_sign_consistency`
- `degradation_direction`

This artifact is the base layer for these target questions:

- "Which sensors show the clearest degradation trend before failure in FD001?"
- "Which sensors are stable vs informative for failure prediction?"
