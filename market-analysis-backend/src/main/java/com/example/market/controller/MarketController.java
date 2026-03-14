package com.example.market.controller;

import com.example.market.dto.LocationPrice;
import com.example.market.dto.MarketSummary;
import com.example.market.dto.PropertyDto;
import com.example.market.service.MarketService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
@CrossOrigin(origins = "http://localhost:3000")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
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
}
