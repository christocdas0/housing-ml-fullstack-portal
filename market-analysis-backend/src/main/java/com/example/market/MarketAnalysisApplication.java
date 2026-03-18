package com.example.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MarketAnalysisApplication {

	public static void main(String[] args) {
		SpringApplication.run(MarketAnalysisApplication.class, args);
	}

}
