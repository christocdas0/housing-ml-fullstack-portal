package com.example.market.controller;

import com.example.market.dto.LocationPrice;
import com.example.market.dto.MarketSummary;
import com.example.market.dto.PredictRequest;
import com.example.market.dto.PredictResponse;
import com.example.market.dto.PropertyDto;
import com.example.market.service.MarketService;
import com.example.market.service.MlPredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * MarketController
 * ================
 * REST endpoints for the Property Market Analysis dashboard.
 *
 *  GET /market/summary          → overall stats (avg price, count, top location)
 *  GET /market/top-locations    → list of locations with avg price + count
 *  GET /market/properties       → full property list
 */
@RestController
@RequestMapping("/market")
public class MarketController {

    private final MarketService marketService;
    private final MlPredictionService mlPredictionService;

    public MarketController(MarketService marketService, MlPredictionService mlPredictionService) {
        this.marketService = marketService;
        this.mlPredictionService = mlPredictionService;
    }

    /**
     * GET /market/summary
     * Returns overall market summary: average price, total property count,
     * and the name of the highest-priced location.
     */
    @GetMapping("/summary")
    public MarketSummary getSummary() {
        return marketService.getSummary();
    }

    /**
     * GET /market/average-price
     * Alias endpoint — frontend pings this to check if the API is alive.
     * Returns the same MarketSummary payload.
     */
    @GetMapping("/average-price")
    public MarketSummary getAveragePrice() {
        return marketService.getSummary();
    }

    /**
     * GET /market/top-locations
     * Returns all locations sorted by average price descending.
     */
    @GetMapping("/top-locations")
    public List<LocationPrice> getTopLocations() {
        return marketService.getTopLocations();
    }

    /**
     * GET /market/properties
     * Returns the full list of properties from the dataset.
     */
    @GetMapping("/properties")
    public List<PropertyDto> getProperties() {
        return marketService.getProperties();
    }

    /**
     * POST /market/predict
     * Proxies the request to the Python FastAPI ML model service and returns
     * the predicted house price. Satisfies the requirement:
     * "Java backend: integrate with the ML model container from Task 1".
     *
     * Request body:
     * {
     *   "square_footage": 1550, "bedrooms": 3, "bathrooms": 2.0,
     *   "year_built": 1997, "lot_size": 6800,
     *   "distance_to_city_center": 4.1, "school_rating": 7.6
     * }
     *
     * Returns 200 with predicted_price, or 503 if FastAPI is unreachable.
     */
    @PostMapping("/predict")
    public ResponseEntity<?> predict(@RequestBody PredictRequest request) {
        try {
            PredictResponse response = mlPredictionService.predict(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }
}
