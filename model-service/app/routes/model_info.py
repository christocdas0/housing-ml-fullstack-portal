"""
app/routes/model_info.py
========================
Endpoint that returns information about the trained ML model.

Purpose:
  - Allows API consumers to know which model is deployed.
  - Shows evaluation metrics so clients can judge model quality.
  - Useful for the frontend "About" or "Model Info" section.

Endpoint:
  GET /model-info

Author : Christo
"""

from fastapi import APIRouter, HTTPException
from app.schemas import ModelInfoResponse
from app.model_loader import get_metrics

router = APIRouter(
    tags=["Model Info"],
)


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Get model information",
    description="""
Returns metadata and evaluation metrics for the currently deployed ML model.

**Metrics explained:**
- `r2_score` — R² (coefficient of determination). 1.0 = perfect model. > 0.85 is good.
- `mae` — Mean Absolute Error in USD. Average dollar error per prediction.
- `rmse` — Root Mean Squared Error. Penalises large errors more than MAE.
    """,
)
async def get_model_info() -> ModelInfoResponse:
    """Return the ML model type, training details, and evaluation metrics."""
    try:
        metrics = get_metrics()

        return ModelInfoResponse(
            model_type       = metrics["model_type"],
            feature_columns  = metrics["feature_columns"],
            target_column    = metrics["target_column"],
            training_samples = metrics["training_samples"],
            test_samples     = metrics["test_samples"],
            r2_score         = metrics["r2_score"],
            mae              = metrics["mae"],
            mse              = metrics["mse"],
            rmse             = metrics["rmse"],
        )

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"metrics.json is missing field: {str(e)}. Re-run train_model.py.",
        )
