# Multi-stage build cho api-gateway.
# Stage 1: build JAR bằng Maven + JDK 25 (cache ~/.m2 để build nhanh).
# Stage 2: chạy JAR bằng JRE 25 nhẹ hơn.
#
# Build context = thư mục gốc repo (xem docker-compose.yml: build.context = "../..",
# dockerfile = "services/api-gateway/Dockerfile") để build trong root có pom aggregator.

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-25 AS builder

WORKDIR /workspace

# Copy pom trước để Maven cache dependency (layer này chỉ rebuild khi pom đổi)
COPY services/api-gateway/pom.xml ./services/api-gateway/pom.xml
COPY pom.xml ./
COPY services/api-gateway/src ./services/api-gateway/src

# Build skip test (test cần Testcontainers + Docker, không chạy trong image)
RUN cd services/api-gateway && mvn -B -ntp -DskipTests clean package

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:25-jre-alpine AS runtime

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /workspace/services/api-gateway/target/*-SNAPSHOT.jar /app/app.jar

RUN addgroup -S spring && adduser -S spring -G spring \
    && chown -R spring:spring /app
USER spring

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
