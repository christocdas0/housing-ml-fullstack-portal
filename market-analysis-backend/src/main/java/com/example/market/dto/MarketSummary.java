package com.example.market.dto;

public record MarketSummary(
        double average_price,
        int property_count,
        String top_location
) {}
