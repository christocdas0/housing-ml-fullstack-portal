# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app

# Copy Maven wrapper + pom first (layer-cached — only re-downloads if pom changes)
COPY mvnw mvnw.cmd ./
COPY .mvn .mvn
COPY pom.xml ./

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -q

# Copy source and build the JAR
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy only the built JAR from the builder stage
COPY --from=builder /app/target/market-analysis-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
