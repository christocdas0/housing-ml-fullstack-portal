package com.example.market.service;

import com.example.market.dto.PredictRequest;
import com.example.market.dto.PredictResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.logging.Logger;

/**
 * MlPredictionService
 * ===================
 * Calls the Python FastAPI ML model service to get a house price prediction.
 *
 * Uses RestTemplate (synchronous, battle-tested) with an explicit HttpEntity
 * carrying the JSON body and Content-Type header — the most reliable approach
 * for service-to-service POST calls in Spring Boot.
 *
 * Flow:
 *   MarketController → MlPredictionService → POST http://localhost:8000/predict/
 *                                           ← { predicted_price: 287500.00, ... }
 */
@Service
public class MlPredictionService {

    private static final Logger log = Logger.getLogger(MlPredictionService.class.getName());

    private final RestTemplate restTemplate;
    private final String predictUrl;

    public MlPredictionService(RestTemplate restTemplate,
                               @Qualifier("mlServiceUrl") String mlServiceUrl) {
        this.restTemplate = restTemplate;
        this.predictUrl   = mlServiceUrl + "/predict/";
    }

    /**
     * Sends a POST /predict/ request to the FastAPI ML service.
     *
     * @param request  house features (square_footage, bedrooms, etc.)
     * @return         predicted price + echoed input features
     * @throws RuntimeException if FastAPI is unreachable or returns an error
     */
    public PredictResponse predict(PredictRequest request) {
        log.info("[MlPredictionService] POST " + predictUrl
                + " sq_ft=" + request.square_footage()
                + " beds=" + request.bedrooms()
                + " baths=" + request.bathrooms()
                + " year=" + request.year_built()
                + " lot=" + request.lot_size()
                + " dist=" + request.distance_to_city_center()
                + " school=" + request.school_rating());
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<PredictResponse> response =
                    restTemplate.postForEntity(predictUrl, entity, PredictResponse.class);

            PredictResponse body = response.getBody();
            log.info("[MlPredictionService] FastAPI responded HTTP " + response.getStatusCode()
                    + " predicted_price=" + (body != null ? body.predicted_price() : "null"));
            return body;

        } catch (HttpClientErrorException e) {
            log.severe("[MlPredictionService] FastAPI returned HTTP " + e.getStatusCode()
                    + " body: " + e.getResponseBodyAsString());
            throw new RuntimeException("FastAPI validation error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException(
                    "ML service unavailable. Make sure FastAPI is running on port 8000. Details: "
                    + e.getMessage(), e);
        }
    }
}
