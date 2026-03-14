package com.example.market.dto;

public record PropertyDto(
        int id,
        String location,
        int sqft,
        int beds,
        double baths,
        int year,
        double price
) {}
