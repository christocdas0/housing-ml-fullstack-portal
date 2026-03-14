package com.example.market.dto;

public record LocationPrice(
        String location,
        double average_price,
        int property_count
) {}
