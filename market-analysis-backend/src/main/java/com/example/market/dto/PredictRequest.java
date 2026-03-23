package com.example.market.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * PredictRequest
 * ==============
 * Request body sent to POST /market/predict.
 * Mirrors the HouseFeatures Pydantic schema in the Python FastAPI service.
 *
 * @JsonProperty annotations ensure Jackson serializes each field with the exact
 * snake_case name that FastAPI's Pydantic model expects, regardless of any
 * Jackson naming strategy configured globally in Spring Boot.
 *
 * Without @JsonProperty, Jackson may silently rename fields (e.g. squareFootage)
 * causing FastAPI to receive unknown/missing fields and return 422.
 */
public record PredictRequest(
        @JsonProperty("square_footage")           double square_footage,
        @JsonProperty("bedrooms")                 int    bedrooms,
        @JsonProperty("bathrooms")                double bathrooms,
        @JsonProperty("year_built")               int    year_built,
        @JsonProperty("lot_size")                 double lot_size,
        @JsonProperty("distance_to_city_center")  double distance_to_city_center,
        @JsonProperty("school_rating")            double school_rating
) {}
