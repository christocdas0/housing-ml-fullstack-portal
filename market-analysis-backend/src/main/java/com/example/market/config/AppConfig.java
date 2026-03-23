package com.example.market.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * AppConfig
 * =========
 * 1. Global CORS — allows the Next.js portal (port 3000) to call all endpoints
 *    including POST /market/predict. Handles the browser OPTIONS preflight.
 *
 * 2. RestTemplate bean — used by MlPredictionService to call the FastAPI ML
 *    service. RestTemplate is simpler and more reliable than RestClient for
 *    synchronous service-to-service HTTP calls.
 */
@Configuration
public class AppConfig {

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    /** Global CORS — covers every endpoint in the application. */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }

    /** The base URL of the FastAPI ML service — injected into MlPredictionService. */
    @Bean(name = "mlServiceUrl")
    public String mlServiceUrl() {
        return mlServiceUrl;
    }

    /** RestTemplate for synchronous HTTP calls to FastAPI. */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
