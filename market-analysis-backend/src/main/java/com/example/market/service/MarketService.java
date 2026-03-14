package com.example.market.service;

import com.example.market.dto.LocationPrice;
import com.example.market.dto.MarketSummary;
import com.example.market.dto.PropertyDto;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MarketService
 * =============
 * Reads housing_dataset.csv from the classpath and calculates:
 *  - Overall market summary (average price, property count, top location)
 *  - Per-location stats (average price, count)
 *  - Full property list
 *
 * Locations are derived from distance_to_city_center bands:
 *   < 3 km   → City Center
 *   3–6 km   → Midtown
 *   6–9 km   → Suburbs North
 *   9–12 km  → Suburbs South
 *   > 12 km  → Countryside
 */
@Service
public class MarketService {

    private final List<PropertyDto> properties;

    public MarketService() {
        this.properties = loadCsv();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public MarketSummary getSummary() {
        double avg = properties.stream()
                .mapToDouble(PropertyDto::price)
                .average()
                .orElse(0);

        String topLocation = getTopLocations().stream()
                .findFirst()
                .map(LocationPrice::location)
                .orElse("N/A");

        return new MarketSummary(
                Math.round(avg * 100.0) / 100.0,
                properties.size(),
                topLocation
        );
    }

    public List<LocationPrice> getTopLocations() {
        Map<String, List<PropertyDto>> byLocation = properties.stream()
                .collect(Collectors.groupingBy(PropertyDto::location));

        return byLocation.entrySet().stream()
                .map(e -> {
                    double avgPrice = e.getValue().stream()
                            .mapToDouble(PropertyDto::price)
                            .average()
                            .orElse(0);
                    return new LocationPrice(
                            e.getKey(),
                            Math.round(avgPrice * 100.0) / 100.0,
                            e.getValue().size()
                    );
                })
                .sorted(Comparator.comparingDouble(LocationPrice::average_price).reversed())
                .collect(Collectors.toList());
    }

    public List<PropertyDto> getProperties() {
        return Collections.unmodifiableList(properties);
    }

    // ── CSV Loading ───────────────────────────────────────────────────────────

    private List<PropertyDto> loadCsv() {
        List<PropertyDto> list = new ArrayList<>();
        try {
            ClassPathResource resource = new ClassPathResource("housing_dataset.csv");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                String header = reader.readLine(); // skip header
                if (header == null) return list;

                String line;
                while ((line = reader.readLine()) != null) {
                    String[] cols = line.split(",");
                    if (cols.length < 9) continue;

                    int    id       = Integer.parseInt(cols[0].trim());
                    int    sqft     = Integer.parseInt(cols[1].trim());
                    int    beds     = Integer.parseInt(cols[2].trim());
                    double baths    = Double.parseDouble(cols[3].trim());
                    int    year     = Integer.parseInt(cols[4].trim());
                    double distance = Double.parseDouble(cols[6].trim());
                    double price    = Double.parseDouble(cols[8].trim());

                    String location = toNeighborhood(distance);
                    list.add(new PropertyDto(id, location, sqft, beds, baths, year, price));
                }
            }
        } catch (Exception e) {
            System.err.println("[MarketService] Failed to load CSV: " + e.getMessage());
        }
        return list;
    }

    /**
     * Maps distance_to_city_center (km) to a neighborhood name.
     */
    private String toNeighborhood(double distance) {
        if (distance < 3)  return "City Center";
        if (distance < 6)  return "Midtown";
        if (distance < 9)  return "Suburbs North";
        if (distance < 12) return "Suburbs South";
        return "Countryside";
    }
}
