# FD001 Step 1 Outputs

This project now includes a first-pass processing layer for NASA CMAPSS `FD001`.

Run:

```powershell
python process_fd001.py
```

Generated files in `processed/`:

- `fd001_train_processed.csv`: training rows with named columns and computed row-level `RUL`
- `fd001_test_processed.csv`: test rows with named columns
- `fd001_test_rul.json`: true remaining useful life labels for the test engines
- `fd001_metadata.json`: base dataset facts for `FD001`
- `fd001_sensor_stats.json`: first-pass per-feature statistics for later question answering

These outputs are the base layer for the later v1 question types:

- subset metadata questions
- informative vs stable sensor questions
- engine-level drift summaries
- degradation-onset heuristics
