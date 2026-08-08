# Multi-stage build cho catalog-service.
# Stage 1: build JAR bằng Maven + JDK 25 (cache ~/.m2 để build nhanh).
# Stage 2: chạy JAR bằng JRE 25 nhẹ hơn.
#
# Build context = thư mục gốc repo (xem docker-compose.yml: build.context = "../..",
# dockerfile = "services/catalog-service/Dockerfile") để build trong root có .m2.

# ---------- Stage 1: build ----------
FROM maven:3.9-eclipse-temurin-25 AS builder

WORKDIR /workspace

# Copy pom trước để Maven cache dependency (layer này chỉ rebuild khi pom đổi)
COPY services/catalog-service/pom.xml ./services/catalog-service/pom.xml
# Copy root pom (aggregator) — nếu có
COPY pom.xml ./
# Copy source + test
COPY services/catalog-service/src ./services/catalog-service/src

# Build skip test (test cần Testcontainers + Docker, không chạy trong image)
# -B batch mode, -ntp không transfer log
RUN cd services/catalog-service && mvn -B -ntp -DskipTests clean package

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:25-jre-alpine AS runtime

# Curl cho healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy JAR từ stage build
COPY --from=builder /workspace/services/catalog-service/target/*-SNAPSHOT.jar /app/app.jar

# Tạo user non-root cho an toàn
RUN addgroup -S spring && adduser -S spring -G spring \
    && chown -R spring:spring /app
USER spring

# Port do env-overridable SPRING_SERVER_PORT (compose set), mặc định 8082 theo app
EXPOSE 8082

# JVM opts nhẹ cho container + truyền env trực tiếp cho Spring
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
